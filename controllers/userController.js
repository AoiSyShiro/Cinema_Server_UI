const User = require("../models/User");
const bcrypt = require("bcrypt");

// Hàm đăng ký người dùng
const register = async (req, res) => {
  const { full_name, phone_number, email, password } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!full_name || !phone_number || !email || !password) {
    console.log(
      "Lỗi: Dữ liệu đầu vào không hợp lệ. Tất cả các trường là bắt buộc."
    );
    return res.status(400).json({
      error: "Dữ liệu đầu vào không hợp lệ",
      message: "Tất cả các trường là bắt buộc",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`Lỗi: Email "${email}" đã tồn tại.`);
      return res.status(400).json({
        error: "Dữ liệu đầu vào không hợp lệ",
        message: "Email đã tồn tại",
      });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Mã hóa mật khẩu cho người dùng "${full_name}".`);

    const newUser = new User({
      email,
      password: hashedPassword,
      phone: phone_number,
      username: full_name,
    });

    await newUser.save();
    console.log(`Tạo tài khoản thành công cho người dùng "${full_name}".`);

    // Trả về phản hồi
    return res.status(201).json({
      id: newUser.user_id,
      full_name: newUser.username,
      phone_number: newUser.phone,
      email: newUser.email,
      active: true,
      deflag: false,
      created_at: newUser.created_at.toISOString(),
      updated_at: newUser.created_at.toISOString(),
    });
  } catch (error) {
    console.error("Lỗi hệ thống:", error);
    return res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      message: "Đã xảy ra lỗi không mong muốn",
    });
  }
};

// Hàm đăng nhập người dùng
const login = async (req, res) => {
  const { email, password } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!email || !password) {
    console.log(
      "Lỗi: Dữ liệu đầu vào không hợp lệ. Email và mật khẩu là bắt buộc."
    );
    return res.status(400).json({
      error: "Dữ liệu đầu vào không hợp lệ",
      message: "Email và mật khẩu là bắt buộc",
    });
  }

  try {
    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Lỗi: Người dùng với email "${email}" không tồn tại.`);
      return res.status(400).json({
        error: "Dữ liệu đầu vào không hợp lệ",
        message: "Người dùng không tồn tại",
      });
    }

    console.log(`Người dùng tìm thấy: ${user.username}, email: ${user.email}`);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Lỗi: Mật khẩu không đúng.");
      return res.status(400).json({
        error: "Dữ liệu đầu vào không hợp lệ",
        message: "Mật khẩu không đúng",
      });
    }

    console.log(`Đăng nhập thành công cho người dùng "${user.username}".`);

    return res.status(200).json({
      id: user.user_id,
      full_name: user.username,
      phone_number: user.phone,
      email: user.email,
      active: true,
    });
  } catch (error) {
    console.error("Lỗi hệ thống:", error);
    console.error("Chi tiết lỗi:", error.message);
    return res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      message: "Đã xảy ra lỗi không mong muốn",
    });
  }
};

// // Hàm thoát tài khoản
// const logout = async (req, res) => {
//   const token = req.headers["authorization"]?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({
//       error: "Không có quyền truy cập",
//       message: "Cần có token để xác thực",
//     });
//   }

//   try {
//     console.log(`Người dùng đã thoát tài khoản với token: ${token}`);

//     // logic để xử lý thoát tài khoản
//     return res.status(200).json({
//       message: "Đã thoát tài khoản thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi hệ thống:", error);
//     return res.status(500).json({
//       error: "Lỗi máy chủ nội bộ",
//       message: "Đã xảy ra lỗi không mong muốn",
//     });
//   }
// };

const changePassword = async (req, res) => {
  const { user_id, current_password, new_password } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!user_id || !current_password || !new_password) {
    return res.status(400).json({
      error: "Dữ liệu đầu vào không hợp lệ",
      message: "user_id, mật khẩu cũ và mật khẩu mới là bắt buộc",
    });
  }

  try {
    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id });
    if (!user) {
      console.error(`Người dùng không tồn tại với user_id: ${user_id}`);
      return res.status(404).json({
        error: "Người dùng không tồn tại",
        message: "Người dùng không tồn tại",
      });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      console.error(`Mật khẩu cũ không đúng cho user_id: ${user_id}`);
      return res.status(400).json({
        error: "Mật khẩu cũ không đúng",
        message: "Mật khẩu cũ không đúng",
      });
    }

    // Mã hóa mật khẩu mới
    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    return res.status(200).json({
      message: "Mật khẩu đã được thay đổi thành công",
    });
  } catch (error) {
    console.error("Lỗi hệ thống:", error);
    return res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      message: "Đã xảy ra lỗi không mong muốn",
    });
  }
};

//Cập nhật user
const updateUserInfo = async (req, res) => {
  try {
    // Lấy user_id từ tham số URL
    const { user_id } = req.params;

    // Lấy thông tin cập nhật từ body
    const { email, full_name, phone_number, address, age, gender, avatar_url } = req.body;

    // Log dữ liệu nhận được từ yêu cầu (để kiểm tra)
    console.log('Received data from app:', {
      user_id,
      email,
      full_name,
      phone_number,
      address,
      age,
      gender,
      avatar_url,
    });

    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cập nhật thông tin người dùng
    user.email = email || user.email;
    user.username = full_name || user.username;
    user.phone = phone_number || user.phone;
    user.address = address || user.address;
    user.age = age || user.age;
    user.gender = gender || user.gender;
    user.avatar_url = avatar_url || user.avatar_url;  // Cập nhật ảnh đại diện nếu có

    // Log thông tin người dùng sau khi cập nhật
    console.log('Updated user data:', {
      email: user.email,
      username: user.username,
      phone: user.phone,
      address: user.address,
      age: user.age,
      gender: user.gender,
      avatar_url: user.avatar_url,
    });

    // Lưu thông tin đã cập nhật
    await user.save();

    return res.status(200).json({ message: "User profile updated successfully" });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: "Error updating user profile" });
  }
};



// Hàm xóa người dùng
const deleteUser = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      error: "Dữ liệu đầu vào không hợp lệ",
      message: "ID người dùng là bắt buộc",
    });
  }

  try {
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(400).json({
        error: "Dữ liệu đầu vào không hợp lệ",
        message: "Người dùng không tồn tại",
      });
    }

    await User.deleteOne({ user_id });

    return res.status(200).json({
      message: "Người dùng đã được xóa thành công",
    });
  } catch (error) {
    console.error("Lỗi hệ thống:", error);
    return res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      message: "Đã xảy ra lỗi không mong muốn",
    });
  }
};

// Hàm lấy thông tin người dùng dựa vào user_id
const getUserInfo = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      error: "Dữ liệu đầu vào không hợp lệ",
      message: "ID người dùng là bắt buộc",
    });
  }

  try {
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({
        error: "Người dùng không tồn tại",
        message: `Không tìm thấy người dùng với ID: ${user_id}`,
      });
    }

    return res.status(200).json({
      id: user.user_id,
      full_name: user.username,
      phone_number: user.phone,
      email: user.email,
      age: user.age,
      gender: user.gender,
      address: user.address,
      avatar_url: user.avatar_url,
      created_at: user.created_at ? user.created_at.toISOString() : null,
      updated_at: user.updated_at ? user.updated_at.toISOString() : null,
    });
  } catch (error) {
    console.error("Lỗi hệ thống:", error);
    return res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      message: "Đã xảy ra lỗi không mong muốn",
    });
  }
};



module.exports = {
  register,
  login,
  // logout,
  changePassword,
  updateUserInfo,
  deleteUser,
  getUserInfo,
};
