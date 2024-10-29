const Category = require("../models/Category");

// Lấy danh sách thể loại
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra khi lấy danh sách thể loại", error });
  }
};

// Thêm thể loại
const addCategory = async (req, res) => {
  const { name, description } = req.body;

  // Kiểm tra xem trường name có tồn tại không
  if (!name) {
    return res.status(400).json({ message: "Tên thể loại là bắt buộc." });
  }

  try {
    // Tạo mới một đối tượng Category
    const newCategory = new Category({
      name,
      description,
    });

    // Lưu vào cơ sở dữ liệu
    await newCategory.save();
    // Trả về phản hồi thành công
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Lỗi khi thêm thể loại:", error);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: error.message });
  }
};

// Cập nhật thể loại theo category_id
const updateCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id); // Chuyển đổi category_id sang số nguyên

  try {
    const category = await Category.findOne({ category_id: categoryId });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy thể loại" });
    }

    // Cập nhật thông tin thể loại
    category.name = req.body.name || category.name;
    category.description = req.body.description || category.description;

    // Cập nhật thời gian chỉnh sửa
    category.updated_at = Date.now();

    // Lưu thể loại vào cơ sở dữ liệu
    await category.save();

    res.json({ message: "Chỉnh sửa thể loại thành công!", category });
  } catch (error) {
    console.error("Error during update:", error);
    res.status(500).json({ message: "Lỗi khi chỉnh sửa thể loại", error });
  }
};

// Xóa thể loại theo category_id
const deleteCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id); // Chuyển đổi category_id sang số nguyên

  try {
    const category = await Category.findOneAndDelete({
      category_id: categoryId,
    });
    if (!category) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thể loại để xóa" });
    }
    res.json({ message: "Xóa thể loại thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa thể loại", error });
  }
};

module.exports = {
  addCategory,
  updateCategory,
  deleteCategory,
  getCategories,
};
