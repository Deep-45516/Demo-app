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
/*
This endpoint only checks

Pending?

Verified?

JWT?

No webhook logic here, just checking the status of the verification session and returning it to the frontend. The frontend can then decide what to do next based on the status.
 */
export const getVerificationStatus =
asyncHandler(async (req,res)=>{

    const { sessionId } = req.params;

    const session =
    await VerificationSession.findById(sessionId);

    if(!session){
        return res.status(404).json(
            new ApiResponse(
                404,
                null,
                "Session not found"
            )
        );
    }


    return res.json(
        new ApiResponse(
            200,
            {
                status: session.status,
                token: session.token
            },
            "OK"
        )
    );

});