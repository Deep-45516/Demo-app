import { Router } from "express";
import Confession from "../models/confession.model.js";
import { generateImages } from "../utils/generateImages.js";
import { uploadImage } from "../utils/uploadTOFirebase.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-errors.js";
import { postConfessionToInstagram } from "../utils/postConfessionToInstagram.js";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { sendAdminNotification } from "../utils/sendAdminNotification.js";
import User from "../models/user.model.js";
import AnonymousProfile from "../models/anonymousProfile.model.js";
import { createPendingConfession } from "../services/pendingConfession.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getIO } from "../socket/socket.js";
import {
  notifyNewConfession,
  notifyConfessionUpdated,
} from "../socket/socketNotifier.js";
import Conversation from "../models/conversation.model.js";
import {
  publishConfessionPublicly,
} from "../services/publicPost.service.js";

import {
  notifyPublicPostUpdated,
} from "../socket/publicPost.socket.js";

/*verifytoken is middleware act as a seccurity guard which checks for valid jwt and if succed then countinue by next(), middleware runs before function execute */
const router = Router();
router.get("/search-recipient", verifyToken, async (req, res) => {
  try {
    //frontend send query in api ?username=Deep_123 comes , take that from req.query.username
    const username = req.query.username?.trim().toLowerCase();
    //Never depend on frontend validation for security/correctness.
    if (!username) {
      throw new ApiError(400, "Username is required.");
    }
    //MongoDB, find ONE User document whose instagramUsername equals this username.
    const user = await User.findOne({
      instagramUsername: username,
    }).select("instagramUsername");
    //select says Only retrieve the field I need.
    //Without .select(), MongoDB/Mongoose may return whole user document
    if (!user) {
      return res.status(200).json(
        new ApiResponse(
          200, //not 404, becuz API req work perfectly,search result is false(200 is success)
          {
            exists: false,
          },
          "User not found.",
        ),
      );
    }
    /*Remember:
findOne()
returns null when nothing is found. in frontend */

    return res.status(200).json(
      new ApiResponse(
        200, //sucess
        {
          //data
          exists: true,
          username: user.instagramUsername,
        },
        "User found.", //message
      ), //standerd formate
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});
// CREATE CONFESSION
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
  recipientUsername,
  to,
  message,
  from,
  allowPending = false,
  publicConsent = false,
  theme = "signal",
} = req.body; //basic take input from browser
    console.log(req.body);

    const allowedThemes = [
  "signal",
  "love",
  "funny",
];

if (!allowedThemes.includes(theme)) {
  throw new ApiError(
    400,
    "Invalid confession theme."
  );
}
    // 🔥 generate image

    // 🔴 BASIC VALIDATION
    if (typeof message !== "string" || message.trim() === "") {
      throw new ApiError(400, "Message is required");
    }
    if (
      typeof recipientUsername !== "string" ||
      recipientUsername.trim() === ""
    ) {
      throw new ApiError(400, "Recipient username is required.");

      if (
  typeof to !== "string" ||
  to.trim() === ""
) {
  throw new ApiError(
    400,
    "To name is required."
  );
}
if (
  typeof from !== "string" ||
  from.trim() === ""
) {
  throw new ApiError(
    400,
    "From hint is required."
  );
}
    }
    //find sender
    const sender = await User.findById(req.user.id);
    console.log("JWT User ID:", req.user.id);
    console.log("Sender:", sender);

    if (!sender) {
      throw new ApiError(404, "User not found");
    }
    //find sendes anonymous identity
    const senderAnonymous = await AnonymousProfile.findOne({
      userId: sender._id,
    });
    console.log("Anonymous Profile:", senderAnonymous);
    if (!senderAnonymous) {
      throw new ApiError(400, "Complete onboarding first.");
    }
    //find recipent in DB by instaUsername sended by sender
    const recipient = await User.findOne({
      instagramUsername: recipientUsername.trim().toLowerCase(),
    });
    /*Recipient doesn't exist
        ↓
Did sender click "Send Anyway"?
        ↓
 allowPending?
    ↙         ↘
 false       true
   ↓           ↓
STOP       create pending */
    if (!recipient) {
      //allow pending get true if user clicks on "send anyway"
      if (!allowPending) {
        throw new ApiError(404, "Recipient not found.");
      }

      // Generate images for the pending confession
      const imagePaths = await generateImages({
        to,
        from,
        message,
        theme,
      }); /*[
  "/temp/page1.jpg",
  "/temp/page2.jpg"
] */
  const imageUrls = await Promise.all(
  imagePaths.map((imagePath) => uploadImage(imagePath))
); /*finally imageUrls = [
   "https://firebase...page1.jpg",
   "https://firebase...page2.jpg"
]; */
      //this are currently sequential like 1st then 2nd page
      //pendingConfession.service.js, beuz we do not have pending user doc
      const pending = await createPendingConfession({
        //create DB doc for 7 days
        senderUser: sender._id,

        senderAnonymousProfile: senderAnonymous._id,

        senderAnonymousName: senderAnonymous.anonymousName,

        recipientInstagramUsername: recipientUsername.trim().toLowerCase(),

        message,
        imageUrls,

        publicConsent:
    publicConsent === true,
    theme,
      });

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            pending,
            "Recipient isn't registered yet. We'll deliver your confession if they join within 7 days.",
          ),
        );
    }

    if (recipient._id.equals(sender._id)) {
      throw new ApiError(400, "You can't confess to yourself.");
    }
    /*Sender exists ✅
AnonymousProfile exists ✅
Recipient exists ✅
Not sending to yourself ✅*/
    // 1. generate image locally
    // 🔴 NEVER TRUST FRONTEND imageUrl so creat from backend
    //Hey backend, create image using this data
    //create confession with sender anonomous and for recipent real insta id
    const imagePaths = await generateImages({
      to,
      from,
      message,
      theme,
    }); /*[
  "/temp/page1.jpg",
  "/temp/page2.jpg"
] */

    // 2. upload to firebase
    //const imageUrl = await uploadImage(imagePath, to);
    const imageUrls = [];

    for (const imagePath of imagePaths) {
      const imageUrl = await uploadImage(imagePath);

      imageUrls.push(imageUrl);
      console.log("Uploaded:", imageUrl);
    } /*finally imageUrls = [
   "https://firebase...page1.jpg",
   "https://firebase...page2.jpg"
]; */
    //this are currently sequential like 1st then 2nd page

    // 3. save in DB
const confession = await Confession.create({
  senderUser: sender._id,
  senderAnonymousProfile: senderAnonymous._id,
  senderAnonymousName: senderAnonymous.anonymousName,

  recipientUser: recipient._id,
  recipientInstagramUsername: recipient.instagramUsername,

  message,
  imageUrls,

  publicConsent:
    publicConsent === true,

    theme,
});

    notifyNewConfession(recipient._id, confession);
    notifyNewConfession(confession.senderUser, confession);
    console.log(`Emitted new-confession to room user:${recipient._id}`);
// =========================
// ADMIN NOTIFICATION
// Disabled for V1.
// Keep this for future admin moderation.
// =========================

// await sendAdminNotification({
//   title: "New confession request",
//   body: `${confession.recipientInstagramUsername} received a confession`,
// });

    // SUCCESS RESPONSE
    return res
      .status(201)
      .json(
        new ApiResponse(201, confession, "Confession created successfully"),
      );
  } catch (error) {
    console.error(error.stack);
    if (error instanceof ApiError) {
      return res.status(error.statuscode).json(error);
    }

    // UNKNOWN ERROR
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Something went wrong"),
      );
  }
});

//GET PENDING CONFESSIONS
router.get("/pending", verifyAdmin, async (req, res) => {
  try {
    const confessions = await Confession.find({
      status: "pending",
    }).sort({
      createdAt: -1,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, confessions, "Pending confessions fetched"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// USER INBOX - RECEIVED + SENT SUMMARIES
//inbox page only displays a summary,not confession
router.get("/inbox", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    /*Confession 1
senderUser = BBB
recipientUser = AAA   ✅


Confession 2
senderUser = AAA
recipientUser = CCC   ❌


Confession 3
senderUser = DDD
recipientUser = AAA   ✅ */
    const [received, sent] = await Promise.all([
      //promise run both query parellaly and give result , not wait 1 to complete and then next NO
      Confession.find({
        recipientUser: userId, //this is recieved confessionss
      }) //this finds the confession which has recipientUser as that user and shows senderanonymous name
        .select(
          "_id senderAnonymousName recipientAction deliveryStatus createdAt", //do not show entire confession yet
        )
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      Confession.find({
        //this is sent confessions
        senderUser: userId,
      })
        .select(
          "_id recipientInstagramUsername recipientAction deliveryStatus createdAt",
        )
        .sort({ createdAt: -1 }) //Means sort by creation date,(-1 means decending order,new 1st)
        .limit(50)
        .lean(),
    ]);
    /*Need to modify/save Mongoose document?
→ normal document may be useful

Just reading/displaying data?
→ .lean() can be useful */

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          received,
          sent,
        },
        "Inbox fetched successfully.",
      ),
    );
  } catch (error) {
    console.error("INBOX ERROR:", error);

    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Unable to fetch inbox."),
      );
  }
});
// RECIPIENT RESPONDS TO CONFESSION
router.patch("/:id/action", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    // Only these two responses are allowed.
    if (!["curious", "not_interested"].includes(action)) {
      throw new ApiError(400, "Invalid confession action.");
    }
    console.log("ACTION DEBUG:", {
      confessionId: id,
      loggedInUser: req.user.id,
      action,
    });
    // Only the actual recipient of this confession
    // is allowed to respond to it.
    const confession = await Confession.findOneAndUpdate(
      {
        _id: id,
        recipientUser: req.user.id,
        recipientAction: "pending",
      },
      {
        recipientAction: action,
      },
      {
        returnDocument: "after",
      },
    );

    if (!confession) {
      throw new ApiError(
        403,
        "You are not allowed to update this confession, or you have already responded.",
      );
    }

    // A conversation is created only when the recipient
    // chooses "curious".
    let conversationId = null;

    if (action === "curious") {
      const conversation = await Conversation.findOneAndUpdate(
        {
          confessionId: confession._id,
        },
        {
          $setOnInsert: {
            confessionId: confession._id,
            senderUser: confession.senderUser,
            recipientUser: confession.recipientUser,
            status: "active",
          },
        },
        {
          upsert: true,
          new: true,
        },
      );

      conversationId = conversation._id;

      notifyConfessionUpdated(
        confession.senderUser,
        confession._id,
        confession.recipientAction,
        conversationId,
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...confession.toObject(),
          conversationId,
        },
        `Confession marked as ${action}.`,
      ),
    );
  } catch (error) {
    console.error("CONFESSION ACTION ERROR:", error);

    if (error instanceof ApiError) {
      return res.status(error.statuscode).json(error);
    }

    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Something went wrong."),
      );
  }
});

// RECIPIENT CHOOSES TO MAKE CONFESSION PUBLIC
router.post("/:id/public", verifyToken, async (req, res) => {
  try {
    const confession =
      await publishConfessionPublicly(
        req.params.id,
        req.user.id
      );

    const notification = {
      confessionId: confession._id,
      status: "public",
      instagramPostId:
        confession.instagramPostId,
      publicPostedAt:
        confession.publicPostedAt,
    };

    // Notify sender.
    notifyPublicPostUpdated(
      confession.senderUser,
      notification
    );

    // Notify recipient too.
    notifyPublicPostUpdated(
      confession.recipientUser,
      notification
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        confession,
        "Confession shared publicly."
      )
    );
  } catch (error) {
    console.error(
      "PUBLIC CONFESSION ERROR:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json(
      new ApiResponse(
        error.statusCode || 500,
        null,
        error.message ||
          "Unable to share confession publicly."
      )
    );
  }
});

// MARK CONFESSION AS READ
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const confession = await Confession.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientUser: req.user.id,
        readAt: null,
      },
      {
        readAt: new Date(),
      },
      {
        new: true,
      }
    );

    if (!confession) {
      return res.status(200).json(
        new ApiResponse(
          200,
          null,
          "Confession already read or not found."
        )
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        confession,
        "Confession marked as read."
      )
    );
  } catch (error) {
    console.error("MARK CONFESSION READ ERROR:", error);

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        error.message || "Unable to mark confession as read."
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

    const isSender = confession.senderUser.toString() === userId;

    const isRecipient = confession.recipientUser?.toString() === userId;

    // SECURITY: nobody except sender/recipient can open it
    if (!isSender && !isRecipient) {
      throw new ApiError(403, "You are not allowed to view this confession.");
    }
    const conversation = await Conversation.findOne({
      confessionId: confession._id,
      status: "active",
      $or: [
        {
          senderUser: confession.senderUser,
          recipientUser: confession.recipientUser,
        },
        {
          senderUser: confession.recipientUser,
          recipientUser: confession.senderUser,
        },
      ],
    })
      .select("_id")
      .lean();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...confession,
          conversationId: conversation?._id || null,
        },
        "Confession fetched successfully.",
      ),
    );
  } catch (error) {
    console.error("GET CONFESSION ERROR:", error);

    if (error instanceof ApiError) {
      return res.status(error.statuscode).json(error);
    }

    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Unable to fetch confession.",
        ),
      );
  }
});
//APPROVE CONFESSION
router.patch("/:id/approve", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { caption } = req.body;

    const confession = await Confession.findByIdAndUpdate(
      id,

      {
        status: "approved",
        approvedAt: new Date(),

        caption: caption || "Here is our next confession 👀",
      },

      {
        returnDocument: "after",
      },
    );

    try {
      const postedConfession = await postConfessionToInstagram(confession);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            postedConfession,
            "Confession approved and posted",
          ),
        );
    } catch (error) {
      confession.status = "approved";
      confession.postError = error.message;
      await confession.save();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            confession,
            "Confession approved but Instagram post failed",
          ),
        );
    }
  } catch (error) {
    console.log("APPROVE ERROR:", error);
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

//REJECT CONFESSION
router.patch("/:id/reject", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const confession = await Confession.findByIdAndUpdate(
      id,

      {
        status: "rejected",
        rejectedAt: new Date(),
      },

      {
        returnDocument: "after",
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, confession, "Confession rejected"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

router.patch("/:id/retry-post", verifyAdmin, async (req, res) => {
  const confession = await Confession.findById(req.params.id);

  if (!confession) {
    throw new ApiError(404, "Confession not found");
  }

  try {
    const posted = await postConfessionToInstagram(confession);

    posted.postError = null;
    await posted.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, posted, "Instagram post retried successfully"),
      );
  } catch (error) {
    confession.postError = error.message;
    await confession.save();

    return res
      .status(500)
      .json(new ApiResponse(500, confession, "Instagram retry failed"));
  }
});

// RECENT APPROVED
router.get("/approved/recent", verifyAdmin, async (req, res) => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const confessions = await Confession.find({
      status: "approved",

      approvedAt: {
        $gte: twoDaysAgo,
      },
    }).sort({ approvedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, confessions, "Recent approved confessions"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// RECENT REJECTED
router.get("/rejected/recent", verifyAdmin, async (req, res) => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const confessions = await Confession.find({
      status: "rejected",

      rejectedAt: {
        $gte: twoDaysAgo,
      },
    }).sort({ rejectedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, confessions, "Recent rejected confessions"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

export default router;
