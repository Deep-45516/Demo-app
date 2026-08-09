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
router.get(
  "/conversations",
  verifyToken,
  getConversationList
);


// Send a message
router.post(
  "/:conversationId/messages",
  verifyToken,
  createMessage
);


// Get messages
router.get(
  "/:conversationId/messages",
  verifyToken,
  getConversationMessages
);



export default router;