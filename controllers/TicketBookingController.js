const BookTickets = require("../models/BookTickets");
const Showtime = require("../models/Showtime");
const mongoose = require("mongoose");
const User = require("../models/User");
const FoodDrink = require("../models/FoodDrink");

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
      room_name, // Lưu room_name dưới dạng text
    } = req.body;

    // Kiểm tra thông tin người dùng
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra suất chiếu có tồn tại không
    const showtime = await Showtime.findOne({ showtime_id });
    if (!showtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    }

    // Đảm bảo reserved_seats là một mảng
    if (!Array.isArray(showtime.reserved_seats)) {
      showtime.reserved_seats = [];
    }

    // Kiểm tra xem ghế đã được đặt chưa
    const alreadyReserved = seats.some((seat) =>
      showtime.reserved_seats.includes(seat)
    );
    if (alreadyReserved) {
      return res
        .status(400)
        .json({
          message: "Một hoặc nhiều ghế đã được đặt, vui lòng chọn ghế khác.",
        });
    }

    // Kiểm tra và lấy thông tin các món ăn/đồ uống đã chọn
    let selectedFoodDrinks = [];
    if (food_drinks && food_drinks.length > 0) {
      selectedFoodDrinks = await FoodDrink.find({
        food_drink_id: { $in: food_drinks.map((item) => item.food_drink_id) },
      });
      // Kiểm tra nếu có ID nào không hợp lệ
      if (selectedFoodDrinks.length !== food_drinks.length) {
        return res
          .status(400)
          .json({ message: "Một hoặc nhiều món ăn/đồ uống không tồn tại." });
      }
    }

    // Tính giá vé
    let totalPrice = price; // Trường hợp này giả sử giá đã được truyền lên từ client

    // Tạo vé mới với thông tin các món ăn/đồ uống đã chọn và số lượng
    const newTicket = new BookTickets({
      user_id,
      showtime_id,
      movie_id: showtime.movie_id, // Lấy movie_id từ showtime
      payment_method,
      qr_code: generateQRCode(), // Giả sử bạn có hàm này
      flag: 1, // Đặt mặc định là đã thanh toán thành công
      seats, // Lưu thông tin ghế đã chọn
      food_drinks: food_drinks.map((item) => ({
        food_drink_id: item.food_drink_id,
        quantity: item.quantity,
      })),
      price: totalPrice, // Lưu giá vé
      room_name, // Lưu room_name dưới dạng text
    });

    // Cập nhật danh sách ghế đã đặt trong Showtime
    showtime.reserved_seats = [...showtime.reserved_seats, ...seats];
    await showtime.save();

    const savedTicket = await newTicket.save();

    res.status(201).json({
      message: "Đặt vé thành công",
      ticket: savedTicket,
      seats,
      food_drinks: selectedFoodDrinks, // Trả về thông tin các món ăn/đồ uống và số lượng
      price: totalPrice, // Trả về giá vé đã tính
      room_name, // Trả về room_name
    });
  } catch (error) {
    console.error("Lỗi khi đặt vé:", error); // Log chi tiết lỗi
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
