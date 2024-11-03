const express = require("express");
const {
  register,
  login,
  logout,
  changePassword,
  updateUserInfo,
  deleteUser,
  getUserInfo,
} = require("../controllers/userController");

const router = express.Router();

// Đăng ký người dùng
router.post("/register", register);

// Đăng nhập người dùng
router.post("/login", login);

// Thoát tài khoản
router.delete("/exit", logout);

// Thay đổi mật khẩu
router.post("/change-password", changePassword);

// Cập nhật thông tin người dùng
router.put("/update-info", updateUserInfo);

// Xóa người dùng
router.delete("/delete", deleteUser);

// Lấy thông tin người dùng
router.get("/user/:user_id", getUserInfo);

module.exports = router;
