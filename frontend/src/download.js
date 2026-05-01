import html2canvas from "html2canvas";

export async function downloadPages() {
  const pages = document.querySelectorAll(".template");

  let index = 1;

  for (const page of pages) {
    const canvas = await html2canvas(page, { scale: 2 });

    const link = document.createElement("a");
    link.download = `confession-${index}.png`;
    link.href = canvas.toDataURL();
    link.click();

    index++;
  }
}
