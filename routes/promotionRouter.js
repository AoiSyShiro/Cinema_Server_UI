const express = require('express');
const router = express.Router();
const { getAllPromotions, createPromotion, updatePromotion, deletePromotion } = require('../controllers/PromotionController');

// Get all promotions
router.get('/', getAllPromotions);

// Create a new promotion
router.post('/', createPromotion);

// Update an existing promotion
router.put('/:promotion_id', updatePromotion);

// DELETE route for deleting promotion
router.delete('/:promotion_id', deletePromotion);  // Sửa lại DELETE để nhận promotion_id từ tham số URL

module.exports = router;
