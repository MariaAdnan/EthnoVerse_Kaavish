// backend/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/communities", communityRoutes);
app.use("/api/media", mediaRoutes);
// connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB connection error:", err));

// routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("EthnoVerse backend running...");
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
