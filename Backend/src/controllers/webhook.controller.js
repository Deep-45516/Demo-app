import VerificationSession from "../models/verificationSession.model.js";
import User from "../models/user.model.js";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

// Verify webhook during Meta setup
export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
console.log("Webhook verification request received");
console.log(req.query);
  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

// Receive Instagram messages
export const receiveWebhook = async (req, res) => {
  try {
    console.log(
      JSON.stringify(req.body, null, 2)
    );

    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (!messaging?.message?.text) {
      return res.sendStatus(200);
    }

    const text =
      messaging.message.text.trim();

    console.log("Message:", text);

    const session =
      await VerificationSession.findOne({
        code: text,
        status: "pending",
      });

    if (!session) {
      console.log("No verification session found");
      return res.sendStatus(200);
    }

    console.log(
      "Verification code matched."
    );

    // Next step:
    // Fetch Instagram profile
    // Create / Update user
    // Generate JWT

    return res.sendStatus(200);

  } catch (error) {
    console.error(error);

    return res.sendStatus(500);
  }
};