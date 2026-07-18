import { Router } from "express";
import Confession from "../models/confession.model.js";
import { generateImages } from "../utils/generateImages.js";
import { uploadImage } from "../utils/uploadTOFirebase.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-errors.js";
import{ postConfessionToInstagram } from "../utils/postConfessionToInstagram.js";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { sendAdminNotification } from
"../utils/sendAdminNotification.js";
import User from "../models/user.model.js";
import AnonymousProfile from "../models/anonymousProfile.model.js";
const router = Router();

// CREATE CONFESSION
router.post("/", verifyToken, async (req, res) => {
  try {
    const { recipientUsername, message } = req.body;;//basic take input from browser
    console.log(req.body);
     // 🔥 generate image
   
    // 🔴 BASIC VALIDATION
    if (typeof message !== "string" || message.trim() === "")
   {
      throw new ApiError(400, "Message is required");
    }
    const sender = await User.findById(req.user.id);
    console.log("JWT User ID:", req.user.id);
console.log("Sender:", sender);

if (!sender) {
  throw new ApiError(404, "User not found");
}

const senderAnonymous = await AnonymousProfile.findOne({
  userId: sender._id,
});
console.log("Anonymous Profile:", senderAnonymous);
if (!senderAnonymous) {
  throw new ApiError(400, "Complete onboarding first.");
}

const recipient = await User.findOne({
  instagramUsername: recipientUsername.toLowerCase(),
});

if (!recipient) {
  throw new ApiError(404, "Instagram user not found.");
}

if (recipient._id.equals(sender._id)) {
  throw new ApiError(400, "You can't confess to yourself.");
}
    // 1. generate image locally
    // 🔴 NEVER TRUST FRONTEND imageUrl so creat from backend
    //Hey backend, create image using this data 
const imagePaths = await generateImages({
  to: recipient.instagramUsername,
  from: senderAnonymous.anonymousName,
  message,
});

  // 2. upload to firebase
    //const imageUrl = await uploadImage(imagePath, to);
    const imageUrls = [];

    for (const imagePath of imagePaths) {

      const imageUrl =
        await uploadImage(imagePath);

      imageUrls.push(imageUrl);
       console.log("Uploaded:", imageUrl);
    }

  // 3. save in DB
const confession = await Confession.create({
  senderUser: sender._id,
  senderAnonymousProfile: senderAnonymous._id,
  senderAnonymousName: senderAnonymous.anonymousName,
  recipientUser: recipient._id,
  recipientInstagramUsername: recipient.instagramUsername,
  message,
  imageUrls,
});
  await sendAdminNotification({
  title: "New confession request",
  body: `${confession.recipientInstagramUsername} received a confession`
});

    // SUCCESS RESPONSE
    return res.status(201).json(
      new ApiResponse(
        201,
        confession,
        "Confession created successfully"
      )
    );

  } catch (error) {
    console.error(error.stack);
    if (error instanceof ApiError) {
      
      return res.status(error.statuscode).json(error);
    }

    // UNKNOWN ERROR
    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        error.message || "Something went wrong"
      )
    );
  }
});



//GET PENDING CONFESSIONS
router.get("/pending",verifyAdmin, async (req, res) => {

  try {

    const confessions =
      await Confession.find({
        status: "pending"
      }).sort({
        createdAt: -1
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        confessions,
        "Pending confessions fetched"
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


//APPROVE CONFESSION
router.patch("/:id/approve", verifyAdmin, async (req, res) => {

  try {

    const { id } = req.params;

    const { caption } = req.body;

    const confession =
      await Confession.findByIdAndUpdate(

        id,

        {
          status: "approved",
          approvedAt: new Date(),

          caption:
            caption ||
            "Here is our next confession 👀"
        },

        {
  returnDocument: "after"
}
      );

      try {
  const postedConfession =
    await postConfessionToInstagram(confession);

  return res.status(200).json(
    new ApiResponse(
      200,
      postedConfession,
      "Confession approved and posted"
    )
  );

} catch (error) {
  confession.status = "approved";
  confession.postError = error.message;
  await confession.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      confession,
      "Confession approved but Instagram post failed"
    )
  );
}

  } catch (error) {
    console.log("APPROVE ERROR:", error);
    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        error.message
      )
    );
  }

});

//REJECT CONFESSION
router.patch("/:id/reject",verifyAdmin, async (req, res) => {

  try {

    const { id } = req.params;

    const confession =
      await Confession.findByIdAndUpdate(

        id,

        {
          status: "rejected",
          rejectedAt: new Date()
        },

        {
  returnDocument: "after"
}
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        confession,
        "Confession rejected"
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

router.patch(
  "/:id/retry-post",
  verifyAdmin,
  async (req, res) => {
    const confession =
      await Confession.findById(req.params.id);

    if (!confession) {
      throw new ApiError(404, "Confession not found");
    }

    try {
      const posted =
        await postConfessionToInstagram(confession);

      posted.postError = null;
      await posted.save();

      return res.status(200).json(
        new ApiResponse(
          200,
          posted,
          "Instagram post retried successfully"
        )
      );

    } catch (error) {
      confession.postError = error.message;
      await confession.save();

      return res.status(500).json(
        new ApiResponse(
          500,
          confession,
          "Instagram retry failed"
        )
      );
    }
  }
);

// RECENT APPROVED
router.get("/approved/recent",verifyAdmin, async (req, res) => {

  try {

    const twoDaysAgo =
      new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      );

    const confessions =
      await Confession.find({

        status: "approved",

        approvedAt: {
          $gte: twoDaysAgo
        }

      })
      .sort({ approvedAt: -1 });

    return res.status(200).json(

      new ApiResponse(
        200,
        confessions,
        "Recent approved confessions"
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

// RECENT REJECTED
router.get("/rejected/recent",verifyAdmin, async (req, res) => {

  try {

    const twoDaysAgo =
      new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      );

    const confessions =
      await Confession.find({

        status: "rejected",

        rejectedAt: {
          $gte: twoDaysAgo
        }

      })
      .sort({ rejectedAt: -1 });

    return res.status(200).json(

      new ApiResponse(
        200,
        confessions,
        "Recent rejected confessions"
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