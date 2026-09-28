import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = 'C:\\Users\\vivee\\.gemini\\antigravity\\brain\\4807344b-b199-4472-847d-45317caaf791';

async function run() {
  console.log('Launching Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.toString()}`));

  // 1. Landing Page
  console.log('Navigating to Landing Page (http://127.0.0.1:5173/)...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(outDir, '01_landing_mobile.png'), fullPage: true });
  console.log('Saved 01_landing_mobile.png');

  // 2. Test Page
  console.log('Navigating to Test Page (http://127.0.0.1:5173/test)...');
  await page.goto('http://127.0.0.1:5173/test', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(outDir, '02_test_setup_mobile.png'), fullPage: true });
  console.log('Saved 02_test_setup_mobile.png');

  // 3. Start Test and capture Scanning phase
  console.log('Clicking "Start Test"...');
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Start Test'));
    if (!btn) throw new Error('Start Test button not found');
    btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2200)); // wait 2.2s into 5s scan
  await page.screenshot({ path: path.join(outDir, '03_test_scanning_mobile.png'), fullPage: true });
  console.log('Saved 03_test_scanning_mobile.png');

  // 4. Wait for completion and transition to Result Page (5s scan + buffer)
  console.log('Waiting for Result page navigation...');
  await new Promise(r => setTimeout(r, 3800));
  await page.waitForFunction(() => window.location.pathname === '/result', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '04_result_mobile.png'), fullPage: true });
  console.log('Saved 04_result_mobile.png');

  console.log('\n--- Console logs during test run ---');
  consoleLogs.forEach(log => console.log(log));

  await browser.close();
  console.log('All mobile tests completed successfully!');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
