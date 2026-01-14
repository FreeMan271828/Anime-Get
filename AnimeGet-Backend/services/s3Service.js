// services/s3Service.js
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require('../config/s3Client');

/**
 * 为给定的S3对象键生成一个预签名的URL。
 * @param {string} key - S3存储桶中对象的键（文件路径）。
 * @param {number} [expiresIn=3600] - URL的有效时间（秒），默认为1小时。
 * @returns {Promise<string|null>} 返回预签名的URL字符串，如果key无效或生成失败则返回null。
 */
const generatePresignedUrl = async (key, expiresIn = 3600) => {
  if (!key) {
    return null;
  }
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    console.error("AWS_BUCKET_NAME environment variable is not set.");
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Failed to generate presigned URL for key "${key}":`, error);
    return null;
  }
};

module.exports = { generatePresignedUrl };
