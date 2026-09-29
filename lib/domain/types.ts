/**
 * BidVerse domain types.
 *
 * These types mirror the Drizzle tables in `drizzle/schema.ts` one-to-one so the
 * client data layer can be swapped for the tRPC/server implementation without
 * touching any screen code.
 */

export type Role = "user" | "dealer" | "admin";

export type DealerStatus = "pending" | "approved" | "rejected";

export type AuctionStatus =
  | "scheduled"
  | "live"
  | "extended"
  | "closed"
  | "cancelled";

/** A login identity in the app (buyer, dealer or super admin). */
export interface Account {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  password: string;
  /** Dealers must change the admin-issued temporary password on first login. */
  mustResetPassword?: boolean;
  tempPassword?: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  /** Product families inside a category, e.g. Electronics → Phones, Laptops. */
  subCategories: string[];
  icon: string;
  /** Dealer registrations pick from the top-level families. */
  sortOrder: number;
}

export interface DealerProfile {
  id: string;
  accountId: string;

  fullName: string;
  email: string;
  phone: string;
  /** Username the dealer recommends at registration. */
  recommendedUsername: string;

  // Documents
  panCardNumber: string;
  aadharCardNumber: string;
  gstNumber: string;
  hasAuthorizedStoreCertificate: boolean;
  authorizedStoreCertificateName?: string;
  storeImageName?: string;

  // Business / location
  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;

  /** Category ids the dealer is approved to deal in. */
  categoryIds: string[];

  status: DealerStatus;
  submittedAt: number;
  reviewedAt?: number;
  rejectionReason?: string;
}

export type CategoryRequestStatus = "pending" | "approved" | "rejected";

export interface CategoryRequest {
  id: string;
  dealerId: string;
  categoryId: string;
  reason: string;
  status: CategoryRequestStatus;
  requestedAt: number;
  reviewedAt?: number;
}

export interface Product {
  id: string;
  dealerId: string;
  categoryId: string;
  subCategory: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isSpecialDeal: boolean;
  /** Days left that the dealer entered when flagging a special deal. */
  specialDealDays?: number;
  specialDealEndsAt?: number;
  image?: string;
  postedAt: number;
}

export interface Auction {
  id: string;
  /** Buyer who published the requirement. */
  userId: string;
  categoryId: string;
  subCategory?: string;

  productName: string;
  specifications: string;
  /** "How many days the auction can be open" as entered by the buyer. */
  durationDays: number;
  /** Buyer's deal amount (budget). */
  budget: number;
  referralLink?: string;

  status: AuctionStatus;
  publishedAt: number;
  /** Auction opens 10 minutes after it is posted. */
  startsAt: number;
  /** Buyer-defined close time. */
  endsAt: number;
  /** Set when the first bid lands: the 20 minute reverse-bidding window. */
  firstBidAt?: number;
  biddingEndsAt?: number;

  extensionDays: number;
  extendedAt?: number;

  winningDealId?: string;
  closedAt?: number;
}

export interface Deal {
  id: string;
  auctionId: string;
  dealerId: string;
  amount: number;
  freebies?: string;
  specialMentions?: string;
  /** true when this is the dealer's most recent active offer. */
  isLatest: boolean;
  withdrawn: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  auctionId: string;
  senderId: string;
  senderRole: Role;
  senderName: string;
  body: string;
  /** "deal" messages are rendered as deal cards inside the chat. */
  kind: "text" | "deal" | "system";
  dealId?: string;
  createdAt: number;
}

export type NotificationType =
  | "auction_published"
  | "new_deal"
  | "deal_updated"
  | "auction_starting"
  | "auction_closing"
  | "auction_closed"
  | "auction_extended"
  | "dealer_registered"
  | "dealer_approved"
  | "dealer_rejected"
  | "category_request"
  | "chat_message";

export interface AppNotification {
  id: string;
  /** Account that receives the notification. */
  accountId: string;
  type: NotificationType;
  title: string;
  body: string;
  auctionId?: string;
  read: boolean;
  createdAt: number;
}

/** Every transactional e-mail the flows would send, captured for review. */
export interface MailMessage {
  id: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  category: "dealer_approval" | "dealer_rejection" | "password_reset" | "registration" | "system";
  sentAt: number;
}

export interface SessionState {
  accountId: string;
  dealerId?: string;
}
