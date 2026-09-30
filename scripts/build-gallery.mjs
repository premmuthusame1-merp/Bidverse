#!/usr/bin/env node
/**
 * Builds docs/gallery.html — a browsable gallery of the real screenshots taken
 * from the running app in a headless Chromium browser.
 *
 * Usage: node scripts/build-gallery.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(ROOT, "docs/screenshots");
const OUT = path.join(ROOT, "docs/gallery.html");

const buyer = JSON.parse(fs.readFileSync(path.join(SHOTS, "index.json"), "utf8"));
const dealer = JSON.parse(fs.readFileSync(path.join(SHOTS, "index-dealer.json"), "utf8"));
const byName = new Map([...buyer, ...dealer].map((s) => [s.name, s]));

const SECTIONS = [
  {
    id: "start",
    title: "1 · Start page and the two logins",
    blurb:
      "The first screen offers a separate login for store owners and for the customers who ask for the product, plus registration for both.",
    items: [
      ["01-splash", "Buyer + dealer entry points on one screen"],
      ["10-buyer-login", "Normal user login"],
      ["02-dealer-login", "Dealer login — the super admin signs in here too"],
    ],
  },
  {
    id: "dealer-onboarding",
    title: "2 · Dealer registration → verification → issued login",
    blurb:
      "PAN, Aadhaar, GST, authorised-store certificate, store image, address, category selection and the recommended admin username. Submitting shows “Will get the login after the approve within 24 Hours”.",
    items: [
      ["03-dealer-register-step1", "Step 1 — basic info and the recommended username"],
      ["04-dealer-register-documents", "Step 2 — documents: PAN, Aadhaar, GST, certificates, store image"],
      ["05-dealer-register-business", "Step 3 — store address and location"],
      ["06-dealer-register-categories", "Step 4 — categories the dealer may deal in, plus review"],
      ["07-dealer-register-done", "“Will get the login after the approve within 24 Hours”"],
      ["36-dealer-registration-submitted", "The dealer now sits in the admin queue"],
    ],
  },
  {
    id: "password",
    title: "3 · Forgot password / reset password",
    blurb:
      "Both entry points run the same flow: request → six-digit code e-mailed (10 minute validity) → verify → set and confirm the new password.",
    items: [
      ["08-forgot-password", "Step 1 — enter the registered e-mail or dealer username"],
      ["09-reset-code", "Step 2 — the verification code e-mail"],
      ["45-dealer-first-login", "First login with the admin-issued temporary password"],
    ],
  },
  {
    id: "buyer",
    title: "4 · Normal user (buyer) experience",
    blurb:
      "Dealer products by category, top deals of the week, special deals with days-left counters, and the auctions block with previous auctions plus “start the new auction”.",
    items: [
      ["11-buyer-home", "Home — hero, live auctions, top deals of the week"],
      ["12-buyer-home-categories", "Browse by category and how an auction works"],
      ["13-new-auction", "Publish an auction: product, category, specs, days open, deal amount, referral link"],
      ["14-auction-published", "Matching stores notified; bidding opens 10 minutes later"],
      ["15-buyer-auctions-live", "My auctions — live"],
      ["16-buyer-auctions-previous", "Previous auctions with the full detail"],
      ["20-special-deals", "Special deals with days-left counters and a category filter"],
      ["22-notifications", "Live deal notifications"],
      ["23-mailbox", "Every transactional e-mail"],
      ["21-buyer-profile", "Buyer profile"],
    ],
  },
  {
    id: "auction",
    title: "5 · The auction room — the buyer watches live",
    blurb:
      "Timer based on the closing time the user set, every reverse bid in order, the group chat with all participating stores, and the full auction detail.",
    items: [
      ["17-auction-room-offers", "Live offers with freebies and special mentions"],
      ["18-auction-room-chat", "The group chat for that product"],
      ["19-auction-detail", "Full detail: timings, extensions, offers, winner"],
    ],
  },
  {
    id: "dealer-home",
    title: "6 · Dealer home, participated auctions and posting",
    blurb:
      "Live auctions filtered to the dealer's registered categories; posting a deal moves the auction into Participated, which is sorted by the running timer.",
    items: [
      ["23-dealer-home-live", "Dealer home — category-matched live auctions"],
      ["24-dealer-participated", "Participated auctions sorted by the chat timer"],
      ["25-dealer-my-posts", "Previously posted deals and products"],
      ["26-dealer-chat-room", "Group chat for one auction, with the buyer requirement"],
      ["27-dealer-bid-form", "Reverse bid: amount + special freebies + special mention"],
      ["28-dealer-bid-filled", "Quick freebies and the must-be-lower rule"],
      ["29-dealer-deal-posted", "Deal posted live; buyer notified instantly"],
      ["30-dealer-post-product", "Post a product — one entry, one category"],
      ["31-dealer-special-deal", "Special deal switch asks for days left"],
      ["32-dealer-product-published", "Published with a days-left counter"],
      ["33-dealer-products", "Product list"],
      ["34-dealer-settings", "Settings: approved categories and profile"],
      ["35-dealer-category-request", "Requesting an extra category from the super admin"],
    ],
  },
  {
    id: "admin",
    title: "7 · Super admin console",
    blurb:
      "Verification of dealers (approve issues the username + temporary password by e-mail), category requests, the auction monitor and every outbound e-mail.",
    items: [
      ["37-admin-dashboard", "Verification desk with documents and requested categories"],
      ["38-admin-approved", "Approval issues the login and e-mails the temporary password"],
      ["39-admin-category-requests", "Category request queue"],
      ["40-admin-category-approved", "Category added to the dealer profile"],
      ["41-admin-auctions", "Auction monitor with timers and best offers"],
      ["42-admin-auction-detail", "Auction detail with every offer"],
      ["43-admin-mailbox", "Outbound mailbox"],
      ["44-admin-mailbox-approvals", "Approval e-mails carrying the temporary passwords"],
      ["46-dealer-new-home", "The newly approved dealer, signed in on their own home page"],
    ],
  },
];

const cards = SECTIONS.map((section) => {
  const items = section.items
    .filter(([name]) => byName.has(name))
    .map(([name, caption]) => {
      const meta = byName.get(name);
      return `
        <figure class="card">
          <div class="frame">
            <img src="./screenshots/${name}.png" alt="${escapeHtml(caption)}" loading="lazy" />
          </div>
          <figcaption>
            <span class="file">${name}</span>
            <span class="cap">${escapeHtml(caption)}</span>
            ${meta?.note && meta.note !== caption ? `<span class="note">${escapeHtml(meta.note)}</span>` : ""}
          </figcaption>
        </figure>`;
    })
    .join("");
  return `
    <section id="${section.id}">
      <h2>${escapeHtml(section.title)}</h2>
      <p class="blurb">${escapeHtml(section.blurb)}</p>
      <div class="grid">${items}</div>
    </section>`;
}).join("");

const nav = SECTIONS.map((s) => `<a href="#${s.id}">${escapeHtml(s.title.replace(/^\d+ · /, ""))}</a>`).join("");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BidVerse — app walkthrough</title>
<style>
  :root {
    --brand: #0F8B8D;
    --brand-dark: #0F6F71;
    --bg: #F8FAFA;
    --card: #FFFFFF;
    --border: #E4E8E8;
    --text: #1A1D1F;
    --muted: #6F767E;
    --faint: #9BA4AE;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  header {
    background: linear-gradient(135deg, #0F8B8D 0%, #0F6F71 100%);
    color: #fff;
    padding: 44px 28px 38px;
  }
  header .wrap { max-width: 1180px; margin: 0 auto; }
  header .kicker { font-size: 11px; letter-spacing: 2px; font-weight: 800; color: #BFEDEC; }
  header h1 { margin: 10px 0 8px; font-size: 34px; letter-spacing: -0.6px; }
  header p { margin: 0; color: #D6F5F3; max-width: 720px; }
  header .meta { margin-top: 18px; font-size: 13px; color: #BFEDEC; }
  nav {
    position: sticky; top: 0; z-index: 10;
    background: rgba(255,255,255,0.96);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(8px);
    padding: 12px 20px;
    display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
  }
  nav a {
    color: var(--brand-dark); text-decoration: none; font-size: 13px; font-weight: 700;
    padding: 7px 13px; border-radius: 20px; background: #E6F5F5;
  }
  nav a:hover { background: var(--brand); color: #fff; }
  main { max-width: 1180px; margin: 0 auto; padding: 26px 20px 80px; }
  section { margin-top: 42px; }
  section h2 { font-size: 22px; margin: 0 0 6px; }
  .blurb { color: var(--muted); margin: 0 0 20px; max-width: 900px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
    gap: 22px;
  }
  .card { margin: 0; background: var(--card); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
  .frame { background: #0d1117; padding: 10px; display: flex; justify-content: center; }
  .frame img { width: 100%; max-width: 300px; height: auto; border-radius: 12px; display: block; }
  figcaption { padding: 12px 14px 15px; display: flex; flex-direction: column; gap: 4px; }
  .file {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; color: var(--faint);
  }
  .cap { font-size: 13.5px; font-weight: 700; }
  .note { font-size: 12px; color: var(--muted); }
  footer { border-top: 1px solid var(--border); padding: 26px 20px 60px; text-align: center; color: var(--muted); font-size: 13px; }
  footer code { background: #E6F5F5; padding: 2px 6px; border-radius: 6px; color: var(--brand-dark); }
</style>
</head>
<body>
<header>
  <div class="wrap">
    <div class="kicker">BIDVERSE · APP WALKTHROUGH</div>
    <h1>Reverse auctions, screen by screen</h1>
    <p>
      These are real screenshots of the running application, captured in a Chromium browser at a
      420&nbsp;×&nbsp;900 mobile viewport. Nothing here is a mock-up — each frame comes from the
      live Expo web build of this repository.
    </p>
    <div class="meta">
      ${buyer.length + dealer.length} screens · buyer, dealer and super-admin flows ·
      screenshots in <code>docs/screenshots/</code> · rebuild with <code>node scripts/build-gallery.mjs</code>
    </div>
  </div>
</header>
<nav>${nav}</nav>
<main>${cards}</main>
<footer>
  BidVerse — Expo Router (React Native + web) · live preview on the dev server ·
  regenerate the screenshots with the Playwright capture scripts.
</footer>
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.log(`wrote ${OUT} (${buyer.length + dealer.length} screens, ${(html.length / 1024).toFixed(0)} kB)`);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
