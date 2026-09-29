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
  userAgent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Mobile Safari/537.36",
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
  await page.waitForTimeout(900);
}
const firstLabel = (t) => t.split(" (")[0];

/* ---------------------------------------------------------------- splash */
await go("/");
await shot("01-splash", "Splash: separate buyer and dealer logins");

/* ------------------------------------------------------------ auth flows */
await tap("Login as Dealer");
await shot("02-dealer-login", "Dealer login (super admin signs in here too)");
await tap("Register Now");
await shot("03-dealer-register-step1", "Dealer registration · basic info");
await page.getByPlaceholder("Enter your full name").fill("Balaji Rajan");
await page.getByPlaceholder("your@email.com").fill("sribalaji@email.com");
await page.getByPlaceholder("+91 98765 43210").fill("+91 90000 55555");
await page.getByPlaceholder("Choose a username").fill("sribalaji");
await tap("Next  →");
await shot("04-dealer-register-documents", "Documents: PAN, Aadhaar, GST, store image");
await page.getByPlaceholder("ABCDE1234F", { exact: true }).fill("SRBLJ4567Z");
await page.getByPlaceholder("1234 5678 9012").fill("2345 6789 0123");
await page.getByPlaceholder("33ABCDE1234F1Z5").fill("33SRBLJ4567Z1Z4");
await tap("Store / Shop Image *");
await tap("Next  →");
await shot("05-dealer-register-business", "Store address and location for nearby notifications");
await page.getByPlaceholder("e.g. TechHub Chennai").fill("Sri Balaji Electronics");
await page.getByPlaceholder("Street, area").fill("77, Mount Road, Saidapet");
await page.getByPlaceholder("Chennai", { exact: true }).fill("Chennai");
await page.getByPlaceholder("Tamil Nadu").fill("Tamil Nadu");
await page.getByPlaceholder("600018").fill("600015");
await tap("Next  →");
await shot("06-dealer-register-categories", "Category selection + review");
await tap("Electronics");;
await tap("Submit for Review");
await shot("07-dealer-register-done", "“Will get the login after the approve within 24 Hours”");

await go("/auth/dealer-login");
await tap("Forgot password / Reset password");
await shot("08-forgot-password", "Password reset: request a verification code");
await page.getByPlaceholder("techhub").first().fill("techhub");
await tap("Send Code");
await shot("09-reset-code", "6-digit code e-mailed (sandbox code shown)");

/* ------------------------------------------------------------- buyer flow */
await go("/auth/buyer-login");
await shot("10-buyer-login", "Buyer login");
await page.getByPlaceholder("your@email.com").first().fill("arun.prakash@email.com");
await page.getByPlaceholder("••••••••").fill("buyer@123");
await tap("Sign In");
await page.waitForTimeout(1500);
await shot("11-buyer-home", "Buyer home: hero, live auctions, top deals");
await page.mouse.wheel(0, 1150);
await page.waitForTimeout(600);
await shot("12-buyer-home-categories", "Browse by category, special deals and how an auction works");

await go("/user/new-auction");
await page.getByPlaceholder("e.g. iPhone 15 Pro Max 256GB").fill("LG 8kg Front Load Washing Machine");
await page.getByPlaceholder("e.g. 145000").fill("38000");
await page.getByPlaceholder("Colour, model, condition, warranty expectations…").fill("5-star inverter, installation included, 2-year warranty");
await shot("13-new-auction", "Publish auction: category, days open, deal amount");
await tap("Publish Auction");
await shot("14-auction-published", "Stores notified, bidding opens in 10 minutes");

await go("/user/auctions");
await shot("15-buyer-auctions-live", "My auctions · live");
await tap("Previous");
await shot("16-buyer-auctions-previous", "Previous auctions with full detail");

await go("/user/auction/auc-1");
await shot("17-auction-room-offers", "Live auction room: timer, offer feed, best offer");
await tap("Group chat");
await shot("18-auction-room-chat", "Live group chat with all participating stores");
await tap("Detail");
await shot("19-auction-detail", "Full auction detail and timings");

await go("/user/special-deals");
await shot("20-special-deals", "Special deals with days-left counters + category filter");

await go("/user/profile");
await shot("21-buyer-profile", "Buyer profile");

await go("/notifications");
await shot("22-notifications", "Live deal notifications");

await go("/mailbox");
await shot("23-mailbox", "Sandbox mailbox: every transactional e-mail");

fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(shots, null, 2));
console.log("TOTAL", shots.length);
await browser.close();
