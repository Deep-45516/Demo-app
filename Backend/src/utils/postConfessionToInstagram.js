import {
  createInstagramMedia,
  createCarouselItem,
  createCarouselContainer,
  publishInstagramMedia
} from "./instagram.js";

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const postConfessionToInstagram = async (confession) => {
  const imageUrls = confession.imageUrls || [];

  if (imageUrls.length === 0) {
    throw new Error("No images found");
  }

  const caption =
    confession.caption ||
    "Here is our next confession 👀";

  let published;

  // SINGLE IMAGE
  if (imageUrls.length === 1) {
    const media = await createInstagramMedia({
      imageUrl: imageUrls[0],
      caption
    });

    if (!media.id) {
      throw new Error(
        JSON.stringify(media)
      );
    }

    await delay(10000);

    published =
      await publishInstagramMedia(media.id);
  }

  // CAROUSEL
  else {
    const children = [];

    for (const imageUrl of imageUrls) {
      const item =
        await createCarouselItem(imageUrl);

      if (!item.id) {
        throw new Error(
          JSON.stringify(item)
        );
      }

      children.push(item.id);
    }

    const carousel =
      await createCarouselContainer({
        children,
        caption
      });

    if (!carousel.id) {
      throw new Error(
        JSON.stringify(carousel)
      );
    }

    await delay(10000);

    published =
      await publishInstagramMedia(carousel.id);
  }

  if (!published.id) {
    throw new Error(
      JSON.stringify(published)
    );
  }

  confession.status = "posted";
  confession.postedAt = new Date();
  confession.instagramPostId = published.id;

  await confession.save();

  return confession;
};