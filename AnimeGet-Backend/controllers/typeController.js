// controllers/typeController.js
const pool = require('../config/db');

exports.getAllTypes = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM anime_types ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.createType = async (req, res, next) => {
  const { label } = req.body;
  if (!label) {
    return res.status(400).json({ message: "Label is required" });
  }
  try {
    await pool.query('INSERT INTO anime_types (label) VALUES ($1)', [label]);
    res.status(201).json({ success: true, message: 'Type created successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteType = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM anime_types WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Type not found.' });
    }
    res.json({ success: true, message: 'Type deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
