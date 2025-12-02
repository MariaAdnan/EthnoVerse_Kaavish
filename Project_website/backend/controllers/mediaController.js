import Media from "../models/Media.js";

export const uploadMedia = async (req, res) => {
  try {
    const { communityId, title, type, description } = req.body;

    const media = await Media.create({
      communityId,
      title,
      type,
      description,
      url: req.file?.path
    });

    res.json(media);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMediaByCommunity = async (req, res) => {
  const media = await Media.find({ communityId: req.params.id });
  res.json(media);
};

export const getMedia = async (req, res) => {
  const media = await Media.findById(req.params.id);
  res.json(media);
};
