import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "dealer", "admin"]).default("user").notNull(),
  avatar: varchar("avatar", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Dealer/Store registration and profile
 */
export const dealers = mysqlTable("dealers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Basic Info
  fullName: varchar("fullName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  recommendedUsername: varchar("recommendedUsername", { length: 50 }).notNull().unique(),
  
  // Documents
  panCardUrl: varchar("panCardUrl", { length: 500 }),
  aadharCardUrl: varchar("aadharCardUrl", { length: 500 }),
  gstNumber: varchar("gstNumber", { length: 20 }),
  gstCertificateUrl: varchar("gstCertificateUrl", { length: 500 }),
  authorizedStoreCertificateUrl: varchar("authorizedStoreCertificateUrl", { length: 500 }),
  storeImageUrl: varchar("storeImageUrl", { length: 500 }),
  
  // Business Info
  storeName: varchar("storeName", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  pincode: varchar("pincode", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  tempPassword: varchar("tempPassword", { length: 100 }),
  passwordResetRequired: boolean("passwordResetRequired").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("dealers_user_id_idx").on(table.userId),
  statusIdx: index("dealers_status_idx").on(table.status),
  usernameIdx: index("dealers_username_idx").on(table.recommendedUsername),
}));

export type Dealer = typeof dealers.$inferSelect;
export type InsertDealer = typeof dealers.$inferInsert;

/**
 * Categories that dealers can deal in
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  parentId: int("parentId"),
  icon: varchar("icon", { length: 100 }),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Dealer-Category mapping (many-to-many)
 */
export const dealerCategories = mysqlTable("dealer_categories", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull().references(() => dealers.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dealerCategoryIdx: index("dealer_categories_dealer_category_idx").on(table.dealerId, table.categoryId),
}));

export type DealerCategory = typeof dealerCategories.$inferSelect;
export type InsertDealerCategory = typeof dealerCategories.$inferInsert;

/**
 * Products posted by dealers
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull().references(() => dealers.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  subCategoryId: int("subCategoryId").references(() => categories.id),
  
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  specifications: json("specifications"),
  images: json("images").$type<string[]>(),
  
  price: decimal("price", { precision: 12, scale: 2 }),
  originalPrice: decimal("originalPrice", { precision: 12, scale: 2 }),
  
  isSpecialDeal: boolean("isSpecialDeal").default(false),
  specialDealDaysLeft: int("specialDealDaysLeft"),
  specialDealEndsAt: timestamp("specialDealEndsAt"),
  
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dealerIdx: index("products_dealer_idx").on(table.dealerId),
  categoryIdx: index("products_category_idx").on(table.categoryId),
  specialDealIdx: index("products_special_deal_idx").on(table.isSpecialDeal),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Auctions created by users
 */
export const auctions = mysqlTable("auctions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  subCategoryId: int("subCategoryId").references(() => categories.id),
  
  productName: varchar("productName", { length: 200 }).notNull(),
  specifications: text("specifications"),
  referralLink: varchar("referralLink", { length: 500 }),
  
  budget: decimal("budget", { precision: 12, scale: 2 }).notNull(),
  durationDays: int("durationDays").notNull(),
  
  status: mysqlEnum("status", ["draft", "published", "live", "extended", "closed", "cancelled"]).default("draft").notNull(),
  
  publishedAt: timestamp("publishedAt"),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  extendedAt: timestamp("extendedAt"),
  extensionDays: int("extensionDays").default(0),
  
  winningDealId: int("winningDealId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("auctions_user_idx").on(table.userId),
  statusIdx: index("auctions_status_idx").on(table.status),
  categoryIdx: index("auctions_category_idx").on(table.categoryId),
}));

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = typeof auctions.$inferInsert;

/**
 * Deals/Bids made by dealers on auctions
 */
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  auctionId: int("auctionId").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  dealerId: int("dealerId").notNull().references(() => dealers.id, { onDelete: "cascade" }),
  
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  freebies: text("freebies"),
  specialMentions: text("specialMentions"),
  
  isWithdrawn: boolean("isWithdrawn").default(false),
  isWinning: boolean("isWinning").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  auctionDealerIdx: index("deals_auction_dealer_idx").on(table.auctionId, table.dealerId),
  auctionIdx: index("deals_auction_idx").on(table.auctionId),
}));

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

/**
 * Chat messages for auction group chats
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  auctionId: int("auctionId").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  senderId: int("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderType: mysqlEnum("senderType", ["user", "dealer", "admin"]).notNull(),
  
  message: text("message").notNull(),
  messageType: mysqlEnum("messageType", ["text", "deal", "system"]).default("text"),
  dealId: int("dealId").references(() => deals.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  auctionIdx: index("chat_messages_auction_idx").on(table.auctionId),
  createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", [
    "auction_published", 
    "new_deal", 
    "deal_updated", 
    "auction_ending_soon", 
    "auction_closed", 
    "auction_extended",
    "dealer_approved",
    "dealer_rejected",
    "new_chat_message",
    "password_reset",
    "category_request"
  ]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message"),
  data: json("data"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Category extension requests by dealers
 */
export const categoryRequests = mysqlTable("category_requests", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").notNull().references(() => dealers.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dealerIdx: index("category_requests_dealer_idx").on(table.dealerId),
  statusIdx: index("category_requests_status_idx").on(table.status),
}));

export type CategoryRequest = typeof categoryRequests.$inferSelect;
export type InsertCategoryRequest = typeof categoryRequests.$inferInsert;

/**
 * Password reset tokens
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 100 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
  userIdIdx: index("password_reset_tokens_user_idx").on(table.userId),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;