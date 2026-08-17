import Confession from "../models/confession.model.js";
import Conversation from "../models/conversation.model.js";
import { postConfessionToInstagram } from "../utils/postConfessionToInstagram.js";

export async function publishConfessionPublicly(
  id,
  userId
) {
  // ----------------------------------
  // 1. Try direct confession ID
  // ----------------------------------

  let confession =
    await Confession.findOne({
      _id: id,
      recipientUser: userId,
    });

  // ----------------------------------
  // 2. If not found, treat id as
  //    conversationId
  // ----------------------------------

  if (!confession) {
    const conversation =
      await Conversation.findOne({
        _id: id,
        recipientUser: userId,
      }).lean();

    if (conversation) {
      confession =
        await Confession.findOne({
          _id: conversation.confessionId,
          recipientUser: userId,
        });
    }
  }

  // ----------------------------------
  // 3. Verify access
  // ----------------------------------

  if (!confession) {
    const error = new Error(
      "You are not allowed to publish this confession."
    );

    error.statusCode = 403;

    throw error;
  }

  // ----------------------------------
  // 4. Sender must have agreed
  // ----------------------------------

  if (!confession.publicConsent) {
    const error = new Error(
      "The sender has not agreed to public sharing."
    );

    error.statusCode = 403;

    throw error;
  }

  // ----------------------------------
  // 5. Prevent duplicate posting
  // ----------------------------------

  if (confession.publicPosted) {
    const error = new Error(
      "This confession has already been shared publicly."
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------
  // 6. Post to Instagram
  // ----------------------------------

  const posted =
    await postConfessionToInstagram(
      confession
    );

  posted.visibility = "public";
  posted.publicPosted = true;
  posted.publicPostedAt = new Date();
  posted.publicPostedBy = userId;

  await posted.save();

  return posted;
}