const BookTickets = require("../models/BookTickets");
const Showtime = require("../models/Showtime");
const mongoose = require("mongoose");

// Đặt vé xem phim
const bookTicket = async (req, res) => {
    try {
      const {
        user_id,
        showtime_id,
        seats,
        ticket_quantity,
        food_drink,
        payment_method,
      } = req.body;
  
      // Kiểm tra suất chiếu có tồn tại không (sử dụng Number để tìm kiếm)
      const showtime = await Showtime.findOne({ showtime_id: showtime_id });
      if (!showtime) {
        return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
      }
  
      // Tạo vé mới
      const newTicket = new BookTickets({
        user_id,
        showtime_id: showtime.showtime_id, // Giữ nguyên kiểu Number
        payment_method,
        qr_code: generateQRCode(),
        flag: 1,
      });
  
      const savedTicket = await newTicket.save();
      res.status(201).json({
        message: "Đặt vé thành công",
        ticket: savedTicket,
        seats,
        food_drink,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi đặt vé", error });
    }
  };
  

// Hàm tạo mã QR ngẫu nhiên (ví dụ)
const generateQRCode = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Hiển thị danh sách vé đã đặt
const getAllTickets = async (req, res) => {
  try {
    const tickets = await BookTickets.find()
      .populate("user_id", "name email")
      .populate("showtime_id", "start_time room ticket_price");
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách vé", error });
  }
};

// Hủy vé theo ID
const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const canceledTicket = await BookTickets.findByIdAndUpdate(
      id,
      { flag: 0 }, // Đánh dấu vé đã hủy
      { new: true }
    );

    if (!canceledTicket) {
      return res.status(404).json({ message: "Không tìm thấy vé để hủy" });
    }

    res.status(200).json({ message: "Hủy vé thành công", ticket: canceledTicket });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hủy vé", error });
  }
};

module.exports = { bookTicket, getAllTickets, cancelTicket };
