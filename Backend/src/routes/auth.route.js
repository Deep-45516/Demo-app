import { Router } from "express";
import {
  adminLogin,
  sendUserOtp,
  verifyUserOtp,
  getMe
} from "../controller/auth.controller.js";

import {
  verifyToken
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/admin-login", adminLogin);
router.post("/send-otp", sendUserOtp);
router.post("/verify-otp", verifyUserOtp);
router.get("/me", verifyToken, getMe);

export default router;