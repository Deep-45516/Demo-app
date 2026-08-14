import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { moderateMessage } from "./moderation.service.js";
import { CHAT_MAX_MESSAGES } from "../rules/chatBox.rule.js";

/*
  Sends a new chat message.

  Socket.IO is NOT involved here.
  This is the core database operation.
*/
export async function sendMessage(conversationId, userId, text) {
  // Make sure the user belongs to this conversation.make this 3 checks,to find that right conversation from DB to send message
  const conversation = await Conversation.findOne({
    _id: conversationId, //match the conversationID
    status: "active", //active convo only get new messges
    $or: [{ senderUser: userId }, { recipientUser: userId }], //the user who made this req should either of these 2
  });

  if (!conversation) {
    const error = new Error("Conversation not found or access denied.");

    error.statusCode = 403;

    throw error;
  }

  // Check message content before saving it.moderation.service.js
  const moderation = moderateMessage(text);

  if (!moderation.allowed) {
    const error = new Error(moderation.reason);

    error.statusCode = 400;

    throw error;
  }

  const messageCount = await Message.countDocuments({
    conversationId: conversation._id,
  });

  if (messageCount >= CHAT_MAX_MESSAGES) {
    const error = new Error("This conversation has reached its message limit.");

    error.statusCode = 400;

    throw error;
  }

  const remainingMessages = CHAT_MAX_MESSAGES - messageCount;

  // Save the message first, mongoDB gets new message Document
  const message = await Message.create({
    conversationId: conversation._id,

    senderUser: userId,

    text: text.trim(),
  });

  // Update conversation mongoDB Conversation.
  conversation.lastMessageAt = message.createdAt; //lastMessage used to check recent conversation ,use in inbox

  await conversation.save(); //MongoDB updates the Conversation.

  return {
    message,
    conversation,
    remainingMessages: remainingMessages - 1,
  };
}

/*
  Gets messages belonging to a conversation.

  Cursor pagination is used instead of page numbers.

  First request:
    get latest messages

  Next request:
    send the cursor returned by the
    previous request and get older messages.
*/
export async function getMessages(
  conversationId,
  userId,
  cursor = null,
  limit = 20,
) {
  // ----------------------------------
  // 1. Verify conversation access
  // ----------------------------------
  //here no need to check satus of conversation : active
  const conversation = await Conversation.findOne({
    _id: conversationId,
    $or: [{ senderUser: userId }, { recipientUser: userId }],
  }).lean();
  //lean means Give me a plain JavaScript object instead of a full Mongoose document , we only need ConversationId
  if (!conversation) {
    const error = new Error("Conversation not found or access denied.");

    error.statusCode = 403;

    throw error;
  }

  // ----------------------------------
  // 2. Keep limit under our control
  // ----------------------------------

  limit = Number(limit) || 20;

  // Never allow a client to request
  // thousands of messages at once.
  limit = Math.min(Math.max(limit, 1), 50);

  // ----------------------------------
  // 3. Build MongoDB query
  // ----------------------------------

  const query = {
    conversationId: conversation._id,
  };

  /*
    If there is a cursor, decode it.
    Cursor contains:
    {
      createdAt,
      id
    }
    This lets us say:
    "Give me messages older than THIS
     exact message."
     Suppose two messages have exactly the same
     so newest created AT is not enough,so we check newest _id first
  */
  if (cursor) {
    let decodedCursor;

    try {
      decodedCursor = JSON.parse(
        Buffer.from(cursor, "base64url").toString("utf8"),
      );
    } catch {
      const error = new Error("Invalid pagination cursor.");

      error.statusCode = 400;

      throw error;
    }

    const cursorDate = new Date(decodedCursor.createdAt);

    if (!decodedCursor.id || Number.isNaN(cursorDate.getTime())) {
      const error = new Error("Invalid pagination cursor.");

      error.statusCode = 400;

      throw error;
    }

    /*
      Messages are sorted:

      createdAt DESC
      _id DESC

      So we ask MongoDB for messages
      older than the cursor.

      _id is used as a tie-breaker when
      two messages have the same timestamp.
    */

    //for getting older messages
    query.$or = [
      {
        createdAt: {
          $lt: cursorDate,
        },
      },
      {
        createdAt: cursorDate,
        _id: {
          $lt: decodedCursor.id,
        },
      },
    ];
  }

  // ----------------------------------
  // 4. Get one extra message
  // ----------------------------------

  /*
    If user asks for 20 messages,
    we fetch 21.

    Why?

    If we receive 21:

      first 20 → send to frontend
      21st      → proves more exist

    Therefore:

      hasMore = true
  */

  const messages = await Message.find(query)
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;

  // Remove the extra message.
  if (hasMore) {
    messages.pop();
  }

  /*
    Database gives newest → oldest:

      20
      19
      18
      ...

    Chat UI normally wants:

      1
      2
      3
      ...

    So reverse before sending.
  */
  messages.reverse();

  // ----------------------------------
  // 5. Create next cursor
  // ----------------------------------

  let nextCursor = null;

  if (hasMore && messages.length > 0) {
    const oldestMessage = messages[0];

    nextCursor = Buffer.from(
      JSON.stringify({
        createdAt: oldestMessage.createdAt,
        id: oldestMessage._id,
      }),
    ).toString("base64url");
  }

  const totalMessages =
  await Message.countDocuments({
    conversationId: conversation._id,
  });

const remainingMessages = Math.max(
  CHAT_MAX_MESSAGES - totalMessages,
  0
);

return {
  messages,
  nextCursor,
  hasMore,
  remainingMessages,
};
}
//we used MongoDB Aggregation here
export async function getConversations(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const conversations = await Conversation.aggregate([
    // ----------------------------------
    // 1. Only this user's conversations
    // ----------------------------------
    {
      $match: {
        status: "active",
        $or: [{ senderUser: userObjectId }, { recipientUser: userObjectId }],
      },
    },

    // ----------------------------------
    // 2. Newest conversation first
    // ----------------------------------
    {
      $sort: {
        lastMessageAt: -1,
        _id: -1,
      },
    },

    // ----------------------------------
    // 3. Get original confession
    // ----------------------------------
    {
      $lookup: {
        from: "confessions",
        localField: "confessionId",
        foreignField: "_id",
        as: "confession",
      },
    },
    //means the conversation won't automatically disappear if the confession is missing.
    {
      $unwind: {
        path: "$confession",
        preserveNullAndEmptyArrays: true,
      },
    },

    // ----------------------------------
    // 4. Get latest message
    // ----------------------------------
    {
      $lookup: {
        from: "messages",
        let: {
          conversationId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$conversationId", "$$conversationId"],
              },
            },
          },
          {
            $sort: {
              createdAt: -1,
              _id: -1,
            },
          },
          {
            $limit: 1,
          },
        ],
        as: "lastMessage",
      },
    },

    // ----------------------------------
    // 5. Convert array to object/null
    // ----------------------------------
    {
      $set: {
        lastMessage: {
          $cond: [
            {
              $gt: [{ $size: "$lastMessage" }, 0],
            },
            {
              $arrayElemAt: ["$lastMessage", 0],
            },
            null,
          ],
        },
      },
    },

    // ----------------------------------
    // 6. Decide what identity THIS USER
    //    is allowed to see.
    // ----------------------------------
    {
      $project: {
        _id: 1,
        confessionId: 1,
        status: 1,
        lastMessageAt: 1,

        lastMessage: {
          $cond: [
            { $ne: ["$lastMessage", null] },
            {
              _id: "$lastMessage._id",
              text: "$lastMessage.text",
              senderUser: "$lastMessage.senderUser",
              createdAt: "$lastMessage.createdAt",
            },
            null,
          ],
        },

        /*
            If current user is the SENDER:
              show recipient's Instagram username.

            If current user is the RECIPIENT:
              show sender's anonymous name.

            We NEVER expose the sender's real
            Instagram identity here.
          */
        displayName: {
          $cond: [
            {
              $eq: ["$senderUser", userObjectId],
            },
            {
              $concat: ["@", "$confession.recipientInstagramUsername"],
            },
            "$confession.senderAnonymousName",
          ],
        },

        displayType: {
          $cond: [
            {
              $eq: ["$senderUser", userObjectId],
            },
            "instagram",
            "anonymous",
          ],
        },
      },
    },
  ]);

  return conversations;
}
