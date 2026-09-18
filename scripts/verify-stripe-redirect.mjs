import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const baseApi = 'http://localhost:5000/api';

// Seed cart via API so checkout has items
const login = await (
  await fetch(`${baseApi}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav.sharma@fooddash.app',
      password: 'Demo@1234',
    }),
  })
).json();
const token = login.data.token;
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};
const rests = await (await fetch(`${baseApi}/restaurants?limit=20`)).json();
const restaurant = rests.data.items.find((r) => r.name === 'Spice Route Kitchen');
const menu = await (
  await fetch(`${baseApi}/menu/restaurants/${restaurant._id}`)
).json();
await fetch(`${baseApi}/cart`, { method: 'DELETE', headers });
await fetch(`${baseApi}/cart/items`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    foodItemId: menu.data.items[0]._id,
    quantity: 1,
    clearExisting: true,
  }),
});

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[name=email]', 'aarav.sharma@fooddash.app');
await page.fill('input[name=password]', 'Demo@1234');
await page.click('button[type=submit]');
await page.waitForURL((u) => !u.pathname.includes('/login'));

await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle' });

// Ensure card is selected
const cardBtn = page.locator('button:has-text("Pay by Card")');
await cardBtn.click();
const continueBtn = page.locator('button:has-text("Continue to Stripe payment")');
await continueBtn.waitFor({ timeout: 10000 });

// Address may be required if user has none — fill if inputs visible
const street = page.locator('input').filter({ has: page.locator('xpath=ancestor::*[contains(.,"Street")]') }).first();
// Prefer labeled inputs via placeholder/nearby; use getByLabel if available
const streetInput = page.getByLabel(/street/i);
if (await streetInput.count()) {
  const val = await streetInput.inputValue();
  if (!val) {
    await streetInput.fill('100 Congress Ave');
    await page.getByLabel(/^city$/i).fill('Austin');
    await page.getByLabel(/^state$/i).fill('TX');
    await page.getByLabel(/^zip$/i).fill('78701');
  }
}

const [redirectResponse] = await Promise.all([
  page.waitForURL(/checkout\.stripe\.com/, { timeout: 45000 }),
  continueBtn.click(),
]);

const finalUrl = page.url();
console.log(
  JSON.stringify(
    {
      ok: finalUrl.includes('checkout.stripe.com'),
      urlPrefix: finalUrl.slice(0, 48),
    },
    null,
    2
  )
);

if (!finalUrl.includes('checkout.stripe.com')) {
  process.exit(1);
}

await browser.close();
