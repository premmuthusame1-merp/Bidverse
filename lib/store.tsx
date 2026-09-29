/**
 * BidVerse application store.
 *
 * A single, persisted source of truth for accounts, dealers, auctions, deals,
 * chats, notifications and the transactional mail outbox. All business rules
 * from the product brief live here, so screens stay presentational.
 *
 * The shape mirrors `drizzle/schema.ts`; swapping this module for tRPC calls
 * would not require screen changes.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import {
  AUCTION_START_DELAY_MS,
  CATEGORIES,
  REVERSE_BID_WINDOW_MS,
  auctionSystemMessages,
  categoryName,
  createSeedState,
  type SeedState,
} from "./domain/seed";
import { guessImageKey } from "./domain/images";
import {
  auctionsForBuyer,
  auctionClosesAt,
  auctionStartsAt,
  auctionStatus,
  currentBestDeal,
  daysLeft,
  dealsOf,
  liveAuctionsForDealer,
  notificationsFor,
  participatedAuctionsForDealer,
  specialDeals,
  topDealsOfWeek,
  unreadCount,
  unreadMessages,
} from "./domain/rules";
import type {
  Account,
  AppNotification,
  Auction,
  CategoryRequest,
  ChatMessage,
  DealerProfile,
  Deal,
  MailMessage,
  Product,
} from "./domain/types";

const STORAGE_KEY = "bidverse.state.v2";
const DAY = 24 * 60 * 60 * 1000;

export type AppState = SeedState;

export interface DealerRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  recommendedUsername: string;
  panCardNumber: string;
  aadharCardNumber: string;
  gstNumber: string;
  hasAuthorizedStoreCertificate: boolean;
  authorizedStoreCertificateName?: string;
  storeImageName?: string;
  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  categoryIds: string[];
}

export interface NewAuctionInput {
  productName: string;
  categoryId: string;
  subCategory?: string;
  specifications: string;
  durationDays: number;
  budget: number;
  referralLink?: string;
}

export interface NewProductInput {
  categoryId: string;
  subCategory: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isSpecialDeal: boolean;
  specialDealDays?: number;
}

export interface NewDealInput {
  amount: number;
  freebies?: string;
  specialMentions?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Set when a dealer must change the admin-issued password before entering. */
  mustResetPassword?: boolean;
}

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  session: { accountId: string; dealerId?: string } | null;
  account: Account | null;
  dealer: DealerProfile | null;

  // Auth
  login: (identifier: string, password: string, role: "user" | "dealer" | "admin") => ActionResult;
  registerBuyer: (input: { name: string; email: string; phone: string; password: string }) => ActionResult;
  registerDealer: (input: DealerRegistrationInput) => ActionResult;
  changeTempPassword: (currentPassword: string, newPassword: string) => ActionResult;
  requestPasswordReset: (identifier: string, role: "dealer" | "user") => { ok: boolean; error?: string; code?: string };
  resetPassword: (identifier: string, code: string, newPassword: string) => ActionResult;
  logout: () => void;

  // Dealer actions
  postProduct: (input: NewProductInput) => ActionResult;
  requestCategory: (categoryId: string, reason: string) => ActionResult;
  updateProfile: (input: Partial<Pick<DealerProfile, "storeName" | "city" | "state" | "address" | "pincode">>) => ActionResult;
  placeDeal: (auctionId: string, input: NewDealInput) => ActionResult;
  withdrawDeal: (dealId: string) => ActionResult;
  sendMessage: (auctionId: string, body: string) => ActionResult;

  // Buyer actions
  publishAuction: (input: NewAuctionInput) => { ok: boolean; error?: string; auctionId?: string };
  extendAuction: (auctionId: string, days: number) => ActionResult;
  closeAuction: (auctionId: string, winningDealId?: string) => ActionResult;

  // Admin actions
  approveDealer: (dealerId: string) => ActionResult;
  rejectDealer: (dealerId: string, reason: string) => ActionResult;
  reviewCategoryRequest: (requestId: string, approve: boolean) => ActionResult;

  // Notifications / misc
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getAccount: (id: string) => Account | undefined;
  getDealer: (id: string) => DealerProfile | undefined;
  resetDemoData: () => void;
  /** Mailbox preview helpers (the app has no SMTP in this environment). */
  mailsFor: (email: string) => MailMessage[];
}

const AppContext = createContext<AppContextValue | null>(null);

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

const mailId = () => uid("mail");
const nowMs = () => Date.now();

function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function sixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  // ---- persistence -------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as AppState;
          setState({ ...createSeedState(), ...parsed, categories: CATEGORIES });
        }
      } catch (err) {
        console.warn("[store] failed to hydrate", err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) =>
      console.warn("[store] failed to persist", err),
    );
  }, [state, hydrated]);

  // Keep a second browser tab (for example the dealer tab) in sync.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setState({ ...createSeedState(), ...(JSON.parse(event.newValue) as AppState) });
      } catch {
        /* ignore malformed payloads from other tabs */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---- helpers -----------------------------------------------------------
  const getAccount = useCallback(
    (id: string) => state.accounts.find((a) => a.id === id),
    [state.accounts],
  );
  const getDealer = useCallback(
    (id: string) => state.dealers.find((d) => d.id === id),
    [state.dealers],
  );

  const session = state.session;
  const account = useMemo(
    () => (session ? state.accounts.find((a) => a.id === session.accountId) ?? null : null),
    [session, state.accounts],
  );
  const dealer = useMemo(
    () => (session?.dealerId ? state.dealers.find((d) => d.id === session.dealerId) ?? null : null),
    [session, state.dealers],
  );

  const notify = useCallback(
    (
      accountId: string,
      input: Omit<AppNotification, "id" | "accountId" | "read" | "createdAt">,
    ): AppNotification => ({
      id: uid("ntf"),
      accountId,
      read: false,
      createdAt: nowMs(),
      ...input,
    }),
    [],
  );

  const composeMail = useCallback(
    (
      input: Omit<MailMessage, "id" | "sentAt" | "preview"> & { preview?: string },
    ): MailMessage => ({
      id: mailId(),
      sentAt: nowMs(),
      preview: input.preview ?? input.body.split("\n").filter(Boolean)[1] ?? input.subject,
      ...input,
    }),
    [],
  );

  // ---- auth --------------------------------------------------------------
  const login: AppContextValue["login"] = useCallback(
    (identifier, password, role) => {
      const id = identifier.trim().toLowerCase();
      const acct = state.accounts.find(
        (a) =>
          (a.username?.toLowerCase() === id || a.email.toLowerCase() === id) && a.role === role,
      );
      if (!acct) return { ok: false, error: "No account found with these details." };
      if (acct.password !== password) return { ok: false, error: "Incorrect password." };

      if (role === "dealer") {
        const profile = state.dealers.find((d) => d.accountId === acct.id);
        if (!profile) return { ok: false, error: "Dealer profile not found." };
        if (profile.status === "pending")
          return { ok: false, error: "Your registration is still under verification. You will get the login after approval within 24 hours." };
        if (profile.status === "rejected")
          return { ok: false, error: profile.rejectionReason || "Your dealer registration was rejected." };

        setState((prev) => ({
          ...prev,
          session: { accountId: acct.id, dealerId: profile.id },
        }));
        return { ok: true, mustResetPassword: acct.mustResetPassword };
      }

      setState((prev) => ({ ...prev, session: { accountId: acct.id } }));
      return { ok: true };
    },
    [state.accounts, state.dealers],
  );

  const registerBuyer: AppContextValue["registerBuyer"] = useCallback(
    ({ name, email, phone, password }) => {
      const exists = state.accounts.some(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (exists) return { ok: false, error: "An account with this e-mail already exists." };
      const acct: Account = {
        id: uid("acc"),
        role: "user",
        name,
        email: email.trim(),
        phone,
        password,
        createdAt: nowMs(),
      };
      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, acct],
        session: { accountId: acct.id },
      }));
      return { ok: true };
    },
    [state.accounts],
  );

  const registerDealer: AppContextValue["registerDealer"] = useCallback(
    (input) => {
      const username = input.recommendedUsername.trim().toLowerCase();
      if (state.accounts.some((a) => a.username?.toLowerCase() === username))
        return { ok: false, error: "This username is already taken. Choose another." };
      if (state.accounts.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase()))
        return { ok: false, error: "A dealer with this e-mail already exists." };
      if (input.categoryIds.length === 0)
        return { ok: false, error: "Select at least one category you can deal in." };

      const accountId = uid("acc");
      const dealerId = uid("dlr");
      const acct: Account = {
        id: accountId,
        role: "dealer",
        name: input.storeName || input.fullName,
        email: input.email.trim(),
        phone: input.phone,
        username,
        // The login is issued by the super admin on approval; no password yet.
        password: "",
        mustResetPassword: true,
        createdAt: nowMs(),
      };
      const profile: DealerProfile = {
        id: dealerId,
        accountId,
        fullName: input.fullName,
        email: input.email.trim(),
        phone: input.phone,
        recommendedUsername: username,
        panCardNumber: input.panCardNumber,
        aadharCardNumber: input.aadharCardNumber,
        gstNumber: input.gstNumber,
        hasAuthorizedStoreCertificate: input.hasAuthorizedStoreCertificate,
        authorizedStoreCertificateName: input.authorizedStoreCertificateName,
        storeImageName: input.storeImageName,
        storeName: input.storeName,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        latitude: input.latitude,
        longitude: input.longitude,
        categoryIds: input.categoryIds,
        status: "pending",
        submittedAt: nowMs(),
      };

      const registrationMail = composeMail({
        to: profile.email,
        subject: "BidVerse dealer registration received",
        category: "registration",
        preview: "Your documents are under verification. Login will follow within 24 hours of approval.",
        body: `Hello ${profile.fullName},\n\nThank you for registering ${profile.storeName} on BidVerse.\n\nDocuments received: PAN Card, Aadhaar Card, GST Number (${profile.gstNumber || "—"}), Store Image${profile.hasAuthorizedStoreCertificate ? ", Authorized Store Certificate" : ""}.\nCategories requested: ${profile.categoryIds
          .map((c) => categoryName(c))
          .join(", ")}.\n\nYour recommended username is "${profile.recommendedUsername}".\nOur super admin team will verify your documents. You will get the login after approval, within 24 hours.\n\n— Team BidVerse`,
      });

      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, acct],
        dealers: [...prev.dealers, profile],
        mail: [registrationMail, ...prev.mail],
        notifications: [
          notify(prev.accounts.find((a) => a.role === "admin")?.id ?? "acc-admin", {
            type: "dealer_registered",
            title: "Dealer awaiting verification",
            body: `${profile.storeName} (${profile.recommendedUsername}) submitted documents for approval.`,
          }),
          ...prev.notifications,
        ],
      }));
      return { ok: true };
    },
    [composeMail, notify, state.accounts],
  );

  const changeTempPassword: AppContextValue["changeTempPassword"] = useCallback(
    (currentPassword, newPassword) => {
      if (!account) return { ok: false, error: "You are not signed in." };
      if (account.password !== currentPassword) return { ok: false, error: "Temporary password is incorrect." };
      if (newPassword.length < 6) return { ok: false, error: "New password must be at least 6 characters." };
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === account.id ? { ...a, password: newPassword, mustResetPassword: false, tempPassword: undefined } : a,
        ),
      }));
      return { ok: true };
    },
    [account],
  );

  const requestPasswordReset: AppContextValue["requestPasswordReset"] = useCallback(
    (identifier, role) => {
      const id = identifier.trim().toLowerCase();
      const acct = state.accounts.find(
        (a) => (a.username?.toLowerCase() === id || a.email.toLowerCase() === id) && a.role === role,
      );
      if (!acct) return { ok: false, error: `No ${role} account found with these details.` };

      const code = sixDigitCode();
      const mail = composeMail({
        to: acct.email,
        subject: "Your BidVerse verification code",
        category: "password_reset",
        preview: `Verification code: ${code} (valid for 10 minutes).`,
        body: `Hello ${acct.name},\n\nYour BidVerse verification code is ${code}.\n\nEnter this code to set a new password. The code is valid for 10 minutes.\nIf you did not request this, please ignore this e-mail.\n\n— Team BidVerse`,
      });
      setState((prev) => ({ ...prev, mail: [mail, ...prev.mail] }));
      // The code is returned so the sandbox (which has no SMTP) can surface it.
      return { ok: true, code };
    },
    [composeMail, state.accounts],
  );

  const resetPassword: AppContextValue["resetPassword"] = useCallback(
    (identifier, code, newPassword) => {
      const id = identifier.trim().toLowerCase();
      const acct = state.accounts.find(
        (a) => a.username?.toLowerCase() === id || a.email.toLowerCase() === id,
      );
      if (!acct) return { ok: false, error: "Account not found." };
      const matching = state.mail.find(
        (m) => m.to === acct.email && m.category === "password_reset" && m.body.includes(code.trim()),
      );
      if (!matching) return { ok: false, error: "Invalid verification code." };
      if (nowMs() - matching.sentAt > 10 * 60 * 1000)
        return { ok: false, error: "This code has expired. Request a new one." };
      if (newPassword.length < 6) return { ok: false, error: "New password must be at least 6 characters." };

      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === acct.id ? { ...a, password: newPassword, mustResetPassword: false } : a,
        ),
      }));
      return { ok: true };
    },
    [state.accounts, state.mail],
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, session: null }));
  }, []);

  // ---- dealer ------------------------------------------------------------
  const postProduct: AppContextValue["postProduct"] = useCallback(
    (input) => {
      if (!dealer) return { ok: false, error: "Dealer profile not found." };
      if (!dealer.categoryIds.includes(input.categoryId))
        return { ok: false, error: "You can only post in the categories you registered for. Raise a category request in Settings." };
      if (!input.name.trim()) return { ok: false, error: "Product name is required." };
      const product: Product = {
        id: uid("prd"),
        dealerId: dealer.id,
        categoryId: input.categoryId,
        subCategory: input.subCategory,
        name: input.name.trim(),
        description: input.description,
        price: input.price,
        originalPrice: input.originalPrice,
        isSpecialDeal: input.isSpecialDeal,
        specialDealDays: input.isSpecialDeal ? input.specialDealDays : undefined,
        specialDealEndsAt:
          input.isSpecialDeal && input.specialDealDays
            ? nowMs() + input.specialDealDays * DAY
            : undefined,
        image: guessImageKey(input.name),
        postedAt: nowMs(),
      };
      setState((prev) => ({ ...prev, products: [product, ...prev.products] }));
      return { ok: true };
    },
    [dealer],
  );

  const requestCategory: AppContextValue["requestCategory"] = useCallback(
    (categoryId, reason) => {
      if (!dealer) return { ok: false, error: "Dealer profile not found." };
      if (dealer.categoryIds.includes(categoryId))
        return { ok: false, error: "You already deal in this category." };
      if (state.categoryRequests.some((r) => r.dealerId === dealer.id && r.categoryId === categoryId && r.status === "pending"))
        return { ok: false, error: "A request for this category is already pending." };
      const request: CategoryRequest = {
        id: uid("creq"),
        dealerId: dealer.id,
        categoryId,
        reason,
        status: "pending",
        requestedAt: nowMs(),
      };
      setState((prev) => ({
        ...prev,
        categoryRequests: [request, ...prev.categoryRequests],
        notifications: [
          notify(prev.accounts.find((a) => a.role === "admin")?.id ?? "acc-admin", {
            type: "category_request",
            title: "New category request",
            body: `${dealer.storeName} requested ${categoryName(categoryId)}.`,
          }),
          ...prev.notifications,
        ],
      }));
      return { ok: true };
    },
    [dealer, notify, state.categoryRequests],
  );

  const updateProfile: AppContextValue["updateProfile"] = useCallback(
    (input) => {
      if (!dealer) return { ok: false, error: "Dealer profile not found." };
      setState((prev) => ({
        ...prev,
        dealers: prev.dealers.map((d) => (d.id === dealer.id ? { ...d, ...input } : d)),
      }));
      return { ok: true };
    },
    [dealer],
  );

  const placeDeal: AppContextValue["placeDeal"] = useCallback(
    (auctionId, input) => {
      if (!dealer) return { ok: false, error: "Dealer profile not found." };
      const auction = state.auctions.find((a) => a.id === auctionId);
      if (!auction) return { ok: false, error: "Auction not found." };
      if (!dealer.categoryIds.includes(auction.categoryId))
        return { ok: false, error: "This auction is outside your registered categories." };

      const now = nowMs();
      const status = auctionStatus(auction, now);
      if (status === "scheduled") return { ok: false, error: "This auction has not started yet." };
      if (status === "closed") return { ok: false, error: "This auction is closed." };
      if (!(input.amount > 0)) return { ok: false, error: "Enter a valid deal amount." };
      if (input.amount > auction.budget)
        return { ok: false, error: `Your offer must be at or below the buyer's budget of ₹${auction.budget.toLocaleString("en-IN")}.` };

      const best = currentBestDeal(state.deals, auctionId);
      if (best && input.amount >= best.amount)
        return {
          ok: false,
          error: `This is a reverse auction — your offer must beat ₹${best.amount.toLocaleString("en-IN")}.`,
        };

      const deal: Deal = {
        id: uid("deal"),
        auctionId,
        dealerId: dealer.id,
        amount: input.amount,
        freebies: input.freebies,
        specialMentions: input.specialMentions,
        isLatest: true,
        withdrawn: false,
        createdAt: now,
      };

      const message: ChatMessage = {
        id: uid("msg"),
        auctionId,
        senderId: dealer.accountId,
        senderRole: "dealer",
        senderName: dealer.storeName,
        body: `Deal posted: ₹${input.amount.toLocaleString("en-IN")}${input.freebies ? ` · ${input.freebies}` : ""}`,
        kind: "deal",
        dealId: deal.id,
        createdAt: now,
      };

      const windowStarted = !auction.firstBidAt;

      setState((prev) => ({
        ...prev,
        deals: [deal, ...prev.deals],
        messages: [...prev.messages, message],
        auctions: prev.auctions.map((a) =>
          a.id === auctionId
            ? {
                ...a,
                firstBidAt: a.firstBidAt ?? now,
                biddingEndsAt: a.biddingEndsAt ?? Math.min(now + REVERSE_BID_WINDOW_MS, a.endsAt),
                status: a.status === "extended" ? "extended" : "live",
              }
            : a,
        ),
        notifications: [
          notify(auction.userId, {
            type: "new_deal",
            title: `New deal on ${auction.productName}`,
            body: `${dealer.storeName} offered ₹${input.amount.toLocaleString("en-IN")}${input.freebies ? ` with ${input.freebies}` : ""}.`,
            auctionId,
          }),
          ...prev.notifications,
        ],
      }));

      if (windowStarted) {
        const systemMessage: ChatMessage = {
          id: uid("msg"),
          auctionId,
          senderId: "system",
          senderRole: "admin",
          senderName: "BidVerse",
          body: "First deal received — the 20 minute reverse-bidding window is now open.",
          kind: "system",
          createdAt: now,
        };
        setState((prev) => ({ ...prev, messages: [...prev.messages, systemMessage] }));
      }
      return { ok: true };
    },
    [dealer, notify, state.auctions, state.deals],
  );

  const withdrawDeal: AppContextValue["withdrawDeal"] = useCallback(
    (dealId) => {
      if (!dealer) return { ok: false, error: "Sign in as a dealer." };
      const deal = state.deals.find((d) => d.id === dealId);
      if (!deal || deal.dealerId !== dealer.id) return { ok: false, error: "Deal not found." };
      setState((prev) => ({
        ...prev,
        deals: prev.deals.map((d) => (d.id === dealId ? { ...d, withdrawn: true, isLatest: false } : d)),
      }));
      return { ok: true };
    },
    [dealer, state.deals],
  );

  const sendMessage: AppContextValue["sendMessage"] = useCallback(
    (auctionId, body) => {
      if (!account) return { ok: false, error: "Sign in to chat." };
      if (!body.trim()) return { ok: false, error: "Message is empty." };
      const message: ChatMessage = {
        id: uid("msg"),
        auctionId,
        senderId: account.id,
        senderRole: account.role,
        senderName: account.role === "dealer" ? dealer?.storeName ?? account.name : account.name,
        body: body.trim(),
        kind: "text",
        createdAt: nowMs(),
      };
      const auction = state.auctions.find((a) => a.id === auctionId);
      const recipients =
        account.role === "dealer"
          ? auction
            ? [auction.userId]
            : []
          : state.dealers
              .filter((d) => auction && d.categoryIds.includes(auction.categoryId) && d.status === "approved")
              .map((d) => d.accountId);

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
        notifications: [
          ...recipients.map((rid) =>
            notify(rid, {
              type: "chat_message",
              title: `New message from ${message.senderName}`,
              body: message.body.slice(0, 90),
              auctionId,
            }),
          ),
          ...prev.notifications,
        ],
      }));
      return { ok: true };
    },
    [account, dealer, notify, state.auctions, state.dealers],
  );

  // ---- buyer -------------------------------------------------------------
  const publishAuction: AppContextValue["publishAuction"] = useCallback(
    (input) => {
      if (!account) return { ok: false, error: "Sign in to publish an auction." };
      if (!input.productName.trim()) return { ok: false, error: "Product name is required." };
      if (!(input.budget > 0)) return { ok: false, error: "Enter your deal amount." };
      if (!(input.durationDays > 0)) return { ok: false, error: "Enter how many days the auction should stay open." };

      const publishedAt = nowMs();
      const auction: Auction = {
        id: uid("auc"),
        userId: account.id,
        categoryId: input.categoryId,
        subCategory: input.subCategory,
        productName: input.productName.trim(),
        specifications: input.specifications,
        durationDays: input.durationDays,
        budget: input.budget,
        referralLink: input.referralLink,
        status: "scheduled",
        publishedAt,
        startsAt: auctionStartsAt(publishedAt),
        endsAt: publishedAt + input.durationDays * DAY,
        extensionDays: 0,
      };

      // Only dealers registered for the matching category get notified.
      const targets = state.dealers.filter(
        (d) => d.status === "approved" && d.categoryIds.includes(input.categoryId),
      );

      setState((prev) => ({
        ...prev,
        auctions: [auction, ...prev.auctions],
        messages: [...prev.messages, ...auctionSystemMessages(auction, publishedAt)],
        notifications: [
          ...targets.map((d) =>
            notify(d.accountId, {
              type: "auction_published",
              title: `New auction in ${categoryName(input.categoryId)}`,
              body: `${auction.productName} · budget ₹${input.budget.toLocaleString("en-IN")} · bidding opens in 10 minutes.`,
              auctionId: auction.id,
            }),
          ),
          ...prev.notifications,
        ],
      }));
      return { ok: true, auctionId: auction.id };
    },
    [account, notify, state.dealers],
  );

  const extendAuction: AppContextValue["extendAuction"] = useCallback(
    (auctionId, days) => {
      if (!account) return { ok: false, error: "Sign in first." };
      if (!(days > 0)) return { ok: false, error: "Enter the number of extra days." };
      const auction = state.auctions.find((a) => a.id === auctionId);
      if (!auction) return { ok: false, error: "Auction not found." };
      if (auction.userId !== account.id) return { ok: false, error: "Only the buyer can extend this auction." };

      const newEnd = auction.endsAt + days * DAY;
      const systemMessage: ChatMessage = {
        id: uid("msg"),
        auctionId,
        senderId: "system",
        senderRole: "admin",
        senderName: "BidVerse",
        body: `Auction extended by ${days} day${days > 1 ? "s" : ""}. New closing time updated for all dealers.`,
        kind: "system",
        createdAt: nowMs(),
      };
      const targets = state.deals
        .filter((d) => d.auctionId === auctionId)
        .map((d) => state.dealers.find((x) => x.id === d.dealerId))
        .filter((d): d is DealerProfile => Boolean(d));

      setState((prev) => ({
        ...prev,
        auctions: prev.auctions.map((a) =>
          a.id === auctionId
            ? {
                ...a,
                endsAt: newEnd,
                biddingEndsAt: a.biddingEndsAt ? a.biddingEndsAt + days * DAY : a.biddingEndsAt,
                extensionDays: a.extensionDays + days,
                extendedAt: nowMs(),
                status: a.status === "closed" ? "extended" : "extended",
              }
            : a,
        ),
        messages: [...prev.messages, systemMessage],
        notifications: [
          ...targets.map((d) =>
            notify(d.accountId, {
              type: "auction_extended",
              title: `${auction.productName} auction extended`,
              body: `The buyer added ${days} more day${days > 1 ? "s" : ""}. Keep your best offer updated.`,
              auctionId,
            }),
          ),
          ...prev.notifications,
        ],
      }));
      return { ok: true };
    },
    [account, notify, state.auctions, state.deals, state.dealers],
  );

  const closeAuction: AppContextValue["closeAuction"] = useCallback(
    (auctionId, winningDealId) => {
      if (!account) return { ok: false, error: "Sign in first." };
      const auction = state.auctions.find((a) => a.id === auctionId);
      if (!auction) return { ok: false, error: "Auction not found." };
      if (auction.userId !== account.id) return { ok: false, error: "Only the buyer can close this auction." };

      const systemMessage: ChatMessage = {
        id: uid("msg"),
        auctionId,
        senderId: "system",
        senderRole: "admin",
        senderName: "BidVerse",
        body: "Auction closed by the buyer. The selected offer is now final.",
        kind: "system",
        createdAt: nowMs(),
      };
      const winner = winningDealId ? state.deals.find((d) => d.id === winningDealId) : undefined;
      const winnerDealer = winner ? state.dealers.find((d) => d.id === winner.dealerId) : undefined;

      setState((prev) => ({
        ...prev,
        auctions: prev.auctions.map((a) =>
          a.id === auctionId
            ? { ...a, status: "closed", closedAt: nowMs(), winningDealId: winningDealId ?? a.winningDealId }
            : a,
        ),
        deals: prev.deals.map((d) => (d.id === winningDealId ? { ...d, isLatest: true } : d)),
        messages: [...prev.messages, systemMessage],
        notifications: [
          ...(winnerDealer
            ? [
                notify(winnerDealer.accountId, {
                  type: "auction_closed",
                  title: `You won ${auction.productName}`,
                  body: "Your offer was selected by the buyer. They will contact you on chat.",
                  auctionId,
                }),
              ]
            : []),
          ...prev.notifications,
        ],
      }));
      return { ok: true };
    },
    [account, notify, state.auctions, state.deals, state.dealers],
  );

  // ---- admin -------------------------------------------------------------
  const approveDealer: AppContextValue["approveDealer"] = useCallback(
    (dealerId) => {
      const profile = state.dealers.find((d) => d.id === dealerId);
      if (!profile) return { ok: false, error: "Dealer not found." };
      const password = tempPassword();
      const mail = composeMail({
        to: profile.email,
        subject: "Your registration has been accepted — BidVerse dealer login",
        category: "dealer_approval",
        preview: `Username: ${profile.recommendedUsername} · Temporary password: ${password}`,
        body: `Hello ${profile.fullName},\n\nYour registration has been accepted.\n\nDealer: ${profile.storeName}\nUsername: ${profile.recommendedUsername}\nTemporary password: ${password}\n\nSign in with this username and temporary password. You will be asked to set a new password on your first login.\n\n— Super Admin, BidVerse`,
      });

      setState((prev) => ({
        ...prev,
        dealers: prev.dealers.map((d) =>
          d.id === dealerId ? { ...d, status: "approved", reviewedAt: nowMs(), rejectionReason: undefined } : d,
        ),
        accounts: prev.accounts.map((a) =>
          a.id === profile.accountId
            ? { ...a, password, tempPassword: password, mustResetPassword: true }
            : a,
        ),
        mail: [mail, ...prev.mail],
        notifications: [
          notify(profile.accountId, {
            type: "dealer_approved",
            title: "Registration accepted",
            body: "Your dealer login has been issued. Check your e-mail for the temporary password.",
          }),
          ...prev.notifications,
        ],
      }));
      return { ok: true };
    },
    [composeMail, notify, state.dealers],
  );

  const rejectDealer: AppContextValue["rejectDealer"] = useCallback(
    (dealerId, reason) => {
      const profile = state.dealers.find((d) => d.id === dealerId);
      if (!profile) return { ok: false, error: "Dealer not found." };
      const mail = composeMail({
        to: profile.email,
        subject: "BidVerse dealer registration update",
        category: "dealer_rejection",
        preview: reason || "Documents could not be verified.",
        body: `Hello ${profile.fullName},\n\nWe could not approve your dealer registration for ${profile.storeName}.\n\nReason: ${reason || "Documents could not be verified."}\n\nYou can re-apply with corrected documents.\n\n— Super Admin, BidVerse`,
      });
      setState((prev) => ({
        ...prev,
        dealers: prev.dealers.map((d) =>
          d.id === dealerId ? { ...d, status: "rejected", reviewedAt: nowMs(), rejectionReason: reason } : d,
        ),
        mail: [mail, ...prev.mail],
        notifications: [
          notify(profile.accountId, {
            type: "dealer_rejected",
            title: "Registration not approved",
            body: reason || "Documents could not be verified.",
          }),
          ...prev.notifications,
        ],
      }));
      return { ok: true };
    },
    [composeMail, notify, state.dealers],
  );

  const reviewCategoryRequest: AppContextValue["reviewCategoryRequest"] = useCallback(
    (requestId, approve) => {
      const request = state.categoryRequests.find((r) => r.id === requestId);
      if (!request) return { ok: false, error: "Request not found." };
      const profile = state.dealers.find((d) => d.id === request.dealerId);
      setState((prev) => ({
        ...prev,
        categoryRequests: prev.categoryRequests.map((r) =>
          r.id === requestId
            ? { ...r, status: approve ? "approved" : "rejected", reviewedAt: nowMs() }
            : r,
        ),
        dealers: approve
          ? prev.dealers.map((d) =>
              d.id === request.dealerId && !d.categoryIds.includes(request.categoryId)
                ? { ...d, categoryIds: [...d.categoryIds, request.categoryId] }
                : d,
            )
          : prev.dealers,
        notifications: profile
          ? [
              notify(profile.accountId, {
                type: "category_request",
                title: approve ? `Category approved: ${categoryName(request.categoryId)}` : "Category request declined",
                body: approve
                  ? "You can now post products and bid in this category."
                  : "Your request was reviewed and declined by the super admin.",
              }),
              ...prev.notifications,
            ]
          : prev.notifications,
      }));
      return { ok: true };
    },
    [notify, state.categoryRequests, state.dealers],
  );

  // ---- notifications / misc ---------------------------------------------
  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    if (!account) return;
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.accountId === account.id ? { ...n, read: true } : n,
      ),
    }));
  }, [account]);

  const resetDemoData = useCallback(() => {
    const fresh = createSeedState();
    setState(fresh);
  }, []);

  const mailsFor = useCallback(
    (email: string) => state.mail.filter((m) => m.to.toLowerCase() === email.toLowerCase()),
    [state.mail],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      session,
      account,
      dealer,
      login,
      registerBuyer,
      registerDealer,
      changeTempPassword,
      requestPasswordReset,
      resetPassword,
      logout,
      postProduct,
      requestCategory,
      updateProfile,
      placeDeal,
      withdrawDeal,
      sendMessage,
      publishAuction,
      extendAuction,
      closeAuction,
      approveDealer,
      rejectDealer,
      reviewCategoryRequest,
      markNotificationRead,
      markAllNotificationsRead,
      getAccount,
      getDealer,
      resetDemoData,
      mailsFor,
    }),
    [
      state,
      hydrated,
      session,
      account,
      dealer,
      login,
      registerBuyer,
      registerDealer,
      changeTempPassword,
      requestPasswordReset,
      resetPassword,
      logout,
      postProduct,
      requestCategory,
      updateProfile,
      placeDeal,
      withdrawDeal,
      sendMessage,
      publishAuction,
      extendAuction,
      closeAuction,
      approveDealer,
      rejectDealer,
      reviewCategoryRequest,
      markNotificationRead,
      markAllNotificationsRead,
      getAccount,
      getDealer,
      resetDemoData,
      mailsFor,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export { AppProvider, STORAGE_KEY };

// Re-export the pure auction rules so screens have a single import site.
export {
  auctionsForBuyer,
  auctionClosesAt,
  auctionStartsAt,
  auctionStatus,
  currentBestDeal,
  daysLeft,
  dealsOf,
  liveAuctionsForDealer,
  notificationsFor,
  participatedAuctionsForDealer,
  specialDeals,
  topDealsOfWeek,
  unreadCount,
  unreadMessages,
};
