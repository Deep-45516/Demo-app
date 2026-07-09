import { Router } from "express";
import {
  adminLogin,
  googleLogin,
  getMe,
} from "../controllers/auth.controller.js";
import { getVerificationStatus } from "../controllers/instagramAuth.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  startInstagramVerification,
} from "../controllers/instagramAuth.controller.js";

const router = Router();

router.post("/admin-login", adminLogin);
// router.post("/send-otp", sendUserOtp);
// router.post("/verify-otp", verifyUserOtp);
router.get("/me", verifyToken, getMe);
router.post("/google", googleLogin);
{
  /*redirect to googleLogin funtion in auth.controller.js and then it will verify the user and send back the user info and token to frontend*/
}
router.post("/instagram/start",
  startInstagramVerification,
);
router.get(
"/instagram/status/:sessionId",
getVerificationStatus
);
export default router;
