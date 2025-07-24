// Pierwsza wersja skryptu - błąd co 30 sekund

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

// async function checkJobs() {
//    const browser = await puppeteer.launch({ headless: "new" });
//    const page = await browser.newPage();

//    await page.goto('https://bws.onsinch.com/', { waitUntil: 'networkidle2' });

//    await page.type('input[type="email"]', process.env.LOGIN);
//    await page.type('input[type="password"]', process.env.PASSWORD);
//    await Promise.all([
//       page.click('input[type="submit"]'),
//       page.waitForNavigation({ waitUntil: 'networkidle2' })
//    ]);

//    await page.goto('https://bws.onsinch.com/react/position', { waitUntil: 'networkidle2' });

//    const jobs = await page.$$('tr.MuiTableRow-root.MuiTableRow-hover');
//    const jobCount = jobs.length;

//    if (jobCount > previousJobCount) {
//       await notifyTelegram(`📢 NOWE ZLECENIA! Było: ${previousJobCount}, jest: ${jobCount}`);
//    }

//    previousJobCount = jobCount;

//    await browser.close();
// }

// // Sprawdzaj co 10 sekund
// setInterval(checkJobs, 10000);


//Druga wersja skryptu - wysyła test powiadomienie co 60 sekund

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
//    const browser = await puppeteer.launch({ headless: "new" });
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

//       // Sprawdzanie co 10s bez restartu Puppeteera
//       setInterval(async () => {
//          try {
//             await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

//             const jobs = await page.$$('tr.MuiTableRow-root.MuiTableRow-hover');
//             const jobCount = jobs.length;

//             if (jobCount > previousJobCount) {
//                await notifyTelegram(`📢 NOWE ZLECENIA! Było: ${previousJobCount}, jest: ${jobCount}`);
//             }

//             previousJobCount = jobCount;
//          } catch (err) {
//             console.error('❌ Błąd podczas sprawdzania zleceń:', err.message);
//          }
//       }, 10000); // co 10 sekund
//    } catch (err) {
//       console.error('❌ Błąd logowania:', err.message);
//       await browser.close();
//    }
// })();

require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

let previousJobCount = 0;

async function notifyTelegram(message) {
   const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
   await axios.post(url, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message
   });
}

(async () => {
   const browser = await puppeteer.launch({ headless: "new" });
   const page = await browser.newPage();

   try {
      await page.goto('https://bws.onsinch.com/', { waitUntil: 'networkidle2', timeout: 60000 });

      await page.type('input[type="email"]', process.env.LOGIN);
      await page.type('input[type="password"]', process.env.PASSWORD);

      await Promise.all([
         page.click('input[type="submit"]'),
         page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      ]);

      await page.goto('https://bws.onsinch.com/react/position', { waitUntil: 'networkidle2', timeout: 60000 });

      // Teraz pętla, która NIE ZAMYKA przeglądarki
      setInterval(async () => {
         try {
            await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

            // Poczekaj aż pojawi się co najmniej jeden wiersz zlecenia
            await page.waitForSelector('tr.MuiTableRow-root.MuiTableRow-hover', { timeout: 10000 });

            const jobs = await page.$$('tr.MuiTableRow-root.MuiTableRow-hover');
            const jobCount = jobs.length;

            if (jobCount > previousJobCount) {
               await notifyTelegram(`📢 NOWE ZLECENIA! Było: ${previousJobCount}, jest: ${jobCount}`);
            }

            previousJobCount = jobCount;

            console.log(`Sprawdzono: ${jobCount} zleceń.`);
         } catch (err) {
            console.error('Błąd podczas odświeżania lub sprawdzania:', err.message);
         }
      }, 5000);


   } catch (err) {
      console.error('Błąd logowania lub startu:', err.message);
      // W tym miejscu można próbować restartować cały proces, ale to opcjonalne
   }
})();

