const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const filePath = 'file://' + path.resolve('shell.html');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 375px — mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(filePath, { waitUntil: 'networkidle' });
  const body375 = await page.evaluate(() => {
    return document.body.scrollWidth + 'x' + document.body.scrollHeight;
  });
  const overflow375 = await page.evaluate(() => {
    return document.body.scrollWidth > document.documentElement.clientWidth;
  });
  await page.screenshot({ path: 'qa/shell-375.png', fullPage: false });
  console.log('375px: scroll=' + body375 + ', overflow=' + overflow375);

  // 1920px — desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(filePath, { waitUntil: 'networkidle' });
  const body1920 = await page.evaluate(() => {
    return document.body.scrollWidth + 'x' + document.body.scrollHeight;
  });
  const overflow1920 = await page.evaluate(() => {
    return document.body.scrollWidth > document.documentElement.clientWidth;
  });
  await page.screenshot({ path: 'qa/shell-1920.png', fullPage: false });
  console.log('1920px: scroll=' + body1920 + ', overflow=' + overflow1920);

  await browser.close();
})();
