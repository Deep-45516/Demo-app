import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { moderateMessage } from "./moderation.service.js";

/*
  Sends a new chat message.

  Socket.IO is NOT involved here.
  This is the core database operation.
*/
export async function sendMessage(
  conversationId,
  userId,
  text
) {
  // Make sure the user belongs to this conversation.
  const conversation =
    await Conversation.findOne({
      _id: conversationId,
      status: "active",
      $or: [
        { senderUser: userId },
        { recipientUser: userId },
      ],
    });

  if (!conversation) {
    const error = new Error(
      "Conversation not found or access denied."
    );

    error.statusCode = 403;

    throw error;
  }

  // Check message content before saving it.
  const moderation =
    moderateMessage(text);

  if (!moderation.allowed) {
    const error = new Error(
      moderation.reason
    );

    error.statusCode = 400;

    throw error;
  }

  // Save the message first.
  const message = await Message.create({
    conversationId:
      conversation._id,

    senderUser: userId,

    text: text.trim(),
  });

  // Update conversation metadata.
  conversation.lastMessageAt =
    message.createdAt;

  await conversation.save();

  return message;
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
  limit = 20
) {
  // ----------------------------------
  // 1. Verify conversation access
  // ----------------------------------

  const conversation =
    await Conversation.findOne({
      _id: conversationId,
      $or: [
        { senderUser: userId },
        { recipientUser: userId },
      ],
    }).lean();

  if (!conversation) {
    const error = new Error(
      "Conversation not found or access denied."
    );

    error.statusCode = 403;

    throw error;
  }


  // ----------------------------------
  // 2. Keep limit under our control
  // ----------------------------------

  limit = Number(limit) || 20;

  // Never allow a client to request
  // thousands of messages at once.
  limit = Math.min(
    Math.max(limit, 1),
    50
  );


  // ----------------------------------
  // 3. Build MongoDB query
  // ----------------------------------

  const query = {
    conversationId:
      conversation._id,
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
  */
  if (cursor) {
    let decodedCursor;

    try {
      decodedCursor =
        JSON.parse(
          Buffer.from(
            cursor,
            "base64url"
          ).toString("utf8")
        );
    } catch {
      const error = new Error(
        "Invalid pagination cursor."
      );

      error.statusCode = 400;

      throw error;
    }

    const cursorDate =
      new Date(decodedCursor.createdAt);

    if (
      !decodedCursor.id ||
      Number.isNaN(cursorDate.getTime())
    ) {
      const error = new Error(
        "Invalid pagination cursor."
      );

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

  const messages =
    await Message.find(query)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(limit + 1)
      .lean();


  const hasMore =
    messages.length > limit;


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
    const oldestMessage =
      messages[0];

    nextCursor =
      Buffer.from(
        JSON.stringify({
          createdAt:
            oldestMessage.createdAt,
          id:
            oldestMessage._id,
        })
      ).toString("base64url");
  }


  return {
    messages,
    nextCursor,
    hasMore,
  };
}

export async function getConversations(
  userId
) {
  const conversations =
    await Conversation.aggregate([
      // ----------------------------------
      // 1. Only conversations of this user
      // ----------------------------------
      {
        $match: {
          status: "active",
          $or: [
            { senderUser: userId },
            { recipientUser: userId },
          ],
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
      // 3. Get confession information
      // ----------------------------------
      {
        $lookup: {
          from: "confessions",
          localField: "confessionId",
          foreignField: "_id",
          as: "confession",
        },
      },

      {
        $unwind: {
          path: "$confession",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ----------------------------------
      // 4. Get the latest message
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
                  $eq: [
                    "$conversationId",
                    "$$conversationId",
                  ],
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

      {
        $unwind: {
          path: "$lastMessage",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ----------------------------------
      // 5. Return only what the chat list needs
      // ----------------------------------
      {
        $project: {
          _id: 1,
          confessionId: 1,
          status: 1,
          lastMessageAt: 1,

          lastMessage: {
            _id: "$lastMessage._id",
            text: "$lastMessage.text",
            senderUser: "$lastMessage.senderUser",
            createdAt: "$lastMessage.createdAt",
          },

          // Don't expose the sender's real identity.
          senderAnonymousName:
            "$confession.senderAnonymousName",

          recipientInstagramUsername:
            "$confession.recipientInstagramUsername",
        },
      },
    ]);

  return conversations;
}