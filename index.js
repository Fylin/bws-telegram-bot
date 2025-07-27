//Działająca wersja skryptu - liczy kazda zmianę w liczbie zleceń



// require('dotenv').config();
// const puppeteer = require('puppeteer');
// const axios = require('axios');

// let previousJobCount = 0;

// async function notifyTelegram(message) {
//    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
//    await axios.post(url, {
//       chat_id: process.env.TELEGRAM_CHAT_ID,
//       text: message
//    });
// }

// (async () => {
//    const browser = await puppeteer.launch({
//       headless: "new",
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//    });

//    const page = await browser.newPage();

//    try {
//       await page.goto('https://bws.onsinch.com/', { waitUntil: 'networkidle2', timeout: 60000 });

//       await page.type('input[type="email"]', process.env.LOGIN);
//       await page.type('input[type="password"]', process.env.PASSWORD);

//       await Promise.all([
//          page.click('input[type="submit"]'),
//          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
//       ]);

//       await page.goto('https://bws.onsinch.com/react/position', { waitUntil: 'networkidle2', timeout: 60000 });

//       // Teraz pętla, która NIE ZAMYKA przeglądarki
//       setInterval(async () => {
//          try {
//             await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

//             // Poczekaj aż pojawi się co najmniej jeden wiersz zlecenia
//             await page.waitForSelector('tr.MuiTableRow-root.MuiTableRow-hover', { timeout: 10000 });

//             const jobs = await page.$$('tr.MuiTableRow-root.MuiTableRow-hover');
//             const jobCount = jobs.length;

//             if (jobCount > previousJobCount) {
//                await notifyTelegram(`📢 NOWE ZLECENIA! Było: ${previousJobCount}, jest: ${jobCount}`);
//             }

//             previousJobCount = jobCount;
//          } catch (err) {
//             console.error('Błąd podczas odświeżania lub sprawdzania:', err.message);
//          }
//       }, 5000);


//    } catch (err) {
//       console.error('Błąd logowania lub startu:', err.message);
//       // W tym miejscu można próbować restartować cały proces, ale to opcjonalne
//    }
// })();



//Wysyła liczbe z licznika na stronie



require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

let previousJobCount = 0;
let page, browser;

async function notifyTelegram(message) {
   const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
   await axios.post(url, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message
   });
}

async function loginAndStartBrowser() {
   browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // wymagane na Railway
   });

   page = await browser.newPage();

   await page.goto('https://bws.onsinch.com/', { waitUntil: 'networkidle2' });

   await page.type('input[type="email"]', process.env.LOGIN);
   await page.type('input[type="password"]', process.env.PASSWORD);

   await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
   ]);

   await page.goto('https://bws.onsinch.com/react/position', { waitUntil: 'networkidle2' });

   console.log("✅ Zalogowano i gotowe do monitorowania...");
}

async function checkJobs() {
   try {
      await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

      const countText = await page.$eval('p.MuiTablePagination-caption.MuiTypography-body2', el => el.innerText);
      const match = countText.match(/z\s+(\d+)/);
      const jobCount = match ? parseInt(match[1]) : 0;

      console.log(`🔍 Sprawdzono: ${jobCount} zleceń.`);

      if (jobCount > previousJobCount) {
         await notifyTelegram(`📢 NOWE ZLECENIA! Było: ${previousJobCount}, jest: ${jobCount}`);
      }

      previousJobCount = jobCount;

   } catch (error) {
      console.error("❌ Błąd podczas sprawdzania:", error.message);
   }
}

// Główna funkcja uruchamiająca
(async () => {
   await loginAndStartBrowser();
   setInterval(checkJobs, 10000); // co 10s
})();

