import Confession from "../models/confession.model.js";
import { postConfessionToInstagram } from "../utils/postConfessionToInstagram.js";

export async function publishConfessionPublicly(
  confessionId,
  userId
) {
  const confession =
    await Confession.findOne({
      _id: confessionId,
      recipientUser: userId,
    });

  if (!confession) {
    const error = new Error(
      "You are not allowed to publish this confession."
    );

    error.statusCode = 403;

    throw error;
  }

  // Sender must have agreed first.
  if (!confession.publicConsent) {
    const error = new Error(
      "The sender has not agreed to public sharing."
    );

    error.statusCode = 403;

    throw error;
  }

  // Prevent duplicate Instagram posts.
  if (confession.publicPosted) {
    const error = new Error(
      "This confession has already been shared publicly."
    );

    error.statusCode = 400;

    throw error;
  }

  // Reuse the existing Instagram posting system.
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