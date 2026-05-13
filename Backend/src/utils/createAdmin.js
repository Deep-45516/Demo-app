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