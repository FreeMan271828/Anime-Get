// routes/anime.js
const express = require('express');
const router = express.Router();
const animeController = require('../controllers/animeController');
const uploadController = require('../controllers/uploadController');
const uploadMiddleware = require('../middlewares/upload');

// Anime collection routes
router.get('/', animeController.getAllAnime);
router.post('/', animeController.createAnime);

// Anime individual item routes
router.get('/:id', animeController.getAnimeById);
router.put('/:id', animeController.updateAnimeInfo);
router.post('/:id/status', animeController.updateAnimeStatus);

// History routes
router.put('/history/:id', animeController.updateHistory);

// Comment routes
router.post('/comment', animeController.createComment);
router.put('/comment/:id', animeController.updateComment);

// Upload route specific to anime covers
router.post('/upload/cover', uploadMiddleware.single('file'), uploadController.uploadFile);

module.exports = router;
