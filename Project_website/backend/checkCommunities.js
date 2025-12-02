import mongoose from "mongoose";
import dotenv from "dotenv";
import Community from "./models/Community.js"; // adjust if your model is named differently

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const communities = await Community.find();
  console.log(communities);
  mongoose.disconnect();
}

check();
