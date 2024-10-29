const Promotion = require("../models/Promotion");

// Hiển thị danh sách khuyến mãi
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().populate("showtime_id");
    res.status(200).json(promotions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách khuyến mãi", error });
  }
};

// Thêm mới một khuyến mãi
const createPromotion = async (req, res) => {
  try {
    const { showtime_id, discount_percentage } = req.body;
    const newPromotion = new Promotion({ showtime_id, discount_percentage });
    await newPromotion.save();
    res
      .status(201)
      .json({ message: "Thêm khuyến mãi thành công", promotion: newPromotion });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm khuyến mãi", error });
  }
};

// Cập nhật một khuyến mãi
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedPromotion) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy khuyến mãi cần cập nhật" });
    }

    res
      .status(200)
      .json({
        message: "Cập nhật khuyến mãi thành công",
        promotion: updatedPromotion,
      });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật khuyến mãi", error });
  }
};

// Xóa một khuyến mãi
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPromotion = await Promotion.findByIdAndDelete(id);

    if (!deletedPromotion) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy khuyến mãi cần xóa" });
    }

    res.status(200).json({ message: "Xóa khuyến mãi thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa khuyến mãi", error });
  }
};

module.exports = {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
