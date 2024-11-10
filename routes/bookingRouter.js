const express = require("express");
const {
  getBookingHistory,
  searchBooking,
  getUserTicketHistory,
} = require("../controllers/BookingController");

const bookingRouter = express.Router();

// Lấy lịch sử đặt vé
bookingRouter.get("/", getBookingHistory);

// Tìm kiếm theo ID hoặc QR Code
bookingRouter.get("/search/:query", searchBooking);

// Lấy lịch sử vé của người dùng theo user_id
bookingRouter.get('/history/:user_id', getUserTicketHistory);

module.exports = bookingRouter;
