import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js";
import { OAuth2Client } from "google-auth-library";
// import { sendEmail } from "../utils/sendEmail.js";
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new ApiError(400, "Google credential missing");
  }

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const {
    sub,
    email,
    name,
    picture,
  } = payload;

  let user = await User.findOne({
    googleId: sub,
  });

  if (!user) {
    user = await User.create({
      googleId: sub,
      email,
      name,
      profilePicture: picture,
    });
  }

  const token = generateToken(user);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
        user,
      },
      "Login successful"
    )
  );
});
const generateToken = (user) => {
   if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing");
  }
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

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
      isVerified: true
    });
  }

  const token = generateToken(admin);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: admin,
        token
      },
      "Admin logged in successfully"
    )
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

const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      req.user,
      "User fetched successfully"
    )
  );
});

export {
  adminLogin,
  googleLogin,
  getMe
};