import { Router } from "express";
import Confession from "../models/confession.model.js";
import { ApiResponse } from "../utils/api-response.js";
import {
  createInstagramMedia,
  createCarouselItem,
  createCarouselContainer,
  publishInstagramMedia
} from "../utils/instagram.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/post/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const confession =
      await Confession.findById(id);

    if (!confession) {
      return res.status(404).json(
        new ApiResponse(
          404,
          null,
          "Confession not found"
        )
      );
    }

    const imageUrls =
      confession.imageUrls || [];

    if (imageUrls.length === 0) {

      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "No images found"
        )
      );
    }

    const caption =
      confession.caption ||
      "Here is our next confession 👀";

    let published;

    // SINGLE IMAGE
    if (imageUrls.length === 1) {

      const media =
        await createInstagramMedia({
          imageUrl: imageUrls[0],
          caption
        });

      if (!media.id) {

        return res.status(500).json(
          new ApiResponse(
            500,
            media,
            "Instagram media creation failed"
          )
        );
      }

      await new Promise((resolve) =>
  setTimeout(resolve, 10000)
);

published =
  await publishInstagramMedia(
    media.id
  );
    }

    // CAROUSEL
    else {

      const children = [];

      for (const imageUrl of imageUrls) {

        const item =
          await createCarouselItem(
            imageUrl
          );

        if (!item.id) {

          return res.status(500).json(
            new ApiResponse(
              500,
              item,
              "Carousel item failed"
            )
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

        return res.status(500).json(
          new ApiResponse(
            500,
            carousel,
            "Carousel container failed"
          )
        );
      }

      await new Promise((resolve) =>
  setTimeout(resolve, 10000)
);

published =
  await publishInstagramMedia(
    carousel.id
  );
    }

    if (!published.id) {

      return res.status(500).json(
        new ApiResponse(
          500,
          published,
          "Instagram publish failed"
        )
      );
    }

    confession.status = "posted";

    confession.postedAt =
      new Date();

    confession.instagramPostId =
      published.id;

    await confession.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        confession,
        "Posted to Instagram successfully"
      )
    );

  } catch (error) {

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        error.message
      )
    );
  }
});

export default router;