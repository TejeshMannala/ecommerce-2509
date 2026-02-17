const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const filePath = `/uploads/products/${req.file.filename}`;
    const url = `${req.protocol}://${req.get('host')}${filePath}`;

    return res.status(201).json({
      message: 'Image uploaded successfully',
      fileName: req.file.filename,
      filePath,
      url,
    });
  } catch (error) {
    console.error('Admin upload image error:', error);
    return res.status(500).json({
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  uploadProductImage,
};
