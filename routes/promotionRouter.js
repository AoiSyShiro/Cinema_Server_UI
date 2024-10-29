const express = require("express");
const {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require("../controllers/PromotionController");

const router = express.Router();

// Định nghĩa các route cho khuyến mãi
router.get("/", getAllPromotions); // Hiển thị danh sách khuyến mãi
router.post("/", createPromotion); // Thêm mới khuyến mãi
router.put("/:id", updatePromotion); // Cập nhật khuyến mãi
router.delete("/:id", deletePromotion); // Xóa khuyến mãi

module.exports = router;
