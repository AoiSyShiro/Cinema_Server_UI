const Review = require("../models/Review");

// Thêm đánh giá
const createReview = async (req, res) => {
  try {
    const { book_tickets_id, comment, rate } = req.body;
    const newReview = new Review({ book_tickets_id, comment, rate });
    await newReview.save();
    res
      .status(201)
      .json({ message: "Thêm đánh giá thành công", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm đánh giá", error });
  }
};

// Hiển thị danh sách đánh giá
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate("book_tickets_id", "user_id");
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đánh giá", error });
  }
};

// Cập nhật đánh giá
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedReview = await Review.findOneAndUpdate(
      { review_id: id },
      updatedData,
      { new: true }
    );

    if (!updatedReview) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đánh giá cần cập nhật" });
    }

    res
      .status(200)
      .json({ message: "Cập nhật đánh giá thành công", review: updatedReview });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật đánh giá", error });
  }
};

// Xóa đánh giá
const deleteReview = async (req, res) => {
    try {
      const { id } = req.params; // Assuming id is the review_id
      // Use findOneAndDelete to find by review_id
      const deletedReview = await Review.findOneAndDelete({ review_id: id });
  
      if (!deletedReview) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá cần xóa" });
      }
  
      res.status(200).json({ message: "Xóa đánh giá thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa đánh giá", error });
    }
  };
  
  module.exports = { createReview, getAllReviews, updateReview, deleteReview };
  