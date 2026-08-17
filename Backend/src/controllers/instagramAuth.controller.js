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