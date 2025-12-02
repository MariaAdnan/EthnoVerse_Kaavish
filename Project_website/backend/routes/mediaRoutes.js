import express from "express";
import upload from "../middleware/upload.js";
import { uploadMedia, getMediaByCommunity, getMedia } from "../controllers/mediaController.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadMedia);
router.get("/community/:id", getMediaByCommunity);
router.get("/:id", getMedia);

export default router;
