/**
 * Pure business rules for BidVerse auctions.
 *
 * Kept free of React Native imports so they can be unit tested and reused by
 * the server implementation.
 */
import { AUCTION_START_DELAY_MS, REVERSE_BID_WINDOW_MS } from "./seed";
import type {
  AppNotification,
  Auction,
  ChatMessage,
  DealerProfile,
  Deal,
  Product,
} from "./types";

const DAY = 24 * 60 * 60 * 1000;

export { AUCTION_START_DELAY_MS, REVERSE_BID_WINDOW_MS };

export interface RuleState {
  auctions: Auction[];
  deals: Deal[];
  products: Product[];
  dealers: DealerProfile[];
  notifications: AppNotification[];
  messages: ChatMessage[];
}

/** Auction start time = publish time + 10 minutes (per the product brief). */
export function auctionStartsAt(publishedAt: number): number {
  return publishedAt + AUCTION_START_DELAY_MS;
}

/** The moment an auction stops accepting new deals. */
export function auctionClosesAt(auction: Auction): number {
  const byWindow = auction.firstBidAt ? auction.biddingEndsAt ?? auction.endsAt : auction.endsAt;
  return Math.min(byWindow, auction.endsAt);
}

export function auctionStatus(auction: Auction, now: number): Auction["status"] {
  if (auction.status === "closed" || auction.status === "cancelled") return auction.status;
  if (now < auction.startsAt) return "scheduled";
  if (now >= auctionClosesAt(auction)) return "closed";
  if (auction.status === "extended") return "extended";
  return "live";
}

export function currentBestDeal(deals: Deal[], auctionId: string): Deal | undefined {
  return deals
    .filter((d) => d.auctionId === auctionId && !d.withdrawn)
    .sort((a, b) => a.amount - b.amount || b.createdAt - a.createdAt)[0];
}

export function dealsOf(deals: Deal[], auctionId: string): Deal[] {
  return deals
    .filter((d) => d.auctionId === auctionId && !d.withdrawn)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function liveAuctionsForDealer(
  state: RuleState,
  dealer: DealerProfile,
  now: number,
): Auction[] {
  return state.auctions
    .filter((a) => dealer.categoryIds.includes(a.categoryId))
    .filter((a) => {
      const status = auctionStatus(a, now);
      if (status !== "live" && status !== "scheduled" && status !== "extended") return false;
      // Once a dealer has posted a deal the auction moves to "Participated".
      return !state.deals.some((d) => d.auctionId === a.id && d.dealerId === dealer.id && !d.withdrawn);
    })
    .sort((a, b) => a.endsAt - b.endsAt);
}

export function participatedAuctionsForDealer(
  state: RuleState,
  dealer: DealerProfile,
  now: number,
): Auction[] {
  return state.auctions
    .filter((a) => state.deals.some((d) => d.auctionId === a.id && d.dealerId === dealer.id && !d.withdrawn))
    .filter((a) => auctionStatus(a, now) !== "cancelled")
    .sort((a, b) => {
      const aLive = auctionStatus(a, now) === "closed" ? 1 : 0;
      const bLive = auctionStatus(b, now) === "closed" ? 1 : 0;
      if (aLive !== bLive) return aLive - bLive; // open chats first
      return auctionClosesAt(a) - auctionClosesAt(b); // soonest timer first
    });
}

export function auctionsForBuyer(state: RuleState, accountId: string, now: number): Auction[] {
  return state.auctions
    .filter((a) => a.userId === accountId)
    .sort((a, b) => {
      const rank = (a: Auction) => (auctionStatus(a, now) === "closed" ? 1 : 0);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return b.publishedAt - a.publishedAt;
    });
}

export function specialDeals(state: RuleState, categoryId?: string): Product[] {
  return state.products
    .filter((p) => p.isSpecialDeal && (!categoryId || p.categoryId === categoryId))
    .sort((a, b) => (a.specialDealEndsAt ?? 0) - (b.specialDealEndsAt ?? 0));
}

export function topDealsOfWeek(state: RuleState): Product[] {
  return state.products
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .sort((a, b) => {
      const disc = (p: Product) => (p.originalPrice! - p.price) / p.originalPrice!;
      return disc(b) - disc(a);
    })
    .slice(0, 8);
}

export function daysLeft(endsAt?: number, now = Date.now()): number {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / DAY));
}

export function notificationsFor(state: RuleState, accountId: string): AppNotification[] {
  return state.notifications
    .filter((n) => n.accountId === accountId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function unreadCount(state: RuleState, accountId: string): number {
  return state.notifications.filter((n) => n.accountId === accountId && !n.read).length;
}

export function unreadMessages(state: RuleState, accountId: string, auctionIds: string[]): number {
  return state.messages.filter(
    (m: ChatMessage) => auctionIds.includes(m.auctionId) && m.senderId !== accountId,
  ).length;
}

