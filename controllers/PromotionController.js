const Promotion = require("../models/Promotion");

// Lấy tất cả khuyến mãi và hiển thị chúng trên trang EJS
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find();
    res.render("promotion", { promotions });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).send("Error fetching promotions");
  }
};

// Tạo một khuyến mãi mới
const createPromotion = async (req, res) => {
  try {
    const { discount_percentage, discount_code } = req.body;

    // Kiểm tra trường bắt buộc
    if (!discount_percentage) {
      return res.status(400).json({
        message: "Discount percentage is required",
      });
    }

    const newPromotion = new Promotion({
      discount_percentage,
      discount_code, // Trường không bắt buộc
    });

    // Lưu khuyến mãi
    await newPromotion.save();
    res.redirect("/promotions"); // Chuyển hướng sau khi lưu thành công
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({
      message: "Error creating promotion",
      error: error.message,
    });
  }
};

const updatePromotion = async (req, res) => {
  try {
    const { promotion_id } = req.params; // Lấy promotion_id từ URL parameters
    const { discount_code, discount_percentage } = req.body;

    // Kiểm tra xem promotion_id có tồn tại trong cơ sở dữ liệu không
    const promotion = await Promotion.findOne({ promotion_id });
    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tìm thấy" });
    }

    // Cập nhật các trường thông tin khuyến mãi
    promotion.discount_code = discount_code || promotion.discount_code;
    promotion.discount_percentage =
      discount_percentage || promotion.discount_percentage;

    // Lưu lại thông tin đã cập nhật
    await promotion.save();

    res.redirect("/promotions"); // Sau khi cập nhật xong, chuyển hướng về danh sách khuyến mãi
  } catch (error) {
    console.error("Error updating promotion:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật khuyến mãi",
      error: error.message,
    });
  }
};

// Xóa khuyến mãi qua form
const deletePromotion = async (req, res) => {
  try {
    const { promotion_id } = req.params; // Lấy promotion_id từ URL parameters
    const deletedPromotion = await Promotion.findOneAndDelete({ promotion_id });

    if (!deletedPromotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.redirect("/promotions"); // Chuyển hướng sau khi xóa thành công
  } catch (error) {
    res.status(500).json({
      message: "Error deleting promotion",
      error: error.message,
    });
  }
};

// Check Giảm giá trên APP
const countPromotions = async (req, res) => {
  const { code } = req.params;
  try {
    const promotion = await Promotion.findOne({ discount_code: code }, 'discount_percentage');
    if (!promotion) {
      return res.status(404).json({ message: "Mã giảm giá không tồn tại." });
    }
    res.json({ discount_percentage: promotion.discount_percentage });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server.", error: error.message });
  }
};


module.exports = {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  countPromotions,
};
