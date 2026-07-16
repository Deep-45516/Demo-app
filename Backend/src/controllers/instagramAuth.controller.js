import VerificationSession from "../models/verificationSession.model.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import User from "../models/user.model.js";
import { generateToken } from "./auth.controller.js";
/*Receive username->Expire old sessions->Generate code->Create VerificationSession->Return sessionId + code*/
//this create session & code and send code to frontend user 
export const startInstagramVerification = asyncHandler(async (req, res) => {
  console.log("NEW VERSION RUNNING");
  const { username } = req.body;//take username from frontend user
  const enteredUsername = username.trim().toLowerCase();
  const existingUser = await User.findOne({
  instagramUsername: enteredUsername,
  instagramVerified: true,
});

if (existingUser) {
  return res.status(409).json(
    new ApiResponse(
      409,
      null,
      "This Instagram account is already verified."
    )
  );
}
  // Expire any existing pending sessions for the same username,This ensures  only one pending session exists for that username at any time.but if user is already verified then it will not create new session and return error message to user that is "already verified" check this code in .if pending session exists then it will expire the old session and create new session for that user.
  // this session validate the user 
//update many will update all the pending sessions (i.e 1 only) for that username to expired status.
  await VerificationSession.updateMany(
    {
      enteredUsername,
      status: "pending",
    },
    {
      status: "expired",
    },
  );
  // Generate a new verification code and create a new session
  const code = generateVerificationCode();
//this will create new session for that user with code and expire time of 15 minutes from now.
  const session = await VerificationSession.create({
    enteredUsername,
    code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),// 15 minutes from now
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        sessionId: session._id,
        code,
      },
      "Verification session created",
    ),
  );
});
/*
//This function is used by frontend polling.
//just checking status of verification session and return it to frontend. Frontend will decide what to do next based on status.
This endpoint only checks
Pending?
Verified?
JWT?
No webhook logic here
 */
/*Frontend->GET /status/:sessionId→
Find VerificationSession→Verified?→
No → return pending
→Yes→Find User→Generate JWT→Return Token */
export const getVerificationStatus = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await VerificationSession.findById(sessionId);
  if (!session) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Verification session not found"));
  }

  if (session.status === "username_mismatch") {
  return res.json(
    new ApiResponse(
      200,
      {
        status: session.status,
        error: session.lastError,
      },
      "Verification failed"
    )
  );
}

if (session.status !== "verified") {
  return res.json(
    new ApiResponse(
      200,
      {
        status: session.status,
      },
      "Waiting for verification"
    )
  );
}
//find by seesion id which is 
  const user = await User.findById(session.userId);

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  const token = generateToken(user);

  return res.json(
    new ApiResponse(
      200,
      {
        status: "verified",
        token,
      },
      "Verification completed",
    ),
  );
});
