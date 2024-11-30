const mongoose = require('mongoose');
const Admin = require('../models/admin'); // Đảm bảo đường dẫn chính xác tới mô hình admin
const bcrypt = require('bcrypt');

// Kết nối đến MongoDB
mongoose.connect('mongodb+srv://admin:admin12345@cinema-manager-app.c3xc2.mongodb.net/cinema_db?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Kết nối đến cơ sở dữ liệu thành công!");
}).catch(err => {
  console.error("Lỗi kết nối cơ sở dữ liệu:", err);
});

// Hàm tạo tài khoản admin mới
const createAdmin = async () => {
  const username = "admin"; // Tên đăng nhập
  const password = "admin123"; // Mật khẩu

  // Kiểm tra nếu admin đã tồn tại
  const existingAdmin = await Admin.findOne({ username });
  if (existingAdmin) {
    console.log('Tài khoản admin đã tồn tại!');
    mongoose.connection.close();
    return;
  }

  // Mã hóa mật khẩu và tạo tài khoản admin
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({
    username,
    password: hashedPassword
  });

  try {
    await admin.save();
    console.log('Tạo tài khoản admin thành công!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản admin:', error);
    mongoose.connection.close();
  }
};

// Gọi hàm tạo admin
createAdmin();
