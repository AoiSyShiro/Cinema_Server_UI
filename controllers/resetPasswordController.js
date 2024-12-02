const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// Route render trang reset password
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Kiểm tra token hợp lệ
        const decoded = jwt.verify(token, 'secret_key');
        
        // Render trang reset mật khẩu và truyền token vào
        res.render('reset-password', { token, successMessage: '', errorMessage: '' });
    } catch (error) {
        res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
});

// API reset mật khẩu
router.post('/reset-password', async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp!' });
    }

    try {
        // Kiểm tra token
        const decoded = jwt.verify(token, 'secret_key');
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Người dùng không tồn tại!' });
        }

        // Mã hóa mật khẩu mới và lưu vào database
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Mật khẩu đã được thay đổi thành công!' });
    } catch (error) {
        res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
});

module.exports = router;
