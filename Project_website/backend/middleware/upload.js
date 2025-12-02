import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Temporary local storage
const upload = multer({
  dest: "temp/",  // files saved here before upload
});

export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filePath = req.file.path;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "uploads",
      resource_type: "auto", // handles images + video + others
    });

    // attach cloudinary URL to request
    req.file.cloudinaryUrl = result.secure_url;

    // remove temp file
    fs.unlinkSync(filePath);

    next();
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};

export default upload;
