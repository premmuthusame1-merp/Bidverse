import { chromium as pw } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:8081";
const OUT = "/home/user/Bidverse/docs/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await pw.launch({
  executablePath: "/tmp/chromium",
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib:/tmp" },
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--use-gl=swiftshader", "--in-process-gpu", "--font-render-hinting=none"],
  headless: true,
});

const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

const shots = [];
async function shot(name, note) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  shots.push({ name, note });
  console.log("shot:", name);
}
async function go(route) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(1200);
}
async function tap(text, index = 0) {
  const exact = page.getByText(text, { exact: true });
  const target = (await exact.count()) > index ? exact.nth(index) : page.getByText(text, { exact: false }).nth(index);
  await target.click({ timeout: 30000 });
  await page.waitForTimeout(1000);
}
async function login(identifier, password) {
  await go("/auth/dealer-login");
  await page.getByPlaceholder("Your dealer username").fill(identifier);
  await page.getByPlaceholder("••••••••").first().fill(password);
  await page.locator("text=/^Login$/").last().click({ timeout: 30000 });
  await page.waitForTimeout(2000);
}

/* --------------------------------------------------- dealer: home flows */
await login("techhub", "dealer123");
await shot("23-dealer-home-live", "Dealer home: category-matched live auctions");

await tap("Participated");
await shot("24-dealer-participated", "Participated auctions sorted by the running chat timer");

await tap("My posts");
await shot("25-dealer-my-posts", "Previously posted products and deals");

/* ----------------------------------------------------- dealer: bid a deal */
await page.locator("text=/^Live auctions \\(/").first().click();
await page.waitForTimeout(1000);
const join = page.getByText("Open chat & make a deal", { exact: false }).first();
if (await join.count()) {
  await join.click();
} else {
  await page.getByText("Open chat", { exact: false }).first().click();
}
await page.waitForTimeout(1600);
await shot("26-dealer-chat-room", "Auction chat: buyer requirement, timer, offers, outbid state");

const makeDeal = page.locator("text=/Make a deal|Update my deal/").first();
await makeDeal.click();
await page.waitForTimeout(800);
await shot("27-dealer-bid-form", "Reverse bid: amount plus freebies and special mentions");

const amountInput = page.locator('input[inputmode="numeric"], input[type="text"]').filter({ hasNot: page.locator('[placeholder=""]') });
await page.getByPlaceholder("e.g. Free cover + 1-year accidental protection").fill("Free screen guard + 1-year accidental cover");
await page.getByPlaceholder("e.g. Sealed India unit, GST bill, same-day delivery").fill("Sealed India unit with GST invoice, same-day pickup");
await tap("Free delivery");
await shot("28-dealer-bid-filled", "Quick freebie fills and the lower-than-best-price rule");
await tap("Post my deal");
await shot("29-dealer-deal-posted", "Deal posted live in the group chat, buyer notified");

/* ----------------------------------------------- dealer: post product */
await go("/dealer/post-product");
await shot("30-dealer-post-product", "Post a product: one entry, one category");
await page.getByPlaceholder("e.g. Samsung 7kg Front Load Washing Machine").fill("LG 8kg Front Load Washing Machine");
await page.getByPlaceholder("Model, condition, warranty, delivery terms…").fill("5-star inverter, free installation, 2-year warranty");
await page.getByPlaceholder("e.g. 42900").fill("34500");
await page.getByPlaceholder("e.g. 54900").fill("41990");
await tap("★ Special deal");
await page.waitForTimeout(500);
await shot("31-dealer-special-deal", "Special deal switch with the days-left entry");
await tap("10 days");
await tap("Publish product");
await shot("32-dealer-product-published", "Product published with the days-left counter");

/* ------------------------------------------------------- dealer: extras */
await go("/dealer/products");
await shot("33-dealer-products", "Product list with special-deal days left");

await go("/dealer/settings");
await shot("34-dealer-settings", "Settings: approved categories + category request to admin");
await tap("◎ Cameras & Optics");
await page.getByPlaceholder("e.g. We are opening a camera counter this month").fill("Opening a dedicated camera and lens counter this month.");
await tap("Send request to super admin");
await shot("35-dealer-category-request", "Category request raised for super admin approval");

/* ------------------------------------- register a brand new dealer (same session) */
await go("/auth/dealer-register");
await page.getByPlaceholder("Enter your full name").fill("Balaji Rajan");
await page.getByPlaceholder("your@email.com").fill("sribalaji@email.com");
await page.getByPlaceholder("+91 98765 43210").fill("+91 90000 55555");
await page.getByPlaceholder("Choose a username").fill("sribalaji");
await tap("Next  →");
await page.getByPlaceholder("ABCDE1234F", { exact: true }).fill("SRBLJ4567Z");
await page.getByPlaceholder("1234 5678 9012").fill("3456 7890 1234");
await page.getByPlaceholder("33ABCDE1234F1Z5").fill("33SRBLJ4567Z1Z4");
await tap("Store / Shop Image *");
await tap("Next  →");
await page.getByPlaceholder("e.g. TechHub Chennai").fill("Sri Balaji Electronics");
await page.getByPlaceholder("Street, area").fill("21, Bazaar Street, Porur");
await page.getByPlaceholder("Chennai", { exact: true }).fill("Chennai");
await page.getByPlaceholder("Tamil Nadu").fill("Tamil Nadu");
await page.getByPlaceholder("600018").fill("600116");
await tap("Next  →");
await tap("Electronics");
await tap("Submit for Review");
await shot("36-dealer-registration-submitted", "New registration pending verification");

/* --------------------------------------------------------- admin: flows */
await login("superadmin", "admin@123");
await shot("37-admin-dashboard", "Super admin verification desk, dealer awaiting verification");

await tap("Approve & issue login");
await shot("38-admin-approved", "Approval e-mail with username and temporary password issued");

await go("/admin/category-requests");
await shot("39-admin-category-requests", "Category request queue");
await tap("Approve");
await shot("40-admin-category-approved", "Category added to the dealer profile");

await go("/admin/auctions");
await shot("41-admin-auctions", "Auction monitor");
await tap("Detail ▼");
await shot("42-admin-auction-detail", "Auction detail with every offer");

await go("/admin/mailbox");
await shot("43-admin-mailbox", "Outbound mailbox: every transactional e-mail");
await tap("Approvals");
await shot("44-admin-mailbox-approvals", "Approval e-mails with temporary passwords");

/* ------------------------------- dealer first login with temp password */
await go("/admin/mailbox");
await page.waitForTimeout(900);
await tap("Approvals");
const body = await page.locator("text=Temporary password:").first().textContent().catch(() => null);
const temp = body?.match(/Temporary password:\s*([A-Z0-9]{8})/)?.[1] ?? null;
console.log("temporary password found:", temp);

await login("sribalaji", temp ?? "INVALID");
await shot("45-dealer-first-login", "First login with the temporary password forces a reset");
if (temp) {
  await page.getByPlaceholder("From the e-mail").fill(temp);
  await page.getByPlaceholder("Minimum 6 characters").fill("balaji@2026");
  await page.getByPlaceholder("Re-enter password").fill("balaji@2026");
  await tap("Save & Continue");
  await shot("46-dealer-new-home", "Newly approved dealer lands on their own home page");
}

fs.writeFileSync(`${OUT}/index-dealer.json`, JSON.stringify(shots, null, 2));
console.log("TOTAL", shots.length);
await browser.close();
