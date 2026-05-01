import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const generateImage = async ({ to, from, message }) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const html = `
    <html>
      <body style="
        width:500px;
        height:700px;
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
        font-family:sans-serif;
        text-align:center;
      ">
        <h2>To: ${to || "Someone"}</h2>
        <p>${message}</p>
        <h3>From: ${from || "Unknown"}</h3>
      </body>
    </html>
  `;

  await page.setContent(html);

  const imageBuffer = await page.screenshot({ type: "png" });

  // ✅ SAVE FILE LOCALLY
  const filePath = path.join("uploads", `confession-${Date.now()}.png`);

  fs.writeFileSync(filePath, imageBuffer);

  await browser.close();

  return filePath; // 👈 return path instead of buffer
};