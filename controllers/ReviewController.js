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

// Hiển thị danh sách đánh giá cho một bộ phim
const getAllReviewsForMovie = async (req, res) => {
  try {
    const { movie_id } = req.params; // Lấy movie_id từ tham số URL
    const reviews = await Review.find({ book_tickets_id: movie_id }).populate("book_tickets_id", "user_id");
    
    if (reviews.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá cho phim này" });
    }

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
    const { id } = req.params;
    const deletedReview = await Review.findOneAndDelete({ review_id: id });

    if (!deletedReview) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đánh giá cần xóa" });
    }

    res.status(200).json({ message: "Xóa đánh giá thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa đánh giá", error });
  }
};

module.exports = { createReview, getAllReviewsForMovie, updateReview, deleteReview };
