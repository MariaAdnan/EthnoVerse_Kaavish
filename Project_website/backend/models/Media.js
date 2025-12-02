import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
  title: String,
  type: { type: String, enum: ["image", "audio", "video"], required: true },
  url: String, // cloudinary url
  description: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Media", mediaSchema);
