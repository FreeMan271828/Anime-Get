// routes/types.js
const express = require('express');
const router = express.Router();
const typeController = require('../controllers/typeController');

router.get('/', typeController.getAllTypes);
router.post('/', typeController.createType);
router.delete('/:id', typeController.deleteType);

module.exports = router;
