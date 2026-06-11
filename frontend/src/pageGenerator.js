export function generatePages(to, from, message) {
  const container = document.getElementById("previewWrapper");
  if (!container) return;
  container.innerHTML = "";

  let remainingText = message || "";

  while (remainingText.length > 0) {
    const { usedLength } = createPage(to, from, remainingText);

  if (usedLength === 0) {
  console.log("Text not fitting, forcing split...");
  break;
  }

    remainingText = remainingText.substring(usedLength);
  }

  if (!message) {
    createPage(to, from, "");
  }
}

function createPage(to, from, text) {
  const template = document.getElementById("template");
  const clone = template.cloneNode(true);

  clone.removeAttribute("id");
  clone.style.display = "block";
  clone.style.visibility = "hidden";

  document.getElementById("previewWrapper").appendChild(clone);

  const msgBox = clone.querySelector(".message");
  const toBox = clone.querySelector(".previewTo");
  const fromBox = clone.querySelector(".previewFrom");

  toBox.style.fontSize = 19 + "px";

  toBox.innerText = to || "Someone";
  fromBox.innerText = from || "Unknown";

let fontSize = 42;
const MIN_FONT = 16;

let visibleText = text;

// ✅ RESET EVERYTHING FIRST (IMPORTANT)
msgBox.innerText = visibleText;
msgBox.style.fontSize = fontSize + "px";

let lineHeight = 1.8;
msgBox.style.lineHeight = lineHeight;

// ✅ FORCE CENTERING (React sometimes messes this)
msgBox.style.display = "flex";
msgBox.style.alignItems = "center";
msgBox.style.justifyContent = "center";
msgBox.style.textAlign = "center";

// Step 1: shrink font + spacing together
while (msgBox.scrollHeight > msgBox.clientHeight && fontSize > MIN_FONT) {
  fontSize--;
  msgBox.style.fontSize = fontSize + "px";

  lineHeight -= 0.015;
  if (lineHeight < 1.1) lineHeight = 1.1;

  msgBox.style.lineHeight = lineHeight;
}


// Step 2: cut text if still overflowing
// Step 2: cut text for next page
let lastGoodText = visibleText;

while (msgBox.scrollHeight > msgBox.clientHeight && visibleText.length > 0) {
  lastGoodText = visibleText;
  visibleText = visibleText.slice(0, -1);
  msgBox.innerText = visibleText;
}

// fallback (IMPORTANT)
if (visibleText.length === 0 && lastGoodText.length > 0) {
  visibleText = lastGoodText;
}

  clone.style.visibility = "visible";

  return {
    usedLength: visibleText.length
  };
}

function trimToWord(text) {
  const trimmed = text.trimEnd();
  const lastSpace = trimmed.lastIndexOf(" ");

  if (lastSpace === -1) return trimmed;

  return trimmed.slice(0, lastSpace).trimEnd();
}