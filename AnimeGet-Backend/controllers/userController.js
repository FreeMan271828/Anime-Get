// controllers/userController.js
const pool = require('../config/db');
const { generatePresignedUrl } = require('../services/s3Service');

exports.getProfile = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const query = 'SELECT id, username, created_at, avator FROM "user" WHERE id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userProfile = result.rows[0];
    userProfile.avator_url = await generatePresignedUrl(userProfile.avator);
    
    res.json(userProfile);
  } catch (err) {
    next(err);
  }
};
