import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[name=email]', 'aarav.sharma@fooddash.app');
await page.fill('input[name=password]', 'Demo@1234');
await page.click('button[type=submit]');
await page.waitForURL((u) => !u.pathname.includes('/login'));

await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle' });
const text = await page.locator('body').innerText();
const hasStripeHint = /Stripe is not configured|Add Stripe test keys|Cash on Delivery/i.test(
  text
);
const cardBtn = page.locator('button:has-text("Pay by Card")');
const cardCount = await cardBtn.count();
const cardDisabled = cardCount ? await cardBtn.first().isDisabled() : null;
const stripeReady = /Secure Stripe|Pay by Card/i.test(text) && !/Stripe is not configured/i.test(text);

console.log(
  JSON.stringify(
    {
      url: page.url(),
      hasStripeHint,
      stripeReady,
      cardCount,
      cardDisabled,
      emptyCart: /cart is empty|empty cart|no items/i.test(text),
    },
    null,
    2
  )
);

await browser.close();
