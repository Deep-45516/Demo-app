import VerificationSession from "../models/verificationSession.model.js";
import User from "../models/user.model.js";
import { createAnonymousProfile } from "../services/anonymousProfile.service.js";
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
import AnonymousProfile from "../models/anonymousProfile.model.js";
import { deliverPendingConfessions } from "../services/pendingConfessionDelivery.service.js";

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

// already Receive Instagram messages and now we can trust the webhook sender that it is come from meta
export const receiveWebhook = async (req, res) => {
  try {
    //console
    console.log(JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (!messaging?.message?.text) {
      return res.sendStatus(200);
    }

    const text = messaging.message.text.trim();
    console.log("Received code:", text);

    console.log("Message:", text);
    const pendingSessions = await VerificationSession.find({
      status: "pending",
    });

    console.log(
      "Pending sessions:",
      pendingSessions.map((s) => ({
        code: s.code,
        username: s.enteredUsername,
      })),
    );
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Instagram Graph API error:", response.status, errorText);
      return res.sendStatus(200);
    }

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

  session.status = "username_mismatch";

  session.lastError =
    `You entered @${session.enteredUsername} but sent the verification code from @${profile.username}.`;

  await session.save();

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
        instagramUsername: profile.username.toLowerCase(),
        instagramName: profile.name,
        instagramVerified: true,
      });
    } else {
      // Update existing user
      user.instagramUsername = profile.username.toLowerCase();
      user.instagramName = profile.name;
      user.instagramVerified = true;

      await user.save();
    }
    //give anonomous identity attch to that user_.id, anonomous identity also has its own id
    let anonymousProfile = await AnonymousProfile.findOne({
  userId: user._id,
});

if (!anonymousProfile) {
  anonymousProfile = await createAnonymousProfile(user._id);
}
await deliverPendingConfessions(user);

console.log(
  `Anonymous profile created: ${anonymousProfile.anonymousName}`
);

    // Mark verification session as completed
    session.userId = user._id;
    session.status = "verified";
    session.instagramScopedId = profile.id;
    session.verifiedAt = new Date();

    await session.save();
    const savedSession = await VerificationSession.findById(session._id);

    console.log(savedSession);
    console.log("Saving session...");
    console.log({
      userId: user._id,
      status: session.status,
    });

    console.log(`${profile.username} verified successfully.`);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);

    return res.sendStatus(500);
  }
};
