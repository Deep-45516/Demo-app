import express from "express";

import {
  verifyToken,
} from "../middlewares/auth.middleware.js";

import {
  createMessage,
  getConversationMessages,
} from "../controllers/chat.controller.js";

const router =
  express.Router();


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