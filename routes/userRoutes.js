const express = require('express');
const {
    register,
    login,
    logout
} = require('../controllers/userController'); 
const router = express.Router();

// Đăng ký người dùng
router.post('/register', register);

// Đăng nhập người dùng
router.post('/login', login);

// Thoát tài khoản
router.delete('/exit', logout);

module.exports = router;
