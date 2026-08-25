//auth.controller.js
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js";
import { OAuth2Client } from "google-auth-library";
import AnonymousProfile from "../models/anonymousProfile.model.js";
// import { sendEmail } from "../utils/sendEmail.js";

//client is a Google authentication helper for my app tocheck google login credentials
//we get client id from google cloude console-> credentials->OAuth 2.0 client IDs
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  //crededntial is string from google login button which is digitally signed identity card created by google(check frontend/src/pages/Home.jsx for more info)
  if (!credential) {
    throw new ApiError(400, "Google credential missing");
  }

  //Hey Google, is this user valid?
  //Here, client contacts Google and asks:
  /*
  "Is this ID token real?"
  "Was it issued for my app?"
  */

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  //all user info is in payload, we can get it from ticket.getPayload() only after google verifies
  const payload = ticket.getPayload();

  //real unique id is sub not email, it is unique code number
  const { sub, email, name, picture } = payload;

  //Database check(MongoDB): Is this user already in our database?
  /*
  But Google doesn't know:
  - Which role the user has (admin/user)
  - Whether the user has submitted confessions
  - Whether Instagram is verified

  Only our database knows this.
  Google only proves the user's identity.
  MongoDB stores our application's data.
  */
let user = await User.findOne({
  $or: [
    { googleId: sub },
    { email }
  ]
});
//not created , create new user in database with googleId, email, name, profilePicture
if (!user) {
  user = await User.create({
    googleId: sub,
    email,
    name,
    profilePicture: picture,
  });
} else {
  user.googleId = sub;
  user.name = name;
  user.profilePicture = picture;

  await user.save();
}

  //token ="eyJhbGciOiJIUzI1NiIsInR5cCI..."
  const token = generateToken(user);

  //response means backend sends back to frontend with status code, it is in json format i.e res.status(200).json({success:true, message:"Login successful", data:{token,user}})

  //APIresponse is class we created in file C:\Users\yashl\OneDrive\Desktop\clean-repo\Backend\src\utils\api-response.js in well formate as a helper

  /*
  after sending this frontend get something like in JSON format:

  {
    "statusCode":200,
    "data":{
      "token":"eyJhbGc...",
      "user":{
        ...
      }
    },
    "message":"Login successful"
  }
  */

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
        user,
      },
      "Login successful",
    ),
  );
});

//need secret key to sign the token, we can get it from .env file
//to confirm Did I create this token, or did someone fake it?
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing");
  }

  //Create a JWT token with user id, email, and role as payload, sign it with secret key, and set expiration to 7 days
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
    //reloggin after 7 days, we can also use refresh token to avoid this
  );
};

/*
Admin enters email + password
        │
Backend checks .env values
        │
If correct
        │
Find/Create admin user
        │
Generate JWT

this works for different page i.e.
router.post("/admin-login", adminLogin)
*/
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  let admin = await User.findOne({ email });

  if (!admin) {
    admin = await User.create({
      email,
      role: "admin",
      isVerified: true,
    });
  }

  const token = generateToken(admin);

  //token ="eyJhbGciOiJIUzI1NiIsInR5cCI..."

  /*
  response means backend sends back to frontend
  with status code and JWT token with role authorisation,
  it is in json format
  */

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: admin,
        token,
      },
      "Admin logged in successfully",
    ),
  );
});

// const sendUserOtp = asyncHandler(async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     throw new ApiError(400, "Email is required");
//   }

//   const otp = Math.floor(
//     100000 + Math.random() * 900000
//   ).toString();

//   const otpExpiry = new Date(
//     Date.now() + 10 * 60 * 1000
//   );

//   let user = await User.findOne({ email });

//   if (!user) {
//     user = await User.create({
//       email,
//       role: "user",
//       isVerified: false
//     });
//   }

//   user.otp = otp;
//   user.otpExpiry = otpExpiry;

//   await user.save();

//   await sendEmail({
//     email,
//     subject: "Your SayItFreely login OTP",
//     mailgenContent: {
//       body: {
//         name: email,
//         intro: "Use this OTP to login:",
//         outro: `Your OTP is: ${otp}. It expires in 10 minutes.`
//       }
//     }
//   });

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       null,
//       "OTP sent to your email"
//     )
//   );
// });

// const verifyUserOtp = asyncHandler(async (req, res) => {
//   const { email, otp } = req.body;

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   if (
//     user.otp !== otp ||
//     !user.otpExpiry ||
//     user.otpExpiry < new Date()
//   ) {
//     throw new ApiError(400, "Invalid or expired OTP");
//   }

//   user.isVerified = true;
//   user.otp = null;
//   user.otpExpiry = null;

//   await user.save();

//   const token = generateToken(user);

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         user,
//         token
//       },
//       "User logged in successfully"
//     )
//   );
// });

/*
Now the user refreshes the page tomorrow.

How do you know whether the stored token is still valid?

Frontend calls:

GET /api/v1/auth/me
Authorization: Bearer eyJhbGc...

Flow:

Frontend
↓
GET /me
↓
verifyToken()
↓
JWT valid?
↓
Yes
↓
getMe()
↓
Return current user

So getMe() means:

"Tell me who is currently logged in."
*/
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

const anonymousProfile = await AnonymousProfile.findOne({
  userId: user._id,
});

return res.status(200).json(
  new ApiResponse(
    200,
    {
      user,
      anonymousProfile,
      onboardingCompleted: !!anonymousProfile,
    },
    "User fetched successfully"
  )
);
});

export {
    adminLogin,
    googleLogin,
    getMe,
    generateToken
};
