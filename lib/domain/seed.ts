/**
 * Demo data used to seed the app on first launch (and after a data reset).
 *
 * Dealer / buyer / admin credentials are listed on the splash screen "Demo
 * accounts" sheet so the whole flow can be reviewed without registering.
 */
import type {
  Account,
  AppNotification,
  Auction,
  Category,
  CategoryRequest,
  ChatMessage,
  DealerProfile,
  Deal,
  MailMessage,
  Product,
} from "./types";

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

/** Auction opens 10 minutes after the buyer publishes it. */
export const AUCTION_START_DELAY_MS = 10 * MINUTE;
/** Once the first bid lands, dealers get a 20 minute reverse-bidding window. */
export const REVERSE_BID_WINDOW_MS = 20 * MINUTE;

export const SUPER_ADMIN_USERNAME = "superadmin";
export const SUPER_ADMIN_PASSWORD = "admin@123";

export interface SeedState {
  accounts: Account[];
  dealers: DealerProfile[];
  categories: Category[];
  categoryRequests: CategoryRequest[];
  products: Product[];
  auctions: Auction[];
  deals: Deal[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  mail: MailMessage[];
  session: { accountId: string; dealerId?: string } | null;
}

export const CATEGORIES: Category[] = [
  {
    id: "cat-electronics",
    name: "Electronics",
    icon: "◈",
    sortOrder: 1,
    subCategories: [
      "Phones",
      "Laptops",
      "Television",
      "Washing Machine",
      "Refrigerator",
      "Air Conditioner",
      "Watches",
      "Kitchen Appliances",
      "Utility Appliances",
    ],
  },
  {
    id: "cat-vehicles",
    name: "Vehicles",
    icon: "⚙",
    sortOrder: 2,
    subCategories: ["Bikes", "Cars", "Heavy Vehicles"],
  },
  {
    id: "cat-refurbished",
    name: "Refurbished",
    icon: "♻",
    sortOrder: 3,
    subCategories: ["Refurbished Phones", "Refurbished Laptops", "Refurbished Cars", "Refurbished Bikes"],
  },
  {
    id: "cat-cameras",
    name: "Cameras & Optics",
    icon: "◎",
    sortOrder: 4,
    subCategories: ["DSLR", "Mirrorless", "Action Cameras", "Lenses", "Drones"],
  },
  {
    id: "cat-furniture",
    name: "Home & Furniture",
    icon: "▤",
    sortOrder: 5,
    subCategories: ["Sofas", "Beds", "Dining", "Office Furniture", "Decor"],
  },
];

export function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? "Uncategorised";
}

export function categorySubs(id: string): string[] {
  return CATEGORIES.find((c) => c.id === id)?.subCategories ?? [];
}

export function createSeedState(now = Date.now()): SeedState {
  const accounts: Account[] = [
    {
      id: "acc-admin",
      role: "admin",
      name: "Super Admin",
      email: "superadmin@bidverse.in",
      username: SUPER_ADMIN_USERNAME,
      password: SUPER_ADMIN_PASSWORD,
      createdAt: now - 90 * 24 * HOUR,
    },
    {
      id: "acc-buyer",
      role: "user",
      name: "Arun Prakash",
      email: "arun.prakash@email.com",
      phone: "+91 98765 43210",
      password: "buyer@123",
      createdAt: now - 30 * 24 * HOUR,
    },
    {
      id: "acc-dealer-1",
      role: "dealer",
      name: "TechHub Chennai",
      email: "techhub@email.com",
      phone: "+91 90000 11111",
      username: "techhub",
      password: "dealer123",
      createdAt: now - 60 * 24 * HOUR,
    },
    {
      id: "acc-dealer-2",
      role: "dealer",
      name: "Appliance World",
      email: "applianceworld@email.com",
      phone: "+91 90000 22222",
      username: "applianceworld",
      password: "dealer123",
      createdAt: now - 45 * 24 * HOUR,
    },
    {
      id: "acc-dealer-3",
      role: "dealer",
      name: "Senthil Motors",
      email: "senthilmotors@email.com",
      phone: "+91 90000 33333",
      username: "senthilmotors",
      password: "dealer123",
      createdAt: now - 12 * 24 * HOUR,
    },
    {
      id: "acc-dealer-4",
      role: "dealer",
      name: "Deccan Mobiles",
      email: "deccanmobiles@email.com",
      phone: "+91 90000 44444",
      username: "deccanmobiles",
      password: "dealer123",
      createdAt: now - 2 * 24 * HOUR,
    },
  ];

  const dealers: DealerProfile[] = [
    {
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
      authorizedStoreCertificateName: "apple-authorized-store.pdf",
      storeImageName: "techhub-store-front.jpg",
      storeName: "TechHub Chennai",
      address: "12, Anna Salai, Teynampet",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600018",
      latitude: 13.0389,
      longitude: 80.2445,
      categoryIds: ["cat-electronics", "cat-refurbished"],
      status: "approved",
      submittedAt: now - 60 * 24 * HOUR,
      reviewedAt: now - 59 * 24 * HOUR,
    },
    {
      id: "dlr-2",
      accountId: "acc-dealer-2",
      fullName: "Priya Nair",
      email: "applianceworld@email.com",
      phone: "+91 90000 22222",
      recommendedUsername: "applianceworld",
      panCardNumber: "PQRSX5678K",
      aadharCardNumber: "9876 5432 1098",
      gstNumber: "33PQRSX5678K1Z2",
      hasAuthorizedStoreCertificate: true,
      authorizedStoreCertificateName: "samsung-authorized.pdf",
      storeImageName: "appliance-world.jpg",
      storeName: "Appliance World",
      address: "44, GST Road, Guindy",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600032",
      latitude: 13.0067,
      longitude: 80.2206,
      categoryIds: ["cat-electronics", "cat-furniture"],
      status: "approved",
      submittedAt: now - 45 * 24 * HOUR,
      reviewedAt: now - 44 * 24 * HOUR,
    },
    {
      id: "dlr-3",
      accountId: "acc-dealer-3",
      fullName: "Senthil Kumar",
      email: "senthilmotors@email.com",
      phone: "+91 90000 33333",
      recommendedUsername: "senthilmotors",
      panCardNumber: "LMNOP9012Q",
      aadharCardNumber: "4567 8901 2345",
      gstNumber: "33LMNOP9012Q1Z7",
      hasAuthorizedStoreCertificate: false,
      storeImageName: "senthil-motors.jpg",
      storeName: "Senthil Motors",
      address: "8, Bypass Road, Velachery",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600042",
      latitude: 12.9791,
      longitude: 80.2212,
      categoryIds: ["cat-vehicles", "cat-refurbished"],
      status: "approved",
      submittedAt: now - 12 * 24 * HOUR,
      reviewedAt: now - 11 * 24 * HOUR,
    },
    {
      id: "dlr-4",
      accountId: "acc-dealer-4",
      fullName: "Imran Sheikh",
      email: "deccanmobiles@email.com",
      phone: "+91 90000 44444",
      recommendedUsername: "deccanmobiles",
      panCardNumber: "TUVWX3456Y",
      aadharCardNumber: "2345 6789 0123",
      gstNumber: "33TUVWX3456Y1Z9",
      hasAuthorizedStoreCertificate: false,
      storeImageName: "deccan-mobiles.jpg",
      storeName: "Deccan Mobiles",
      address: "77, Mount Road, Saidapet",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600015",
      latitude: 13.0234,
      longitude: 80.2231,
      categoryIds: ["cat-electronics"],
      status: "pending",
      submittedAt: now - 2 * HOUR,
    },
  ];

  const categoryRequests: CategoryRequest[] = [
    {
      id: "creq-1",
      dealerId: "dlr-1",
      categoryId: "cat-cameras",
      reason: "We are opening a dedicated camera and lens counter this month.",
      status: "pending",
      requestedAt: now - 5 * HOUR,
    },
  ];

  const products: Product[] = [
    {
      id: "prd-1",
      dealerId: "dlr-1",
      categoryId: "cat-electronics",
      subCategory: "Laptops",
      name: 'MacBook Air M3 13"',
      description: "Sealed box with Apple India warranty, 8GB / 256GB.",
      price: 98900,
      originalPrice: 114900,
      isSpecialDeal: true,
      specialDealDays: 6,
      specialDealEndsAt: now + 6 * 24 * HOUR,
      image: "laptop",
      postedAt: now - 3 * 24 * HOUR,
    },
    {
      id: "prd-2",
      dealerId: "dlr-1",
      categoryId: "cat-electronics",
      subCategory: "Phones",
      name: "iPhone 15 Pro Max 256GB",
      description: "Natural Titanium, unopened, India unit.",
      price: 132900,
      originalPrice: 149900,
      isSpecialDeal: true,
      specialDealDays: 3,
      specialDealEndsAt: now + 3 * 24 * HOUR,
      image: "phone",
      postedAt: now - 2 * 24 * HOUR,
    },
    {
      id: "prd-3",
      dealerId: "dlr-2",
      categoryId: "cat-electronics",
      subCategory: "Television",
      name: "Sony Bravia 65\" OLED",
      description: "3-year panel warranty, free wall mount installation.",
      price: 189900,
      originalPrice: 229900,
      isSpecialDeal: true,
      specialDealDays: 9,
      specialDealEndsAt: now + 9 * 24 * HOUR,
      image: "tv",
      postedAt: now - 26 * HOUR,
    },
    {
      id: "prd-4",
      dealerId: "dlr-2",
      categoryId: "cat-electronics",
      subCategory: "Kitchen Appliances",
      name: "Dyson V12 Cordless Vacuum",
      description: "Includes 5 accessories, 2-year brand warranty.",
      price: 42900,
      originalPrice: 54900,
      isSpecialDeal: false,
      image: "vacuum",
      postedAt: now - 18 * HOUR,
    },
    {
      id: "prd-5",
      dealerId: "dlr-3",
      categoryId: "cat-vehicles",
      subCategory: "Bikes",
      name: "Royal Enfield Classic 350",
      description: "2024 model, single owner, 4,200 km run.",
      price: 185000,
      originalPrice: 210000,
      isSpecialDeal: false,
      image: "bike",
      postedAt: now - 8 * HOUR,
    },
  ];

  const auctions: Auction[] = [
    {
      id: "auc-1",
      userId: "acc-buyer",
      categoryId: "cat-electronics",
      subCategory: "Phones",
      productName: "iPhone 15 Pro Max 256GB",
      specifications: "Natural Titanium, sealed India unit, bill + warranty required.",
      durationDays: 3,
      budget: 145000,
      referralLink: "https://www.apple.com/in/iphone-15-pro/",
      status: "live",
      publishedAt: now - 14 * MINUTE,
      startsAt: now - 14 * MINUTE + AUCTION_START_DELAY_MS,
      endsAt: now + 3 * 24 * HOUR,
      // First bid landed 3 minutes ago, so the 20 minute reverse-bidding
      // window is still open when the app is first opened.
      firstBidAt: now - 3 * MINUTE,
      biddingEndsAt: now - 3 * MINUTE + REVERSE_BID_WINDOW_MS,
      extensionDays: 0,
    },
    {
      id: "auc-2",
      userId: "acc-buyer",
      categoryId: "cat-vehicles",
      subCategory: "Bikes",
      productName: "Royal Enfield Classic 350",
      specifications: "2023 or newer, under 10,000 km, single owner, Chennai registration.",
      durationDays: 5,
      budget: 210000,
      referralLink: "https://www.royalenfield.com/in/en/home/",
      status: "live",
      publishedAt: now - 12 * MINUTE,
      startsAt: now - 12 * MINUTE + AUCTION_START_DELAY_MS,
      endsAt: now + 18 * HOUR,
      firstBidAt: now - 2 * MINUTE,
      biddingEndsAt: now - 2 * MINUTE + REVERSE_BID_WINDOW_MS,
      extensionDays: 0,
    },
    {
      id: "auc-3",
      userId: "acc-buyer",
      categoryId: "cat-electronics",
      subCategory: "Television",
      productName: 'Sony Bravia 65" OLED',
      specifications: "With wall mount + 3-year warranty, installation included.",
      durationDays: 2,
      budget: 190000,
      referralLink: "https://www.sony.co.in/",
      status: "live",
      publishedAt: now - 20 * MINUTE,
      startsAt: now - 10 * MINUTE,
      endsAt: now + 36 * HOUR,
      extensionDays: 0,
    },
    {
      id: "auc-4",
      userId: "acc-buyer",
      categoryId: "cat-electronics",
      subCategory: "Laptops",
      productName: 'MacBook Air M3 13" 256GB',
      specifications: "Midnight colour, Apple India warranty, sealed.",
      durationDays: 4,
      budget: 105000,
      referralLink: "https://www.apple.com/in/macbook-air/",
      status: "scheduled",
      publishedAt: now - 3 * MINUTE,
      startsAt: now + 7 * MINUTE,
      endsAt: now + 4 * 24 * HOUR,
      extensionDays: 0,
    },
    {
      id: "auc-5",
      userId: "acc-buyer",
      categoryId: "cat-electronics",
      subCategory: "Washing Machine",
      productName: "LG 8kg Front Load Washing Machine",
      specifications: "5-star, inverter, with installation.",
      durationDays: 2,
      budget: 38000,
      referralLink: "https://www.lg.com/in/",
      status: "closed",
      publishedAt: now - 9 * 24 * HOUR,
      startsAt: now - 9 * 24 * HOUR + AUCTION_START_DELAY_MS,
      endsAt: now - 7 * 24 * HOUR,
      firstBidAt: now - 9 * 24 * HOUR + 3 * HOUR,
      biddingEndsAt: now - 9 * 24 * HOUR + 3 * HOUR + REVERSE_BID_WINDOW_MS,
      extensionDays: 0,
      winningDealId: "deal-9",
      closedAt: now - 7 * 24 * HOUR,
    },
  ];

  const deals: Deal[] = [
    {
      id: "deal-1",
      auctionId: "auc-1",
      dealerId: "dlr-1",
      amount: 132900,
      freebies: "Free 20W adapter + tempered glass",
      specialMentions: "Sealed India unit, 1-year Apple warranty",
      isLatest: true,
      withdrawn: false,
      createdAt: now - 3 * MINUTE,
    },
    {
      id: "deal-2",
      auctionId: "auc-1",
      dealerId: "dlr-2",
      amount: 131500,
      freebies: "Free AirPods case + screen guard",
      specialMentions: "Bill with GST input credit",
      isLatest: true,
      withdrawn: false,
      createdAt: now - 150 * 1000,
    },
    {
      id: "deal-3",
      auctionId: "auc-1",
      dealerId: "dlr-1",
      amount: 129990,
      freebies: "Free 20W adapter + tempered glass + 1-year accidental cover",
      specialMentions: "Price valid if booked today",
      isLatest: true,
      withdrawn: false,
      createdAt: now - 2 * MINUTE,
    },
    {
      id: "deal-4",
      auctionId: "auc-2",
      dealerId: "dlr-3",
      amount: 196500,
      freebies: "Free first service + helmet",
      specialMentions: "Showroom condition, 8,400 km run",
      isLatest: true,
      withdrawn: false,
      createdAt: now - 2 * MINUTE,
    },
    {
      id: "deal-5",
      auctionId: "auc-2",
      dealerId: "dlr-3",
      amount: 189900,
      freebies: "Free first service + helmet + crash guard",
      specialMentions: "Includes 1-year roadside assistance",
      isLatest: true,
      withdrawn: false,
      createdAt: now - 70 * 1000,
    },
    {
      id: "deal-9",
      auctionId: "auc-5",
      dealerId: "dlr-2",
      amount: 34990,
      freebies: "Free installation + extended warranty",
      specialMentions: "Won by lowest offer",
      isLatest: true,
      withdrawn: false,
      createdAt: now - 8 * 24 * HOUR,
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: "msg-1",
      auctionId: "auc-1",
      senderId: "acc-buyer",
      senderRole: "user",
      senderName: "Arun Prakash",
      body: "Auction is live. Please share your best price with freebies.",
      kind: "text",
      createdAt: now - 13 * MINUTE,
    },
    {
      id: "msg-2",
      auctionId: "auc-1",
      senderId: "acc-dealer-1",
      senderRole: "dealer",
      senderName: "TechHub Chennai",
      body: "Deal posted: ₹1,32,900 · Free 20W adapter + tempered glass",
      kind: "deal",
      dealId: "deal-1",
      createdAt: now - 3 * MINUTE,
    },
    {
      id: "msg-3",
      auctionId: "auc-1",
      senderId: "acc-dealer-2",
      senderRole: "dealer",
      senderName: "Appliance World",
      body: "Deal posted: ₹1,31,500 · Free AirPods case + screen guard",
      kind: "deal",
      dealId: "deal-2",
      createdAt: now - 150 * 1000,
    },
    {
      id: "msg-4",
      auctionId: "auc-1",
      senderId: "acc-dealer-1",
      senderRole: "dealer",
      senderName: "TechHub Chennai",
      body: "We can also add accidental damage cover for one year if you confirm today.",
      kind: "text",
      createdAt: now - 130 * 1000,
    },
    {
      id: "msg-5",
      auctionId: "auc-1",
      senderId: "acc-dealer-1",
      senderRole: "dealer",
      senderName: "TechHub Chennai",
      body: "Deal posted: ₹1,29,990 · Free 20W adapter + tempered glass + 1-year accidental cover",
      kind: "deal",
      dealId: "deal-3",
      createdAt: now - 2 * MINUTE,
    },
    {
      id: "msg-6",
      auctionId: "auc-2",
      senderId: "acc-dealer-3",
      senderRole: "dealer",
      senderName: "Senthil Motors",
      body: "Deal posted: ₹1,96,500 · Free first service + helmet",
      kind: "deal",
      dealId: "deal-4",
      createdAt: now - 2 * MINUTE,
    },
    {
      id: "msg-7",
      auctionId: "auc-2",
      senderId: "acc-dealer-3",
      senderRole: "dealer",
      senderName: "Senthil Motors",
      body: "Deal posted: ₹1,89,900 · Free first service + helmet + crash guard",
      kind: "deal",
      dealId: "deal-5",
      createdAt: now - 70 * 1000,
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: "ntf-1",
      accountId: "acc-buyer",
      type: "new_deal",
      title: "New deal on iPhone 15 Pro Max",
      body: "TechHub Chennai offered ₹1,29,990 with freebies.",
      auctionId: "auc-1",
      read: false,
      createdAt: now - 2 * MINUTE,
    },
    {
      id: "ntf-2",
      accountId: "acc-dealer-1",
      type: "auction_published",
      title: "New auction in Electronics",
      body: 'Sony Bravia 65" OLED — closes in 36 hours.',
      auctionId: "auc-3",
      read: false,
      createdAt: now - 20 * MINUTE,
    },
    {
      id: "ntf-3",
      accountId: "acc-dealer-2",
      type: "auction_published",
      title: "New auction in Electronics",
      body: 'Sony Bravia 65" OLED — closes in 36 hours.',
      auctionId: "auc-3",
      read: false,
      createdAt: now - 20 * MINUTE,
    },
    {
      id: "ntf-4",
      accountId: "acc-admin",
      type: "dealer_registered",
      title: "Dealer awaiting verification",
      body: "Deccan Mobiles (deccanmobiles) submitted documents for approval.",
      read: false,
      createdAt: now - 2 * HOUR,
    },
  ];

  const mail: MailMessage[] = [
    {
      id: "mail-1",
      to: "deccanmobiles@email.com",
      subject: "BidVerse dealer registration received",
      preview: "Your documents are under verification.",
      body:
        "Hello Imran Sheikh,\n\nThank you for registering Deccan Mobiles on BidVerse.\nYour documents (PAN, Aadhaar, GST, store image) are under verification by our super admin team.\n\nYou will receive your login credentials by e-mail within 24 hours of approval.\n\n— Team BidVerse",
      category: "registration",
      sentAt: now - 2 * HOUR,
    },
  ];

  return {
    accounts,
    dealers,
    categories: CATEGORIES,
    categoryRequests,
    products,
    auctions,
    deals,
    messages,
    notifications,
    mail,
    session: null,
  };
}

/** Fixed system messages that get appended to every new auction chat. */
export function auctionSystemMessages(auction: Auction, now: number): ChatMessage[] {
  return [
    {
      id: `sys-${auction.id}-1`,
      auctionId: auction.id,
      senderId: "system",
      senderRole: "admin",
      senderName: "BidVerse",
      body: `Auction published. Dealers matching "${categoryName(auction.categoryId)}" have been notified. Bidding opens ${formatDelay(auction.startsAt - now)}.`,
      kind: "system",
      createdAt: auction.publishedAt,
    },
  ];
}

function formatDelay(ms: number): string {
  const mins = Math.max(0, Math.round(ms / MINUTE));
  return mins <= 1 ? "in 1 minute" : `in ${mins} minutes`;
}
