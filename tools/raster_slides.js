// Pre-render assets/slide*.svg to WebP-ready PNGs (the build embeds the lighter WebP when it is newer than the SVG).
// usage: node tools/raster_slides.js   (uses the preinstalled Playwright Chromium), then python3 tools/raster_slides.py
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'assets');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1344, height: 768 } });
  for (const f of fs.readdirSync(dir).filter((n) => /^slide\d+\.svg$/.test(n))) {
    const svg = fs.readFileSync(path.join(dir, f)).toString('base64');
    await p.setContent('<body style="margin:0"><img style="width:1344px;height:768px;object-fit:cover;display:block" src="data:image/svg+xml;base64,' + svg + '"></body>');
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(dir, f.replace('.svg', '.png')) });
    console.log('rendered', f);
  }
  await b.close();
})();
