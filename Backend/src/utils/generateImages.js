//C:\Users\yashl\OneDrive\Desktop\clean-repo\Backend\src\utils\generateImages.js
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
      ],
    }).catch((err) => {
      browserPromise = null;
      throw err;
    });
  }

  return browserPromise;
}

export const generateImages = async ({
  to,
  from,
  message,
  theme = "signal",
}) => {

  const templatePath = path.resolve(
  "src",
  "templates",
  "template.html"
);

const themeFiles = {
  signal: "wavelength-template-signal.png",
  love: "wavelength-template-love.png",
  funny: "wavelength-template-funny.png",
};

const themeFile =
  themeFiles[theme] ||
  themeFiles.signal;

const imagePath = path.resolve(
  "public",
  themeFile
);

let html = fs.readFileSync(
  templatePath,
  "utf8"
);

const imageBuffer =
  fs.readFileSync(imagePath);

const base64Image =
  `data:image/png;base64,${imageBuffer.toString("base64")}`;


const browser = await getBrowser();

  const page = await browser.newPage();

  
  // IMPORTANT
  await page.setViewport({
    width: 500,
    height: 706,
    deviceScaleFactor: 2,
  });
  
  console.log(await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  })));

  
  await page.setContent(html, {
  waitUntil: "domcontentloaded"
});

await page.evaluateHandle(
  "document.fonts.ready"
);


  // SEND DATA TO BROWSER
  const pagesData = await page.evaluate(
    ({ to, from, message }) => {

      const pages = [];

      let remainingText = message || "";

      while (remainingText.length > 0) {

        const container =
          document.createElement("div");

        container.className = "template";
        container.style.visibility = "hidden";

        container.innerHTML = `
          <div class="previewTo">${to || "Someone"}</div>
          <div class="message"></div>
          <div class="previewFrom">${from || "Unknown"}</div>
        `;

        document.body.appendChild(container);
        container.offsetHeight;

        const msgBox =
          container.querySelector(".message");

        let fontSize = 42;
        const MIN_FONT = 24;

        let visibleText = remainingText;

        msgBox.innerText = visibleText;
        msgBox.style.fontSize = fontSize + "px";

        let lineHeight = 1.8;
        msgBox.style.lineHeight = String(lineHeight);

        while (
          msgBox.scrollHeight >
            msgBox.clientHeight &&
          fontSize > MIN_FONT
        ) {
          fontSize--;

          msgBox.style.fontSize =
          fontSize + "px";

          msgBox.offsetHeight;

          lineHeight -= 0.015;

          if (lineHeight < 1.1) {
            lineHeight = 1.1;
          }

          msgBox.style.lineHeight = String(lineHeight);
        }

        while (
          msgBox.scrollHeight >
            msgBox.clientHeight &&
          visibleText.length > 0
        ) {
          visibleText =
            visibleText.slice(0, -1);

          msgBox.innerText = visibleText;
        }

        pages.push({
          text: visibleText,
          fontSize
        });

        remainingText =
  remainingText.slice(
    visibleText.length
  );

        container.remove();
      }

      return pages;

    },
    { to, from, message }
  );

  const imagePaths = [];

  // GENERATE REAL PAGES
  for (let i = 0; i < pagesData.length; i++) {

    const item = pagesData[i];

    let finalHtml = html
  .replace("{{TO}}", to || "Someone")
  .replace("{{FROM}}", from || "Unknown")
  .replace("{{MESSAGE}}", item.text)
  .replace("{{BACKGROUND_IMAGE}}", base64Image);

await page.setContent(finalHtml, {
  waitUntil: "domcontentloaded"
});

await page.evaluateHandle(
  "document.fonts.ready"
);

// APPLY FONT SIZE
await page.evaluate((fontSize) => {
  document.querySelector(
    ".message"
  ).style.fontSize =
    fontSize + "px";
}, item.fontSize);

    const element = await page.$(".template");

const imageBuffer =
  await element.screenshot({
    type: "jpeg",
    quality: 85
  });

    const uploadDir = path.resolve("uploads");

// create uploads folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const filePath = path.join(
  uploadDir,
  `${Date.now()}-${i + 1}.jpg`
);

fs.writeFileSync(filePath, imageBuffer);
    imagePaths.push(filePath);
  }

  return imagePaths;
};