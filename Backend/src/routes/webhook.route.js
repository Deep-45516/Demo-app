import { Router } from "express";
import {
  verifyWebhook,
  receiveWebhook,
} from "../controllers/webhook.controller.js";
import verifyMetaSignature from "../middlewares/verifyMetaSignature.js";


const router = Router();

// Meta webhook verification
router.get("/", verifyWebhook);

// Receive Instagram events
router.post(
  "/",
  receiveWebhook
);

export default router;