const express = require("express");
const {
  bookTicket,
  getAllTickets,
  cancelTicket,
} = require("../controllers/TicketBookingController");

const router = express.Router();

// Route: Đặt vé xem phim
router.post("/book", bookTicket);

// Route: Hiển thị tất cả vé đã đặt
router.get("/", getAllTickets);

// Route: Hủy vé theo ID
router.put("/cancel/:id", cancelTicket);

module.exports = router;
