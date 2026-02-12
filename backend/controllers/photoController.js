// backend/controllers/photoController.js
const Photo = require("../models/Photo");

const getRequestPhotos = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const photos = await Photo.findByRequestId(requestId);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const photosWithUrl = photos.map((photo) => ({
      ...photo,
      url: `${baseUrl}/uploads/${photo.file_path.split("\\").pop().split("/").pop()}`,
    }));

    res.json(photosWithUrl);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRequestPhotos };
