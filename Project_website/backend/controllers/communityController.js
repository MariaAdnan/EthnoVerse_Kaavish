import Community from "../models/Community.js";

export const createCommunity = async (req, res) => {
  try {
    const { name, description, region } = req.body;

    const community = await Community.create({
      name,
      description,
      region,
      coverImage: req.file?.path
    });

    res.json(community);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommunities = async (req, res) => {
  const communities = await Community.find();
  res.json(communities);
};

export const getCommunity = async (req, res) => {
  const community = await Community.findById(req.params.id);
  res.json(community);
};
