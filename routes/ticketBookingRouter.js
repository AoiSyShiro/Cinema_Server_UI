const express = require("express");
const {
  bookTicket,
  getUserTicketHistory,
  cancelTicket,
} = require("../controllers/TicketBookingController");

const router = express.Router();

// Route: Đặt vé xem phim
router.post("/book", bookTicket);

// Route: Hủy vé theo ID
router.put("/cancel/:id", cancelTicket);

module.exports = router;
