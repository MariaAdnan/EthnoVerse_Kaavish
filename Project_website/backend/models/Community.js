// backend/models/Community.js

import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  region: String,
  coverImage: String, // cloudinary url
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Community", communitySchema);
