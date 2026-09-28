import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = 'C:\\Users\\vivee\\.gemini\\antigravity\\brain\\4807344b-b199-4472-847d-45317caaf791';

async function testScenario(scenarioValue, isSilage, filename) {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://127.0.0.1:5173/test', { waitUntil: 'networkidle0' });

  if (isSilage) {
    await page.evaluate(() => {
      const silageBtn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Silage'));
      silageBtn?.click();
    });
    await new Promise(r => setTimeout(r, 200));
  }

  await page.select('select', scenarioValue);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Start Test'));
    btn?.click();
  });

  await new Promise(r => setTimeout(r, 6000));
  await page.waitForFunction(() => window.location.pathname === '/result', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
  console.log(`Saved ${filename}`);
  await browser.close();
}

async function run() {
  console.log('Testing Suspicious Feed scenario...');
  await testScenario('suspicious', false, '05_suspicious_feed_result.png');

  console.log('Testing Spoiling Silage scenario...');
  await testScenario('spoiling_silage', true, '06_spoiling_silage_result.png');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
