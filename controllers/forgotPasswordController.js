const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User"); // Điều chỉnh đường dẫn nếu cần
require("dotenv").config(); // Tải các biến môi trường từ .env

const router = express.Router();

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MYGMAIL, // Sử dụng biến MYGMAIL từ .env
    pass: process.env.MYPASS, // Sử dụng biến MYPASS từ .env
  },
});

// API gửi yêu cầu reset mật khẩu
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra email của người dùng
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Không tồn tại email này!" });
    }

    // Tạo token reset mật khẩu
    const token = jwt.sign({ email: user.email }, "secret_key", {
      expiresIn: "1h",
    });

    // Tạo URL reset mật khẩu
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`; // Sử dụng CLIENT_URL từ .env

    // Nội dung email
    const mailOptions = {
      from: process.env.MYGMAIL, // Sử dụng MYGMAIL từ .env
      to: email,
      subject: "Yêu cầu đặt lại mật khẩu",
      html: `<p>Vui lòng nhấn vào liên kết dưới đây để đặt lại mật khẩu:</p><a href="${resetLink}">Đặt lại mật khẩu</a>`,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email reset mật khẩu đã được gửi!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Có lỗi xảy ra. Vui lòng thử lại sau." });
  }
});

module.exports = router;
