const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');

// Tạo yêu cầu thanh toán
router.post('/create', paymentController.createPayment);

module.exports = router;
