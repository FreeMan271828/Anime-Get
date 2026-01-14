// middlewares/upload.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3Client');
const path = require('path');

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'private', // 明确设置为私有
    key: function (req, file, cb) {
      // 根据路由路径动态决定上传文件夹
      const folder = req.originalUrl.includes('avator') ? 'avators/' : 'covers/';
      const uniqueSuffix = Date.now().toString() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, folder + uniqueSuffix + extension);
    }
  })
});

module.exports = upload;
