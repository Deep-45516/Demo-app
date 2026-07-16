import crypto from "crypto";

export default function verifyMetaSignature(req, res, next) {
  //meta sends signature in header x-hub-signature-256, we need to verify it using our app secret and the raw body of the request
  const signature = req.headers["x-hub-signature-256"];
//signature = sha256=something,our backend does trust this meta signature bcz it could be fake,so we generate our own signature using app secret and raw body of the request and compare it with the signature sent by meta,if they match then we can trust the request is from meta
  if (!signature) {
    return res.sendStatus(401);
  }
  // console.log("Header Signature:", signature);
  // console.log("App Secret Exists:", !!process.env.META_APP_SECRET);
  // console.log("Raw Body Exists:", !!req.rawBody);
  // console.log(process.env.META_APP_SECRET.length);
  // console.log(
  //   "App Secret starts with:",
  //   process.env.META_APP_SECRET.slice(0, 6),
  // );
  // console.log(req.headers);
  //create our own signature 
  /*sha256 is hashing algorithm read about it
Uses the original request body sent by Meta.
Create a signature for this exact request.returns the signature as a hexadecimal string
in simple secrete + message/code = signature get created  */
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.META_APP_SECRET)
      .update(req.rawBody)
      .digest("hex");
  // console.log("Expected:", expected);
//if not match then return 401 unauthorized, else process next() for recewivewebhook()
  if (signature !== expected) {
    console.log("❌ Signature mismatch");
    console.log(req.rawBody.toString("utf8"));
    return res.sendStatus(401);
  }
  console.log("✅ Signature verified");
  next();
}
