import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const generateImage = async ({ to, from, message }) => {

  // =========================
  // 1. READ HTML TEMPLATE
  // =========================

  const templatePath = path.resolve(
    "src",
    "templates",
    "template.html"
  );

  let html = fs.readFileSync(templatePath, "utf8");

  // =========================
  // 2. CONVERT IMAGE TO BASE64
  // =========================

  const imagePath = path.resolve(
    "public",
    "template.png"
  );

  const imageBuffer = fs.readFileSync(imagePath);

  const base64Image =
    `data:image/png;base64,${imageBuffer.toString("base64")}`;

  // =========================
  // 3. REPLACE PLACEHOLDERS
  // =========================

  html = html
    .replace("{{TO}}", to || "Someone")
    .replace("{{FROM}}", from || "Unknown")
    .replace("{{MESSAGE}}", message || "")
    .replace("{{BACKGROUND_IMAGE}}", base64Image);

  // =========================
  // 4. START PUPPETEER
  // =========================

  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();

  // Instagram portrait size
  await page.setViewport({
    width: 678,
    height: 959
  });

  // =========================
  // 5. LOAD HTML
  // =========================

  await page.setContent(html, {
    waitUntil: "networkidle0"
  });

  // =========================
  // 6. SCREENSHOT TEMPLATE ONLY
  // =========================

  const element = await page.$(".template");

  const screenshotBuffer = await element.screenshot({
    type: "png"
  });

  // =========================
  // 7. SAFE FILE NAME
  // =========================

  const date = new Date().toISOString().split("T")[0];

  const cleanTo = (to || "someone")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();

  const unique = crypto.randomUUID().slice(0, 8);

  const fileName =
    `To-${cleanTo}-${date}-${unique}.png`;

  const filePath = path.join(
    "uploads",
    fileName
  );

  // =========================
  // 8. SAVE IMAGE
  // =========================

  fs.writeFileSync(filePath, screenshotBuffer);

  await browser.close();

  return filePath;
};