import { chromium } from 'playwright';

const orderId = process.argv[2];
if (!orderId) {
  console.error('Usage: node verify-tracking.mjs <orderId>');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});

try {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"], input[name="email"]', 'aarav.sharma@fooddash.app');
  await page.fill('input[type="password"], input[name="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });

  await page.goto(`http://localhost:5173/orders/${orderId}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  await page.waitForSelector('text=Live tracking', { timeout: 20000 });
  const body = await page.locator('body').innerText();
  const hasOsm = /OpenStreetMap/i.test(body);
  const hasProgress = /out for delivery|Out For Delivery|\d+%/i.test(body);
  const leaflet = await page.locator('.leaflet-container').count();
  const mapTiles = await page.locator('.leaflet-tile-pane img, .leaflet-layer img').count();

  // Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const mobileLeaflet = await page.locator('.leaflet-container').count();

  console.log(
    JSON.stringify(
      {
        ok: true,
        hasLiveTracking: true,
        hasOsm,
        hasProgress,
        leaflet,
        mapTiles,
        mobileLeaflet,
        pageErrors: errors.slice(0, 8),
      },
      null,
      2
    )
  );

  if (!hasOsm && leaflet === 0) {
    throw new Error('Map did not render (no Leaflet container / OSM label)');
  }
} catch (err) {
  console.error('VERIFY_FAILED', err.message);
  console.error('pageErrors', errors.slice(0, 10));
  process.exitCode = 1;
} finally {
  await browser.close();
}
