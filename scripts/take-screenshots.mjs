import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5000";
const SCREENSHOT_DIR = "/tmp/screenshots";

const publicPages = [
  { name: "Landing Page", path: "/", description: "Public homepage with hero, features, testimonials" },
  { name: "Shop Page", path: "/shop", description: "Product browsing with filters and product cards" },
  { name: "Checkout Page", path: "/checkout", description: "Multi-step order composition and checkout" },
  { name: "Order Tracking Page", path: "/tracking", description: "Track orders by token or contact info" },
  { name: "Login Page", path: "/login", description: "Staff authentication" },
];

const adminPages = [
  { name: "Dashboard", path: "/dashboard", description: "Overview with stats, charts, recent orders" },
  { name: "Catalog Management", path: "/dashboard/catalog", description: "Orchid, pot, decoration, shipping, payment types" },
  { name: "Orders Management", path: "/dashboard/orders", description: "Order list with status management" },
  { name: "Pre-made Pots", path: "/dashboard/premade-pots", description: "Pre-made pot inventory management" },
  { name: "Customers", path: "/dashboard/customers", description: "Customer management with stats" },
  { name: "Technicians", path: "/dashboard/technicians", description: "Technician workload and assignments" },
  { name: "Suppliers", path: "/dashboard/suppliers", description: "Supplier management with ratings" },
  { name: "Inventory", path: "/dashboard/inventory", description: "Stock levels and alerts" },
  { name: "Purchase Orders", path: "/dashboard/purchase-orders", description: "Purchase order tracking" },
  { name: "Reports", path: "/dashboard/reports", description: "Sales, orders, customer analytics" },
  { name: "Notifications", path: "/dashboard/notifications", description: "Notification management" },
  { name: "Audit Log", path: "/dashboard/audit-log", description: "System activity log" },
  { name: "Settings", path: "/dashboard/settings", description: "Tax, display, API credentials config" },
  { name: "Users", path: "/dashboard/users", description: "Staff account management" },
];

async function run() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
    args: ["--no-sandbox", "--disable-gpu", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const screenshots = [];

  console.log("=== Taking Public Page Screenshots ===");
  for (const pg of publicPages) {
    console.log(`  Capturing: ${pg.name} (${pg.path})`);
    try {
      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1000);
      const filename = `${pg.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      const imageData = fs.readFileSync(filepath);
      const base64 = imageData.toString("base64");
      screenshots.push({ ...pg, filename, base64 });
      console.log(`    OK`);
    } catch (e) {
      console.log(`    ERROR: ${e.message}`);
    }
  }

  console.log("\n=== Logging in as Admin ===");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(500);
  await page.fill('input[data-testid="input-username"], input[placeholder*="username" i], input[name="username"], input:first-of-type', "admin");
  await page.fill('input[data-testid="input-password"], input[type="password"]', "admin123");
  await page.click('button[data-testid="button-login"], button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  console.log("  Logged in successfully\n");

  console.log("=== Taking Admin Page Screenshots ===");
  for (const pg of adminPages) {
    console.log(`  Capturing: ${pg.name} (${pg.path})`);
    try {
      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1500);
      const filename = `${pg.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      const imageData = fs.readFileSync(filepath);
      const base64 = imageData.toString("base64");
      screenshots.push({ ...pg, filename, base64 });
      console.log(`    OK`);
    } catch (e) {
      console.log(`    ERROR: ${e.message}`);
    }
  }

  await browser.close();

  console.log("\n=== Generating HTML file ===");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orchid Sales App - All Pages Screenshots</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a2e; }
    .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 48px 24px; text-align: center; }
    .header h1 { font-size: 2rem; margin-bottom: 8px; }
    .header p { opacity: 0.85; font-size: 1.1rem; }
    .toc { max-width: 900px; margin: 32px auto; padding: 0 24px; }
    .toc h2 { font-size: 1.3rem; margin-bottom: 16px; color: #7c3aed; }
    .toc-section { margin-bottom: 24px; }
    .toc-section h3 { font-size: 1rem; margin-bottom: 8px; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .toc-list { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
    .toc-list a { display: block; padding: 10px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; text-decoration: none; color: #1a1a2e; font-size: 0.95rem; transition: border-color 0.2s; }
    .toc-list a:hover { border-color: #7c3aed; }
    .toc-list a .page-path { font-size: 0.8rem; color: #888; margin-top: 2px; }
    .pages { max-width: 1200px; margin: 0 auto; padding: 0 24px 64px; }
    .page-section { margin-bottom: 64px; scroll-margin-top: 24px; }
    .page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
    .page-header h2 { font-size: 1.4rem; color: #1a1a2e; }
    .page-header .path-badge { background: #f3f0ff; color: #7c3aed; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-family: monospace; }
    .page-desc { color: #666; margin-bottom: 16px; font-size: 0.95rem; }
    .page-img-wrapper { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: white; }
    .page-img-wrapper img { width: 100%; display: block; }
    .divider { border: none; border-top: 2px solid #e5e7eb; margin: 48px 0; }
    .section-label { font-size: 1.6rem; font-weight: 700; color: #7c3aed; margin: 48px 0 24px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb; }
    .generated { text-align: center; color: #999; font-size: 0.85rem; padding: 32px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Orchid Sales App - Page Screenshots</h1>
    <p>${screenshots.length} pages captured on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>

  <div class="toc">
    <h2>Table of Contents</h2>
    <div class="toc-section">
      <h3>Public Pages (${publicPages.length})</h3>
      <ul class="toc-list">
        ${screenshots.filter(s => publicPages.some(p => p.path === s.path)).map((s, i) => `<li><a href="#page-${i}"><strong>${s.name}</strong><div class="page-path">${s.path}</div></a></li>`).join("\n        ")}
      </ul>
    </div>
    <div class="toc-section">
      <h3>Admin Dashboard Pages (${adminPages.length})</h3>
      <ul class="toc-list">
        ${screenshots.filter(s => adminPages.some(p => p.path === s.path)).map((s) => {
          const idx = screenshots.indexOf(s);
          return `<li><a href="#page-${idx}"><strong>${s.name}</strong><div class="page-path">${s.path}</div></a></li>`;
        }).join("\n        ")}
      </ul>
    </div>
  </div>

  <div class="pages">
    <div class="section-label">Public Pages</div>
    ${screenshots.map((s, i) => {
      const isFirstAdmin = adminPages.length > 0 && s.path === adminPages[0].path;
      return `${isFirstAdmin ? '<div class="section-label">Admin Dashboard Pages</div>' : ''}
    <div class="page-section" id="page-${i}">
      <div class="page-header">
        <h2>${i + 1}. ${s.name}</h2>
        <span class="path-badge">${s.path}</span>
      </div>
      <p class="page-desc">${s.description}</p>
      <div class="page-img-wrapper">
        <img src="data:image/png;base64,${s.base64}" alt="${s.name} screenshot" loading="lazy" />
      </div>
    </div>`;
    }).join("\n")}
  </div>

  <div class="generated">Generated on ${new Date().toISOString()}</div>
</body>
</html>`;

  const outputPath = "screenshots-all-pages.html";
  fs.writeFileSync(outputPath, html);
  console.log(`\nDone! Saved to: ${outputPath}`);
  console.log(`Total screenshots: ${screenshots.length}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB`);
}

run().catch(console.error);
