// routes/index.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');

// --- Public Routes ---
const authRoutes = require('./auth');
router.use('/auth', authRoutes); // e.g., /api/auth/register

// --- Protected Routes ---
// All routes defined below this middleware will require a valid JWT
router.use(authenticateToken);

const userRoutes = require('./user');
const animeRoutes = require('./anime');
const typeRoutes = require('./types');

router.use('/user', userRoutes);   // e.g., /api/user/profile
router.use('/anime', animeRoutes); // e.g., /api/anime/
router.use('/types', typeRoutes); // e.g., /api/types/

module.exports = router;
