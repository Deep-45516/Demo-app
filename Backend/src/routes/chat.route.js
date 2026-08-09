import express from "express";

import { verifyToken } from "../middlewares/auth.middleware.js";

import {
  createMessage,
} from "../controllers/chat.controller.js";

const router =
  express.Router();

router.post(
  "/:conversationId/messages",
  verifyToken,
  createMessage
);

export default router;