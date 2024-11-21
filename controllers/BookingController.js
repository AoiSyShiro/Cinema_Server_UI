const BookTickets = require("../models/BookTickets");
const User = require("../models/User");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie"); // Thêm Movie model để lấy thông tin phim
const FoodDrink = require("../models/FoodDrink"); // Đảm bảo FoodDrink model tồn tại nếu cần

const getBookingHistory = async (req, res) => {
  try {
    // Lấy tất cả các vé đặt
    const bookings = await BookTickets.find();

    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    // Duyệt qua từng vé và lấy thêm thông tin chi tiết từ User, Movie, Showtime
    const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
      // Lấy thông tin người dùng từ model User dựa trên user_id
      const user = await User.findOne({ user_id: booking.user_id });
      
      // Lấy thông tin phim từ model Movie dựa trên movie_id
      const movie = await Movie.findOne({ movie_id: booking.movie_id });

      // Lấy thông tin lịch chiếu từ model Showtime dựa trên showtime_id
      const showtime = await Showtime.findOne({ showtime_id: booking.showtime_id });

      // Trả về thông tin booking đã được bổ sung với các chi tiết
      return {
        ...booking.toObject(),
        user: user ? user.username : 'N/A', // Tên người dùng
        movie: movie ? movie.title : 'N/A', // Tiêu đề phim
        showtime: showtime ? showtime.time : 'N/A', // Thời gian chiếu
        payment_method: booking.payment_method || 'N/A' // Hình thức thanh toán
      };
    }));

    // Render kết quả lên view EJS
    res.render('bookingHistory', { bookings: bookingsWithDetails });
  } catch (err) {
    console.error("Error fetching booking history:", err);
    res.status(500).send("Error fetching booking history.");
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
      "start_time room ticket_price movie_id"
    );

    // Lấy thông tin phim từ movie_id trong showtime
    const movie = await Movie.findOne({
      movie_id: showtime ? showtime.movie_id : null,
    });

    res.status(200).json({
      ...booking._doc,
      user,
      showtime,
      movie: movie ? { movie_id: movie.movie_id, title: movie.title } : null, // Trả về thông tin phim
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm vé", error });
  }
};

// Hiển thị lịch sử đặt vé của user_id
const getUserTicketHistory = async (req, res) => {
  try {
    const { user_id } = req.params; // Lấy user_id từ URL params

    // Kiểm tra xem user_id có hợp lệ không
    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({ message: "user_id không hợp lệ" });
    }

    // Tìm tất cả vé của user_id (filter theo user_id)
    const tickets = await BookTickets.find({ user_id: Number(user_id) }) // Sử dụng Number(user_id) để truy vấn đúng kiểu dữ liệu
      .sort({ booking_time: -1 }); // Sắp xếp vé theo thời gian đặt vé mới nhất trước

    // Nếu không có vé nào, trả về thông báo
    if (tickets.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch sử vé cho người dùng này" });
    }

    // Nếu có vé, trả về danh sách vé với thông tin cần thiết
    const ticketDetails = await Promise.all(
      tickets.map(async (ticket) => {
        // Lấy thông tin người dùng từ bảng User (nếu cần)
        const user = await User.findOne({ user_id: ticket.user_id });

        // Lấy thông tin suất chiếu từ bảng Showtime
        const showtime = await Showtime.findOne({
          showtime_id: ticket.showtime_id,
        });

        // Lấy thông tin phim từ bảng Movie
        const movie = await Movie.findOne({
          movie_id: showtime ? showtime.movie_id : null,
        });

        // Lấy thông tin các món ăn/đồ uống đã chọn
        let foodDrinks = [];
        if (ticket.food_drinks && ticket.food_drinks.length > 0) {
          foodDrinks = await FoodDrink.find({
            food_drink_id: {
              $in: ticket.food_drinks.map((fd) => fd.food_drink_id),
            },
          });
        }

        return {
          ...ticket.toObject(),
          user: {
            name: user ? user.name : "N/A",
            email: user ? user.email : "N/A",
          },
          showtime: {
            start_time: showtime ? showtime.start_time : "N/A",
            room: showtime ? showtime.room : "N/A",
            ticket_price: showtime ? showtime.ticket_price : "N/A",
          },
          movie: {
            title: movie ? movie.title : "N/A", // Tên phim
            description: movie ? movie.description : "N/A", // Mô tả phim
            trailer_url: movie ? movie.trailer_url : "N/A", // URL trailer phim
            image_url: movie ? movie.image_url : "N/A", // Hình ảnh phim
          },
          food_drinks: foodDrinks, // Thông tin món ăn/đồ uống
        };
      })
    );

    // Trả về danh sách vé đã đặt
    res.status(200).json(ticketDetails);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử đặt vé", error });
  }
};

module.exports = { getBookingHistory, getUserTicketHistory, searchBooking };
