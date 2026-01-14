// controllers/uploadController.js
exports.uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  res.json({ 
    message: 'Upload successful',
    key: req.file.key // 返回S3中的文件key
  });
};
