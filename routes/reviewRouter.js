const express = require("express");
const router = express.Router();
const {
  createReview,
  getAllReviews,
  updateReview,
  deleteReview,
} = require("../controllers/ReviewController");

// Route
router.post("/", createReview); // Thêm đánh giá
router.get("/", getAllReviews); // Hiển thị danh sách đánh giá
router.put("/:id", updateReview); // Cập nhật đánh giá
router.delete("/:id", deleteReview); // Xóa đánh giá

module.exports = router;
