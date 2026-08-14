import express from "express";

import {
  verifyToken,
} from "../middlewares/auth.middleware.js";

import {
  createRevealRequest,
  respondReveal,
} from "../controllers/reveal.controller.js";

const router =
  express.Router();

router.post(
  "/:conversationId/request",
  verifyToken,
  createRevealRequest
);

router.patch(
  "/:conversationId/respond",
  verifyToken,
  respondReveal
);

export default router;