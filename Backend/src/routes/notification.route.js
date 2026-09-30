import { Router } from "express";
import AdminNotificationToken from
"../models/adminNotificationToken.model.js";
import { verifyAdmin } from
"../middlewares/auth.middleware.js";
import { ApiResponse } from
"../utils/api-response.js";

const router = Router();

router.post(
  "/admin-token",
  verifyAdmin,
  async (req, res) => {
    const { token } = req.body;

    await AdminNotificationToken.updateOne(
      { token },
      { token },
      { upsert: true }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Notification token saved"
      )
    );
  }
);

import UserNotificationToken from "../models/userNotificationToken.model.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

router.post("/user-token", verifyToken, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false });
  await UserNotificationToken.updateOne(
    { token },
    { user: req.user.id, token },
    { upsert: true }
  );
  res.status(200).json({ success: true });
});

router.delete("/user-token", verifyToken, async (req, res) => {
  await UserNotificationToken.deleteOne({ token: req.body.token, user: req.user.id });
  res.status(200).json({ success: true });
});

export default router;