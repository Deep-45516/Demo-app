export const splitMessage = (message, limit = 450) => {

  const pages = [];

  let text = message;

  while (text.length > 0) {

    let chunk = text.slice(0, limit);

    // avoid cutting words
    const lastSpace = chunk.lastIndexOf(" ");

    if (lastSpace > 0 && text.length > limit) {
      chunk = chunk.slice(0, lastSpace);
    }

    pages.push(chunk);

    text = text.slice(chunk.length).trim();
  }

  return pages;
};