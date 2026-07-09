import VerificationSession from "../models/verificationSession.model.js";
import User from "../models/user.model.js";
import { generateToken } from "./auth.controller.js";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

// Verify webhook during Meta setup
export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log("Webhook verification request received");
  console.log(req.query);
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

// Receive Instagram messages
export const receiveWebhook = async (req, res) => {
  try {
    console.log(JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (!messaging?.message?.text) {
      return res.sendStatus(200);
    }

    const text = messaging.message.text.trim();

    console.log("Message:", text);

    const session = await VerificationSession.findOne({
      code: text,
      status: "pending",
    });

    if (!session) {
      console.log("No verification session found");
      return res.sendStatus(200);
    }

    console.log("Verification code matched.");
    // Next step:
    // Fetch Instagram profile
    // Create / Update user
    // Generate JWT

    const senderId = messaging.sender.id;

    const response = await fetch(
      `https://graph.instagram.com/${senderId}?fields=id,username,name&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN_LOGIN}`,
    );

    const profile = await response.json();

    console.log(profile);

    if (profile.error) {
      console.error(profile.error);
      return res.sendStatus(200);
    }
    // Verify the entered username matches the sender's Instagram account
    if (
      session.enteredUsername.toLowerCase() !== profile.username.toLowerCase()
    ) {
      console.log(
        `Username mismatch. Entered: ${session.enteredUsername}, Actual: ${profile.username}`,
      );

      return res.sendStatus(200);
    }

    // Find existing user
    let user = await User.findOne({
  $or: [
    { instagramScopedId: profile.id },
    { instagramUsername: profile.username.toLowerCase() },
  ],
});

    // Create user if it doesn't exist
    if (!user) {
      user = await User.create({
        instagramScopedId: profile.id,
        instagramUsername: profile.username,
        instagramName: profile.name,
        instagramVerified: true,
      });
    } else {
      // Update existing user
      user.instagramUsername = profile.username;
      user.instagramName = profile.name;
      user.instagramVerified = true;

      await user.save();
    }
    const token = generateToken(user);


    // Mark verification session as completed
    session.userId = user._id;
    session.status = "verified";
    // session.instagramScopedId = profile.id;
    session.verifiedAt = new Date();

    await session.save();

    console.log(`${profile.username} verified successfully.`);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);

    return res.sendStatus(500);
  }
};
