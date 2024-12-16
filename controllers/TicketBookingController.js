const BookTickets = require("../models/BookTickets");
const Showtime = require("../models/Showtime");
const mongoose = require("mongoose");
const User = require("../models/User");
const FoodDrink = require("../models/FoodDrink");

const nodemailer = require("nodemailer"); //XLGM

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MYGMAIL, // Sử dụng biến MYGMAIL từ .env
    pass: process.env.MYPASS, // Sử dụng biến MYPASS từ .env
  },
});

// Đặt vé xem phim
const bookTicket = async (req, res) => {
  try {
    const {
      user_id,
      showtime_id,
      seats,
      food_drinks,
      payment_method,
      price,
      room_name,
    } = req.body;

    // Kiểm tra thông tin người dùng
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra email
    if (!user.email) {
      return res.status(400).json({ message: "Email của người dùng không tồn tại hoặc không hợp lệ." });
    }

    // Kiểm tra suất chiếu
    const showtime = await Showtime.findOne({ showtime_id });
    if (!showtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    }

    if (!Array.isArray(showtime.reserved_seats)) {
      showtime.reserved_seats = [];
    }

    // Kiểm tra ghế đã được đặt chưa
    const alreadyReserved = seats.some((seat) =>
      showtime.reserved_seats.includes(seat)
    );
    if (alreadyReserved) {
      return res.status(400).json({
        message: "Một hoặc nhiều ghế đã được đặt, vui lòng chọn ghế khác.",
      });
    }

    // Kiểm tra món ăn/đồ uống
    let selectedFoodDrinks = [];
    if (food_drinks && food_drinks.length > 0) {
      selectedFoodDrinks = await FoodDrink.find({
        food_drink_id: { $in: food_drinks.map((item) => item.food_drink_id) },
      });

      if (selectedFoodDrinks.length !== food_drinks.length) {
        return res.status(400).json({
          message: "Một hoặc nhiều món ăn/đồ uống không tồn tại trong hệ thống.",
        });
      }
    }

    // Tạo vé mới
    const newTicket = new BookTickets({
      user_id,
      showtime_id,
      movie_id: showtime.movie_id,
      payment_method,
      qr_code: generateQRCode(),
      flag: 1,
      seats,
      food_drinks: food_drinks.map((item) => ({
        food_drink_id: item.food_drink_id,
        quantity: item.quantity,
      })),
      price,
      room_name,
    });

    // Cập nhật ghế đã đặt
    showtime.reserved_seats = [...showtime.reserved_seats, ...seats];
    await showtime.save();

    const savedTicket = await newTicket.save();

    // Chuẩn bị nội dung email
    const seatList = seats.join(", ");
    const foodList = selectedFoodDrinks
      .map((item, index) => `${item.name} (x${food_drinks[index].quantity})`)
      .join(", ");
    const emailContent = `
      <h2>Thông tin vé xem phim</h2>
      <p><strong>Tên người dùng:</strong> ${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Tên phòng chiếu:</strong> ${room_name}</p>
      <p><strong>Ghế:</strong> ${seatList}</p>
      <p><strong>Món ăn/Đồ uống:</strong> ${foodList || "Không"}</p>
      <p><strong>Tổng giá:</strong> ${price} VND</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `;

    const mailOptions = {
      from: process.env.MYGMAIL,
      to: user.email,
      subject: "Xác nhận đặt vé xem phim",
      html: emailContent,
    };

    console.log("Mail Options:", mailOptions);

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Lỗi khi gửi email:", error);
      return res.status(500).json({ message: "Lỗi khi gửi email", error: error.message });
    }

    res.status(201).json({
      message: "Đặt vé thành công",
      ticket: savedTicket,
      seats,
      food_drinks: selectedFoodDrinks,
      price,
      room_name,
    });
  } catch (error) {
    console.error("Lỗi khi đặt vé:", error);
    res.status(500).json({ message: "Lỗi khi đặt vé", error: error.message });
  }
};


// Hàm tạo mã QR ngẫu nhiên (ví dụ)
const generateQRCode = () => {
  return Math.random().toString(36).substring(2, 15);
};

// // Hủy vé theo ID
// const cancelTicket = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const canceledTicket = await BookTickets.findByIdAndUpdate(
//       id,
//       { flag: 0 }, // Đánh dấu vé đã hủy
//       { new: true }
//     );

//     if (!canceledTicket) {
//       return res.status(404).json({ message: "Không tìm thấy vé để hủy" });
//     }

//     res
//       .status(200)
//       .json({ message: "Hủy vé thành công", ticket: canceledTicket });
//   } catch (error) {
//     res.status(500).json({ message: "Lỗi khi hủy vé", error });
//   }
// };

module.exports = { bookTicket };
//cancelTicket
