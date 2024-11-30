const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Đảm bảo gọi đúng route
router.get('/', dashboardController.getDashboardStats);

module.exports = router;
