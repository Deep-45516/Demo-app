import { Router } from "express";
import Confession from "../models/confession.model.js";
import { ApiResponse } from "../utils/api-response.js";
import {
  createInstagramMedia,
  publishInstagramMedia
} from "../utils/instagram.js";

const router = Router();

router.post("/post/:id", async (req, res) => {
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

    const imageUrl =
      confession.imageUrls?.[0];

    if (!imageUrl) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "No image found"
        )
      );
    }

    const caption =
      confession.caption ||
      "Here is our next confession 👀";

    const media =
      await createInstagramMedia({
        imageUrl,
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

    const published =
      await publishInstagramMedia(media.id);

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
    confession.postedAt = new Date();
    confession.instagramPostId = published.id;

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