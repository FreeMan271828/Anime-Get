// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { userRegisterSchema, userLoginSchema } = require('../utils/joiSchemas');

exports.register = async (req, res, next) => {
  try {
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, password } = req.body;

    const userExists = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO "user" (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: newUser.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const payload = { userId: user.id, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Login successful.', token: token });
  } catch (err) {
    next(err);
  }
};
