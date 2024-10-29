const express = require("express");
const {
  getBookingHistory,
  searchBooking,
} = require("../controllers/BookingController");

const bookingRouter = express.Router();

// Lấy lịch sử đặt vé
bookingRouter.get("/", getBookingHistory);

// Tìm kiếm theo ID hoặc QR Code
bookingRouter.get("/search/:query", searchBooking);

module.exports = bookingRouter;
