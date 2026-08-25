//C:\Users\yashl\OneDrive\Desktop\clean-repo\Backend\src\controllers\instagramAuth.controller.js

import VerificationSession from "../models/verificationSession.model.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import User from "../models/user.model.js";
import { generateToken } from "./auth.controller.js";
import mongoose from "mongoose";
/*Receive username->Expire old sessions->Generate code->Create VerificationSession->Return sessionId + code*/
//this create session & code and send code to frontend user
export const startInstagramVerification = asyncHandler(async (req, res) => {
  console.log("NEW VERSION RUNNING");

  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        "Instagram username is required",
      ),
    );
  }

  const enteredUsername =
    username.trim().toLowerCase();

  // =====================================================
  // IMPORTANT:
  // An existing user does NOT mean the current person
  // owns that Instagram account.
  //
  // Every login must create a fresh verification session.
  // Ownership is proved only when the verification code
  // is sent from the actual Instagram account.
  // =====================================================

  // Expire any previous pending session
  // for this username.
  await VerificationSession.updateMany(
    {
      enteredUsername,
      status: "pending",
    },
    {
      status: "expired",
    },
  );

  // Generate a fresh verification code.
  const code =
    generateVerificationCode();

  // Create a new verification session.
  const session =
    await VerificationSession.create({
      enteredUsername,
      code,
      expiresAt:
        new Date(
          Date.now() +
            15 *
              60 *
              1000,
        ),
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
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid session id"));
  }
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
        "Verification failed",
      ),
    );
  }

  if (session.status !== "verified") {
    return res.json(
      new ApiResponse(
        200,
        {
          status: session.status,
        },
        "Waiting for verification",
      ),
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
