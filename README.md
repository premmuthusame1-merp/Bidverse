# BidVerse — Reverse Auction Marketplace

BidVerse lets a customer post a product requirement and lets verified nearby stores
compete for it in a **live reverse auction** inside a per-product group chat.

This repository contains the full application (Expo Router + React Native, runs on
iOS, Android and the web). The visual language — teal `#0F8B8D` on `#F8FAFA`, cards,
pills, bottom navigation — follows the reference HTML pages that shipped with the brief.

---

## Quick start

```bash
pnpm install
pnpm dev                 # API server (port 3000) + Expo web (port 8081)
# or just the app shell
pnpm dev:metro           # Expo web on http://localhost:8081
pnpm check               # tsc --noEmit
pnpm test                # vitest (auction rules)
```

Open the app and use the **Demo accounts & reset data** link on the splash screen.

| Role | Username | Password |
| --- | --- | --- |
| Buyer | `arun.prakash@email.com` | `buyer@123` |
| Dealer (Electronics + Refurbished) | `techhub` | `dealer123` |
| Dealer (Vehicles + Refurbished) | `senthilmotors` | `dealer123` |
| Super admin | `superadmin` | `admin@123` |

The super admin signs in through the dealer login screen (the form falls back to the
admin role) and lands on the verification console.

---

## What is implemented

### 1. Two logins on the first page
* **Login as User** — buyer sign-in, remember-me, forgot password, social buttons, 4-step registration.
* **Login as Dealer** — store-owner sign-in; the super admin uses the same form.
* **Register your Store** — full dealer onboarding.

### 2. Dealer registration → verification → issued login
* Collects **name, e-mail, phone, PAN, Aadhaar, GST number, authorised-store certificate
  (optional), store image, store address, category selection and the recommended login username**.
* Submitting shows *“Will get the login after the approve within 24 Hours”* and the
  registration confirmation e-mail is delivered to the in-app mailbox.
* The **super admin verifies the documents** and approves or rejects the dealer.
* Approval generates a **temporary password** and e-mails *“Your registration has been
  accepted”* with the username the dealer recommended + the temporary password.
* First login forces a **password reset**; afterwards the dealer enters normally.
* **Forgot password / Reset password** — same flow: request → 6-digit code by e-mail
  (valid 10 minutes) → verify → set and confirm the new password.

### 3. Dealer home
* **Live auctions** — only auctions whose category matches the dealer's registered
  categories. Tapping opens the group chat; posting a deal moves the auction to
  Participated.
* **Participated auctions** — offer summary, viewer's own last offer, current lowest
  offer, outbid/lowest status and a **timer per chat based on the buyer's closing time**,
  sorted soonest-closing first.
* **My posts** — the products and deals the dealer previously posted.
* **Post** — publishes regular products with a category → sub-category → product details,
  plus the **Special deal** switch which asks for *days left*.
* **Settings** — store profile, approved categories, **category change requests to the
  super admin**, registration/documents summary, sent e-mails and logout.

### 4. Buyer (normal user) home
* Top deals for the week, live listings by category, and a hero CTA to start an auction.
* **Special deals** screen lists every special deal with **days-left counters** and a
  **category dropdown** filter.
* **Auctions** screen — live and previous auctions with full detail for closed ones
  (specifications, offers, winner, extensions, timings) and the *Start a new auction* option.
* **Auction room** — live timer, reverse-bid offer feed, group chat with the stores,
  *extend closing time* and *accept best offer*.

### 5. Auction mechanics (as specified)
| Rule | Implementation |
| --- | --- |
| Auction begins 10 minutes after posting | `startsAt = publishedAt + 10 min`, status `scheduled` → `live` |
| Dealers notified when the category matches | Notification fan-out to approved dealers whose categories contain the auction category |
| After the first bid, 20 minutes of reverse bidding | First deal sets `firstBidAt` and `biddingEndsAt = firstBidAt + 20 min` (capped by the buyer's end time) |
| Reverse bids | Every bid must beat the current lowest offer; dealers can attach **special freebies** and **special mentions** and revise any time before the timer ends |
| Buyer-defined window | `endsAt = publishedAt + durationDays`; the buyer can **extend** at any time |
| Group chat per product | Every auction owns a chat containing deals, buyer messages and system events |
| Live updates | A 1-second clock drives every timer; the store is shared, so buyer and dealer views update live (and stay in sync across browser tabs) |

### 6. Super admin
* Verification desk with the dealer's documents, PAN/Aadhaar/GST, store image and
  requested categories, with **Approve & issue login** / **Reject** actions.
* Category request queue with approve/decline.
* Auction monitor with every auction, its timer, offers and winner.
* **Outbound mailbox** — every transactional e-mail the flows generate, readable exactly
  as the dealer receives it (this build has no SMTP, so mail is captured here).

---

## Architecture

```
app/                         # expo-router screens
  index.tsx                  # splash: User login / Dealer login / registrations
  auth/                      # buyer-login, register, dealer-login, dealer-register,
                             # forgot-password, temp-password
  user/                      # home, auctions, new-auction, auction/[id], special-deals, profile
  dealer/                    # home, chat/[id], post-product, products, settings
  admin/                     # dashboard, category-requests, auctions, mailbox
  notifications.tsx, mailbox.tsx
components/
  ui/kit.tsx                 # badges, buttons, fields, selects, timers, segmented controls
  ui/action-sheet.tsx        # cross-platform dialogs (RN Web has no Alert.alert)
  domain/cards.tsx           # auction, deal, product and chat-message components
  app-shell.tsx              # role-aware bottom navigation + notification bell
lib/
  store.tsx                  # application store: auth, dealers, auctions, deals, chat, mail
  domain/types.ts            # types mirroring the Drizzle tables
  domain/rules.ts            # pure auction rules (unit tested)
  domain/seed.ts             # demo dataset + categories
  format.ts, theme.ts, demo.ts
drizzle/schema.ts            # server-side data model (users, dealers, categories, products,
                             # auctions, deals, chat_messages, notifications, requests, tokens)
tests/bidverse.rules.test.ts # auction timing, reverse-bid and listing rules
```

### Data layer
The app runs against a single persisted store (`lib/store.tsx`, AsyncStorage/localStorage)
so every flow is demonstrable without infrastructure. The types, categories and the pure
rules in `lib/domain/` mirror `drizzle/schema.ts`, so the store can be replaced by the tRPC
procedures in `server/` without touching screens.

Reset the dataset at any time from the splash sheet, the profile screen or the admin mailbox.

### Categories
`Electronics` (Phones, Laptops, Television, Washing Machine, Refrigerator, Air Conditioner,
Watches, Kitchen Appliances, Utility Appliances), `Vehicles` (Bikes, Cars, Heavy Vehicles),
`Refurbished`, `Cameras & Optics`, `Home & Furniture`.
