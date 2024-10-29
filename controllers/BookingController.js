const BookTickets = require("../models/BookTickets");
const User = require("../models/User");
const Showtime = require("../models/Showtime");

// Lấy lịch sử đặt vé
const getBookingHistory = async (req, res) => {
  try {
    const bookings = await BookTickets.find();

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const user = await User.findOne(
          { user_id: booking.user_id },
          "name email"
        );
        const showtime = await Showtime.findOne(
          { showtime_id: booking.showtime_id },
          "start_time room ticket_price"
        );

        return {
          ...booking._doc,
          user,
          showtime,
        };
      })
    );

    res.status(200).json(bookingsWithDetails);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử đặt vé", error });
  }
};

// Tìm kiếm lịch sử đặt vé theo ID hoặc QR Code
const searchBooking = async (req, res) => {
  try {
    const { query } = req.params;

    const booking = await BookTickets.findOne({
      $or: [{ book_tickets_id: Number(query) }, { qr_code: query }],
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy vé" });
    }

    // Manually populate user and showtime details
    const user = await User.findOne({ user_id: booking.user_id }, "name email");
    const showtime = await Showtime.findOne(
      { showtime_id: booking.showtime_id },
      "start_time room ticket_price"
    );

    res.status(200).json({
      ...booking._doc,
      user,
      showtime,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm vé", error });
  }
};

module.exports = { getBookingHistory, searchBooking };
