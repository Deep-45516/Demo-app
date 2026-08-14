import {
  sendMessage,
  getMessages,
  getConversations,
} from "../services/chat.service.js";
import { notifyNewMessage } from "../services/chatNotification.service.js";

export const createMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required.",
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long.",
      });
    }
    //The controller sends three things to the service:
    const { message, conversation, remainingMessages } = await sendMessage(
      conversationId,
      req.user.id,
      text,
    );
    try {
      notifyNewMessage(conversation, message, req.user.id);
    } catch (socketError) {
      console.error("MESSAGE SOCKET NOTIFICATION ERROR:", socketError);
    }

    return res.status(201).json({
      success: true,
      data: {
        message,
        remainingMessages,
      },
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("CREATE MESSAGE ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to send message.",
    });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { cursor, limit } = req.query; //brovideed from frontend maybe

    //take message from DB which have same conversationID,that user
    //call function getmessage() from chat.service.js
    const result = await getMessages(
      conversationId,
      req.user.id,
      cursor || null,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Messages fetched successfully.",
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to load messages.",
    });
  }
};

export const getConversationList = async (req, res) => {
  try {
    const conversations = await getConversations(req.user.id);

    return res.status(200).json({
      success: true,
      data: conversations,
      message: "Conversations fetched successfully.",
    });
  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load conversations.",
    });
  }
};
