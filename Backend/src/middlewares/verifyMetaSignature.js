import crypto from "crypto";

export default function verifyMetaSignature(
  req,
  res,
  next
) {
  const signature = req.headers["x-hub-signature-256"];

  if (!signature) {
    return res.sendStatus(401);
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac(
        "sha256",
        process.env.META_APP_SECRET
      )
      .update(req.rawBody)
      .digest("hex");

  if (signature !== expected) {
    return res.sendStatus(401);
  }

  next();
}