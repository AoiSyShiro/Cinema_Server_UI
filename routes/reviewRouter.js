const express = require("express");
const router = express.Router();
const {
  createReview,
  getAllReviewsForMovie,
  updateReview,
  deleteReview,
} = require("../controllers/ReviewController");

// Route
router.post("/", createReview); // Thêm đánh giá

router.get("/movie/:movie_id", getAllReviewsForMovie); // Hiển thị danh sách đánh giá dựa trên id phim

router.put("/:id", updateReview); // Cập nhật đánh giá

router.delete("/:id", deleteReview); // Xóa đánh giá

module.exports = router;
