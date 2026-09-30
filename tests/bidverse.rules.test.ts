import { describe, expect, it } from "vitest";

import {
  auctionClosesAt,
  auctionStartsAt,
  auctionStatus,
  auctionsForBuyer,
  currentBestDeal,
  daysLeft,
  dealsOf,
  liveAuctionsForDealer,
  participatedAuctionsForDealer,
  specialDeals,
  topDealsOfWeek,
  type RuleState,
} from "../lib/domain/rules";
import { AUCTION_START_DELAY_MS, REVERSE_BID_WINDOW_MS } from "../lib/domain/seed";
import type { Auction, DealerProfile, Deal, Product } from "../lib/domain/types";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = 1_700_000_000_000;

function auction(overrides: Partial<Auction> = {}): Auction {
  return {
    id: "auc-1",
    userId: "acc-buyer",
    categoryId: "cat-electronics",
    productName: "iPhone 15 Pro Max",
    specifications: "Sealed",
    durationDays: 3,
    budget: 145000,
    status: "scheduled",
    publishedAt: NOW,
    startsAt: auctionStartsAt(NOW),
    endsAt: NOW + 3 * DAY,
    extensionDays: 0,
    ...overrides,
  };
}

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "deal-1",
    auctionId: "auc-1",
    dealerId: "dlr-1",
    amount: 140000,
    isLatest: true,
    withdrawn: false,
    createdAt: NOW,
    ...overrides,
  };
}

function dealer(overrides: Partial<DealerProfile> = {}): DealerProfile {
  return {
    id: "dlr-1",
    accountId: "acc-dealer-1",
    fullName: "Rahul Menon",
    email: "techhub@email.com",
    phone: "+91 90000 11111",
    recommendedUsername: "techhub",
    panCardNumber: "ABCDE1234F",
    aadharCardNumber: "1234 5678 9012",
    gstNumber: "33ABCDE1234F1Z5",
    hasAuthorizedStoreCertificate: true,
    storeName: "TechHub Chennai",
    address: "Anna Salai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600018",
    latitude: 13,
    longitude: 80,
    categoryIds: ["cat-electronics"],
    status: "approved",
    submittedAt: NOW - 10 * DAY,
    ...overrides,
  };
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "prd-1",
    dealerId: "dlr-1",
    categoryId: "cat-electronics",
    subCategory: "Phones",
    name: "MacBook Air",
    description: "",
    price: 90000,
    isSpecialDeal: false,
    postedAt: NOW,
    ...overrides,
  };
}

function state(overrides: Partial<RuleState> = {}): RuleState {
  return {
    auctions: [],
    deals: [],
    products: [],
    dealers: [],
    notifications: [],
    messages: [],
    ...overrides,
  };
}

describe("auction timing", () => {
  it("opens bidding exactly 10 minutes after the buyer publishes", () => {
    expect(auctionStartsAt(NOW) - NOW).toBe(AUCTION_START_DELAY_MS);
    expect(AUCTION_START_DELAY_MS).toBe(10 * MINUTE);
  });

  it("is scheduled before the 10 minute mark and live afterwards", () => {
    const a = auction();
    expect(auctionStatus(a, NOW)).toBe("scheduled");
    expect(auctionStatus(a, NOW + 9 * MINUTE)).toBe("scheduled");
    expect(auctionStatus(a, NOW + 10 * MINUTE)).toBe("live");
  });

  it("closes at the buyer's closing time once the reverse window has passed", () => {
    const a = auction({ firstBidAt: NOW + 12 * MINUTE, biddingEndsAt: NOW + 12 * MINUTE + REVERSE_BID_WINDOW_MS });
    expect(auctionClosesAt(a) - (NOW + 12 * MINUTE)).toBe(20 * MINUTE);
    expect(auctionStatus(a, NOW + 12 * MINUTE + 19 * MINUTE)).toBe("live");
    expect(auctionStatus(a, NOW + 12 * MINUTE + 20 * MINUTE)).toBe("closed");
  });

  it("never extends past the buyer's end time even if the 20 minute window is longer", () => {
    // A bid placed 5 minutes before closing would open a 20 minute window that
    // runs past the buyer's closing time — the buyer's time still wins.
    const firstBidAt = NOW + 3 * DAY - 5 * MINUTE;
    const a = auction({ firstBidAt, biddingEndsAt: firstBidAt + REVERSE_BID_WINDOW_MS });
    expect(a.biddingEndsAt! > a.endsAt).toBe(true);
    expect(auctionClosesAt(a)).toBe(a.endsAt);
    expect(auctionStatus(a, a.endsAt)).toBe("closed");
  });

  it("keeps a closed auction closed", () => {
    const a = auction({ status: "closed" });
    expect(auctionStatus(a, NOW)).toBe("closed");
  });
});

describe("reverse bidding", () => {
  it("treats the lowest offer as the best offer", () => {
    const deals = [deal({ id: "d1", amount: 140000 }), deal({ id: "d2", amount: 132000 }), deal({ id: "d3", amount: 138000 })];
    expect(currentBestDeal(deals, "auc-1")?.id).toBe("d2");
  });

  it("ignores withdrawn offers", () => {
    const deals = [deal({ id: "d1", amount: 120000, withdrawn: true }), deal({ id: "d2", amount: 139000 })];
    expect(currentBestDeal(deals, "auc-1")?.id).toBe("d2");
    expect(dealsOf(deals, "auc-1")).toHaveLength(1);
  });

  it("orders offers newest first for the live feed", () => {
    const deals = [deal({ id: "older", createdAt: NOW }), deal({ id: "newer", createdAt: NOW + 5 * MINUTE })];
    expect(dealsOf(deals, "auc-1")[0].id).toBe("newer");
  });
});

describe("dealer home blocks", () => {
  const dealerProfile = dealer();
  const otherCategory = auction({ id: "auc-vehicles", categoryId: "cat-vehicles" });
  const live = auction({ id: "auc-live", status: "live", startsAt: NOW - HOUR });
  const joined = auction({ id: "auc-joined", status: "live", startsAt: NOW - HOUR });
  const scheduled = auction({ id: "auc-soon", status: "scheduled" });

  it("lists only auctions in the dealer's categories that are still open", () => {
    const s = state({ auctions: [live, otherCategory, scheduled], deals: [], dealers: [dealerProfile] });
    const ids = liveAuctionsForDealer(s, dealerProfile, NOW).map((a) => a.id);
    expect(ids).toContain("auc-live");
    expect(ids).toContain("auc-soon");
    expect(ids).not.toContain("auc-vehicles");
  });

  it("moves an auction to participated as soon as the dealer posts a deal", () => {
    const s = state({
      auctions: [live, joined],
      deals: [deal({ id: "d1", auctionId: "auc-joined", dealerId: "dlr-1" })],
    });
    const liveIds = liveAuctionsForDealer(s, dealerProfile, NOW).map((a) => a.id);
    const participatedIds = participatedAuctionsForDealer(s, dealerProfile, NOW).map((a) => a.id);
    expect(liveIds).toEqual(["auc-live"]);
    expect(participatedIds).toEqual(["auc-joined"]);
  });

  it("sorts participated auctions by the running timer", () => {
    const closingSoon = auction({ id: "a-soon", status: "live", startsAt: NOW - HOUR, endsAt: NOW + 30 * MINUTE });
    const closingLater = auction({ id: "a-later", status: "live", startsAt: NOW - HOUR, endsAt: NOW + 6 * HOUR });
    const s = state({
      auctions: [closingLater, closingSoon],
      deals: [
        deal({ id: "d1", auctionId: "a-soon" }),
        deal({ id: "d2", auctionId: "a-later" }),
      ],
    });
    expect(participatedAuctionsForDealer(s, dealerProfile, NOW).map((a) => a.id)).toEqual(["a-soon", "a-later"]);
  });

  it("pushes closed participated auctions to the bottom", () => {
    const closed = auction({ id: "a-closed", status: "closed", endsAt: NOW - HOUR, startsAt: NOW - 3 * HOUR });
    const open = auction({ id: "a-open", status: "live", startsAt: NOW - HOUR, endsAt: NOW + 2 * HOUR });
    const s = state({
      auctions: [closed, open],
      deals: [deal({ id: "d1", auctionId: "a-closed" }), deal({ id: "d2", auctionId: "a-open" })],
    });
    expect(participatedAuctionsForDealer(s, dealerProfile, NOW).map((a) => a.id)).toEqual(["a-open", "a-closed"]);
  });
});

describe("buyer auctions", () => {
  it("separates open from previous auctions and keeps them newest first", () => {
    const open = auction({ id: "open", status: "live", startsAt: NOW - HOUR, endsAt: NOW + HOUR });
    const closed = auction({ id: "closed", status: "closed", startsAt: NOW - 5 * HOUR, endsAt: NOW - HOUR });
    const s = state({ auctions: [closed, open] });
    const list = auctionsForBuyer(s, "acc-buyer", NOW);
    expect(list.map((a) => a.id)).toEqual(["open", "closed"]);
    expect(list.every((a) => a.userId === "acc-buyer")).toBe(true);
  });
});

describe("products and special deals", () => {
  it("filters special deals by category and reports days left", () => {
    const special = product({
      id: "sp-1",
      isSpecialDeal: true,
      specialDealDays: 3,
      specialDealEndsAt: NOW + 3 * DAY,
    });
    const vehicles = product({
      id: "sp-2",
      categoryId: "cat-vehicles",
      isSpecialDeal: true,
      specialDealEndsAt: NOW + 5 * DAY,
    });
    const regular = product({ id: "pr-1" });
    const s = state({ products: [special, vehicles, regular] });

    expect(specialDeals(s).map((p) => p.id)).toEqual(["sp-1", "sp-2"]);
    expect(specialDeals(s, "cat-vehicles").map((p) => p.id)).toEqual(["sp-2"]);
    expect(daysLeft(special.specialDealEndsAt, NOW)).toBe(3);
    expect(daysLeft(special.specialDealEndsAt, NOW + 3 * DAY)).toBe(0);
  });

  it("ranks top deals of the week by discount percentage", () => {
    const bigDiscount = product({ id: "big", price: 50000, originalPrice: 100000 });
    const smallDiscount = product({ id: "small", price: 90000, originalPrice: 100000 });
    const noDiscount = product({ id: "none", price: 100000 });
    const s = state({ products: [smallDiscount, bigDiscount, noDiscount] });
    expect(topDealsOfWeek(s).map((p) => p.id)).toEqual(["big", "small"]);
  });
});
