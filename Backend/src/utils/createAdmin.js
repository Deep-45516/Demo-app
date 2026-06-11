// Take the emails in adminEmails
// Check if each email already exists in MongoDB
// If not, create a new user with:
// that email
// a hashed password
// role: "admin"
// isVerified: true
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const createAdmins = async () => {

  const adminEmails = [
    "deeplokhande07@gmail.com",
    "sayitfreely.connect@gmail.com",
    "admin3@gmail.com"
  ];

  for (const email of adminEmails) {

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log(`Admin already exists: ${email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(
      "yourStrongPassword123",
      10
    );

    await User.create({
      email,
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    console.log(`Admin created: ${email}`);
  }
};