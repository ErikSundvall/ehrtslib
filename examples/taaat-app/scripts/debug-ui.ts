import { chromium } from "npm:playwright@1.50.1";

const testAdl = await Deno.readTextFile(
  new URL("../../../test_data/adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls", import.meta.url),
);
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await browser.newPage();
page.on("console", (m) => console.log("CONSOLE:", m.type(), m.text()));
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "networkidle" });
console.log("has __TAAAT__:", await page.evaluate(() => !!globalThis.__TAAAT__));
await page.evaluate((adl: string) => {
  const t = globalThis.__TAAAT__!;
  t.workspace.clear();
  const r = t.workspace.addFile("smoke.adls", adl);
  return JSON.stringify(r);
}, testAdl);
await page.evaluate(() => {
  globalThis.__TAAAT__!.workspace.setActivePath("smoke.adls");
  globalThis.__TAAAT__!.reloadUi();
});
await page.waitForTimeout(800);
const html = await page.locator("#tree-container").innerHTML();
console.log("tree snippet:", html.slice(0, 400));
await browser.close();
