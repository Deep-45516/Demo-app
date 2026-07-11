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
  console.log("Header Signature:", signature);
console.log("App Secret Exists:", !!process.env.META_APP_SECRET);
console.log("Raw Body Exists:", !!req.rawBody);

  const expected =
    "sha256=" +
    crypto
      .createHmac(
        "sha256",
        process.env.META_APP_SECRET
      )
      .update(req.rawBody)
      .digest("hex");
      console.log("Expected:", expected);

  if (signature !== expected) {
    console.log("❌ Signature mismatch");
    console.log(req.rawBody.toString("utf8"));
    return res.sendStatus(401);
  }
  console.log("✅ Signature verified");
  next();
}