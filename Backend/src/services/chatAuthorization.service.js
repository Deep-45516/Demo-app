import Confession from "../models/confession.model.js";
import { ApiError } from "../utils/api-errors.js";

export async function authorizeChatUser(
  confessionId,
  userId
) {
  const confession = await Confession.findById(
    confessionId
  ).select(
    "_id senderUser recipientUser recipientAction"
  );

  if (!confession) {
    throw new ApiError(
      404,
      "Confession not found."
    );
  }

  const isSender =
    confession.senderUser.toString() ===
    userId.toString();

  const isRecipient =
    confession.recipientUser.toString() ===
    userId.toString();

  if (!isSender && !isRecipient) {
    throw new ApiError(
      403,
      "You are not allowed to access this conversation."
    );
  }

  if (
    confession.recipientAction !== "curious"
  ) {
    throw new ApiError(
      403,
      "Chat is not unlocked for this confession."
    );
  }

  return confession;
}