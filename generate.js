const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ 
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  await page.goto('file:///C:/Users/Gabbo/Desktop/MARKETING/funnel_lead_magnet/assets/pyxed_cheat_sheet.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Users\\Gabbo\\Desktop\\MARKETING\\funnel_lead_magnet\\assets\\pyxed_cheat_sheet.png' });
  await browser.close();
  console.log('PNG generated successfully.');
})();
