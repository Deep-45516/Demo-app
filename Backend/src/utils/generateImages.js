import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const generateImages = async ({
  to,
  from,
  message
}) => {

  const templatePath = path.resolve(
  "src",
  "templates",
  "template.html"
);

const imagePath = path.resolve(
  "public",
  "template.png"
);

let html = fs.readFileSync(
  templatePath,
  "utf8"
);

const imageBuffer =
  fs.readFileSync(imagePath);

const base64Image =
  `data:image/png;base64,${imageBuffer.toString("base64")}`;


const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

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
    type: "png"
  });

    const filePath = path.join(
      "uploads",
      `${Date.now()}-${i + 1}.png`
    );

    fs.writeFileSync(filePath, imageBuffer);

    imagePaths.push(filePath);
  }

  await browser.close();

  return imagePaths;
};