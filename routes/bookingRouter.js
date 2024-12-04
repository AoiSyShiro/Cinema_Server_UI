const express = require("express");
const {
  getBookingHistory,
  searchBookings,
  getUserTicketHistory,
} = require("../controllers/BookingController");

const bookingRouter = express.Router();

// Lấy lịch sử đặt vé
bookingRouter.get("/", getBookingHistory);


// Lấy lịch sử vé của người dùng theo user_id
bookingRouter.get('/history/:user_id', getUserTicketHistory);

// Route tìm kiếm vé theo book_tickets_id
bookingRouter.get('/search-bookings', searchBookings);

module.exports = bookingRouter;
