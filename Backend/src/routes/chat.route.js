import express from "express";

import {
  verifyToken,
} from "../middlewares/auth.middleware.js";

import {
  createMessage,
  getConversationMessages,
  getConversationList,
} from "../controllers/chat.controller.js";

const router =
  express.Router();


// Get user's conversation list
//give me my conversation
router.get(
  "/conversations",
  verifyToken,
  getConversationList
);


// Send this message to chat
router.post(
  "/:conversationId/messages",
  verifyToken,
  createMessage
);


// Give me messages from this chat
router.get(
  "/:conversationId/messages",
  verifyToken,
  getConversationMessages
);



export default router;