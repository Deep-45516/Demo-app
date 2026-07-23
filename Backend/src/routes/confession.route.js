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
import { createPendingConfession } from "../services/pendingConfession.service.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();
router.get(
  "/search-recipient",
  verifyToken,
  async (req, res) => {
    try {
      const username = req.query.username
        ?.trim()
        .toLowerCase();

      if (!username) {
        throw new ApiError(
          400,
          "Username is required."
        );
      }

      const user = await User.findOne({
        instagramUsername: username,
      }).select("instagramUsername");

      if (!user) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              exists: false,
            },
            "User not found."
          )
        );
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            exists: true,
            username: user.instagramUsername,
          },
          "User found."
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
  }
);
// CREATE CONFESSION
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
  recipientUsername,
  message,
  allowPending = false,
} = req.body;//basic take input from browser
    console.log(req.body);
     // 🔥 generate image
   
    // 🔴 BASIC VALIDATION
    if (typeof message !== "string" || message.trim() === "")
   {
      throw new ApiError(400, "Message is required");
    }
    if (
  typeof recipientUsername !== "string" ||
  recipientUsername.trim() === ""
) {
  throw new ApiError(400, "Recipient username is required.");
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
  instagramUsername: recipientUsername.trim().toLowerCase(),
});

if (!recipient) {

  if (!allowPending) {
    throw new ApiError(
      404,
      "Recipient not found."
    );
  }

  // Generate images for the pending confession
  const imagePaths = await generateImages({
    to: recipientUsername,
    from: senderAnonymous.anonymousName,
    message,
  });

  const imageUrls = [];

  for (const imagePath of imagePaths) {
    imageUrls.push(
      await uploadImage(imagePath)
    );
  }

  const pending = await createPendingConfession({
    senderUser: sender._id,

    senderAnonymousProfile:
      senderAnonymous._id,

    senderAnonymousName:
      senderAnonymous.anonymousName,

    recipientInstagramUsername:
      recipientUsername.trim().toLowerCase(),

    message,

    imageUrls,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      pending,
      "Recipient isn't registered yet. We'll deliver your confession if they join within 7 days."
    )
  );
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

// USER INBOX - RECEIVED + SENT SUMMARIES
router.get("/inbox", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [received, sent] = await Promise.all([
      Confession.find({
        recipientUser: userId,
      })
        .select(
          "_id senderAnonymousName recipientAction deliveryStatus createdAt"
        )
        .sort({ createdAt: -1 })
        .lean(),

      Confession.find({
        senderUser: userId,
      })
        .select(
          "_id recipientInstagramUsername recipientAction deliveryStatus createdAt"
        )
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          received,
          sent,
        },
        "Inbox fetched successfully."
      )
    );
  } catch (error) {
    console.error("INBOX ERROR:", error);

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        error.message || "Unable to fetch inbox."
      )
    );
  }
});

// GET ONE CONFESSION
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id).lean();

    if (!confession) {
      throw new ApiError(404, "Confession not found.");
    }

    const userId = req.user.id;

    const isSender =
      confession.senderUser.toString() === userId;

    const isRecipient =
      confession.recipientUser?.toString() === userId;

    // SECURITY: nobody except sender/recipient can open it
    if (!isSender && !isRecipient) {
      throw new ApiError(
        403,
        "You are not allowed to view this confession."
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        confession,
        "Confession fetched successfully."
      )
    );
  } catch (error) {
    console.error("GET CONFESSION ERROR:", error);

    if (error instanceof ApiError) {
      return res.status(error.statuscode).json(error);
    }

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        error.message || "Unable to fetch confession."
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