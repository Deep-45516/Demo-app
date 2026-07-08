import VerificationSession from "../models/verificationSession.model.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const startInstagramVerification = asyncHandler(
  async (req, res) => {
    const { username } = req.body;

    const code = generateVerificationCode();

    const session = await VerificationSession.create({
      code,
      enteredUsername: username.trim().toLowerCase(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
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
  },
);