// backend/seed/seedAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/User.js";

dotenv.config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const ADMIN_EMAIL = "admin@ethnoverse.local";
    const ADMIN_PLAIN_PASSWORD = "adminpassword";

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log("Admin already exists:", existing.email);
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PLAIN_PASSWORD, 10);

    await User.create({
      name: "EthnoVerse Admin",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    });

    console.log("Admin created successfully");
    console.log("Email:", ADMIN_EMAIL);
    console.log("Password:", ADMIN_PLAIN_PASSWORD);

  } catch (err) {
    console.log(err);
  } finally {
    mongoose.disconnect();
  }
}

seedAdmin();
