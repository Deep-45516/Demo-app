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

    await User.create({
      googleId: `admin-${email}`,
      email,
      name: email.split("@")[0],
      role: "admin",
      profilePicture: null,
      instagramVerified: false
    });

    console.log(`Admin created: ${email}`);
  }
};