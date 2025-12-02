// backend/routes/communityRoutes.js
import express from "express";
import Community from "../models/Community.js";

const router = express.Router();

// GET all communities
router.get("/", async (req, res) => {
  try {
    const communities = await Community.find();
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single community by ID
router.get("/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    res.json(community);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
