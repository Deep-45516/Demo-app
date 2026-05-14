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

export default router;