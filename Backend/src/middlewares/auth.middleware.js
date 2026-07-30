import { verifyJWT } from "../utils/jwt.js";

//Hello! Before you enter, show me your visitor pass.
//does this person send authorisation header
//if Authorization: Bearer eyJhbGc... then header is "Bearer eyJhbGc..." and JWT token is "eyJhbGc..."
//IF NO THEN NO ENTRY TO THIS PAGE

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    /*
    GUARD ONLY NEEDS THE JWT TOKEN, NOT THE COMPLETE HEADER.

    It splits the string wherever there is a space and gets:

    [
      "Bearer",
      "eyJhbGc..."
    ]
    */

    //So token is the second element of the array i.e. "eyJhbGc..." (index 1)
    const token = authHeader.split(" ")[1];

    //Guard checks if the token was signed with the secret koley or not.
    //Only the server knows this secret key.
    //If valid, jwt.verify() returns the payload (user id, email, role, expiry, etc.) in decoded.
  const decoded = verifyJWT(token);

    //If everything is valid, store the user's info in req.user
    //so later we can access it like req.user.email from any middleware/controller.
    req.user = decoded;

    //If verification succeeds, continue to the next middleware/controller.
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

//Second guard after verifyToken.
//Checks whether the logged-in user is an admin or not.
//If not, NO ENTRY to any route using this middleware.
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only",
      });
    }

    next();
  });
};

/*
You arrive at the company.
        │
        ▼
Security Guard (verifyToken)
        │
        ▼
"Show your visitor pass."
        │
        ▼
Authorization: Bearer JWT
        │
        ▼
Extract the JWT
        │
        ▼
Check if it's genuine
        │
        ▼
If valid:
req.user = decoded user
        │
        ▼
"Okay, go inside."
        │
        ▼
Second Guard (verifyAdmin)
        │
        ▼
"Are you an admin?"
        │
   ┌────┴─────┐
   │          │
  No         Yes
   │          │
 403       next()
Forbidden     │
              ▼
      Admin API runs
*/
