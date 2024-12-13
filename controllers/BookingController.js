const BookTickets = require("../models/BookTickets"); 
const User = require("../models/User");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const FoodDrinkModel = require("../models/FoodDrink");

// Hàm lấy lịch sử đặt vé
const getBookingHistory = async (req, res) => {
  try {
    // Lấy tất cả các vé đã đặt từ cơ sở dữ liệu
    const bookings = await BookTickets.find();
    const users = await User.find(); // Lấy danh sách tất cả người dùng
    const movies = await Movie.find(); // Lấy danh sách tất cả phim
    const showtimes = await Showtime.find(); // Lấy danh sách tất cả suất chiếu
    const foodItems = await FoodDrinkModel.find(); // Lấy danh sách tất cả đồ ăn/uống

    // Kiểm tra nếu không có vé nào
    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    // Xử lý dữ liệu từng vé đã đặt để bổ sung thông tin chi tiết
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Đảm bảo food_drinks là một mảng
        const foodDrinks = Array.isArray(booking.food_drinks) ? booking.food_drinks : [];

        // Lấy thông tin người dùng, phim và suất chiếu dựa trên ID
        const user = await User.findOne({ user_id: booking.user_id });
        const movie = await Movie.findOne({ movie_id: booking.movie_id });
        const showtime = await Showtime.findOne({ showtime_id: booking.showtime_id });

        // Lấy thông tin chi tiết đồ ăn/uống đã đặt
        const foodDetails = await Promise.all(
          foodDrinks.map(async (foodItem) => {
            const food = await FoodDrinkModel.findOne({ food_drink_id: foodItem.food_drink_id });
            return {
              name: food ? food.name : "Không Có Đặt Food", // Tên đồ ăn
              price: food ? food.price : 0, // Giá đồ ăn
              quantity: foodItem.quantity || 0, // Số lượng đặt
              total: food ? food.price * (foodItem.quantity || 0) : 0, // Tổng giá
            };
          })
        );

        // Tính tổng tiền của các món ăn/uống
        const foodTotal = foodDetails.reduce((acc, item) => acc + item.total, 0);

        // Trả về dữ liệu chi tiết của từng vé
        return {
          ...booking.toObject(), // Chuyển dữ liệu vé sang đối tượng
          user: user ? user.username : "N/A", // Tên người dùng
          movie: movie ? movie.title : "N/A", // Tên phim
          showtime: showtime 
            ? `${showtime.start_time.toLocaleString()} - Room: ${showtime.room_id}` // Thời gian và phòng chiếu
            : "N/A",
          booking_time: booking.booking_time || "N/A", // Thời gian đặt vé
          payment_method: booking.payment_method || "N/A", // Phương thức thanh toán
          price: booking.price || 0, // Giá vé
          food_drinks: foodDetails, // Chi tiết đồ ăn/uống
          food_total: foodTotal, // Tổng tiền đồ ăn/uống
        };
      })
    );

    // Hiển thị trang lịch sử đặt vé với dữ liệu đã xử lý
    res.render("bookingHistory", { 
      bookings: bookingsWithDetails, // Dữ liệu chi tiết từng vé
      users: users,  // Danh sách người dùng
      movies: movies, // Danh sách phim
      showtimes: showtimes, // Danh sách suất chiếu
      foodItems: foodItems, // Danh sách đồ ăn/uống
    });
  } catch (err) {
    // Xử lý lỗi nếu có
    console.error("Error fetching booking history:", err);
    res.status(500).send("Error fetching booking history.");
  }
};

// Hàm lấy lịch sử vé của người dùng dựa trên user_id
const getUserTicketHistory = async (req, res) => {
  try {
    const { user_id } = req.params; // Lấy user_id từ tham số URL

    // Kiểm tra xem user_id có hợp lệ không
    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({ message: "user_id không hợp lệ" });
    }

    // Tìm tất cả vé của user_id, sắp xếp theo thời gian đặt vé mới nhất
    const tickets = await BookTickets.find({ user_id: Number(user_id) })
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
        // Lấy thông tin người dùng từ bảng User
        const user = await User.findOne({ user_id: ticket.user_id });

        // Lấy thông tin suất chiếu từ bảng Showtime
        const showtime = await Showtime.findOne({
          showtime_id: ticket.showtime_id, // Cập nhật với showtime_id
        });

        // Lấy thông tin phim từ bảng Movie
        const movie = await Movie.findOne({
          movie_id: showtime ? showtime.movie_id : null, // Cập nhật với movie_id
        });

        // Lấy thông tin các món ăn/đồ uống đã chọn
        let foodDrinks = [];
        let foodTotal = 0;
        if (ticket.food_drinks && ticket.food_drinks.length > 0) {
          foodDrinks = await FoodDrinkModel.find({
            food_drink_id: {
              $in: ticket.food_drinks.map((fd) => fd.food_drink_id),
            },
          });

          // Tính tổng giá trị đồ ăn/thức uống
          foodTotal = ticket.food_drinks.reduce((total, fd) => {
            const food = foodDrinks.find(
              (item) => item.food_drink_id === fd.food_drink_id
            );
            return total + (food ? food.price * fd.quantity : 0);
          }, 0);
        }

        // Trả về dữ liệu chi tiết cho từng vé
        return {
          ...ticket.toObject(), // Chuyển đổi vé thành đối tượng
          book_tickets_id: ticket.book_tickets_id
            ? ticket.book_tickets_id
            : "N/A", // Nếu không có book_tickets_id, trả về "N/A"
          user: {
            username: user ? user.username : "N/A", // Tên người dùng từ bảng User
            email: user ? user.email : "N/A", // Email người dùng
          },
          showtime: {
            start_time: showtime ? showtime.start_time : "N/A", // Thời gian suất chiếu
            room: showtime ? showtime.room : "N/A", // Phòng chiếu
            price: showtime ? showtime.ticket_price : "N/A", // Giá vé suất chiếu
          },
          movie: {
            title: movie ? movie.title : "N/A", // Tên phim
            description: movie ? movie.description : "N/A", // Mô tả phim
            trailer_url: movie ? movie.trailer_url : "N/A", // URL trailer phim
            image_url: movie ? movie.image_url : "N/A", // URL hình ảnh phim
          },
          food_drinks: foodDrinks.map((item) => ({
            name: item.name, // Tên món ăn/uống
            quantity: ticket.food_drinks.find(
              (fd) => fd.food_drink_id === item.food_drink_id
            ).quantity, // Số lượng món ăn/uống
            price: item.price, // Giá của món ăn/uống
          })),
          food_total: foodTotal, // Tổng giá trị đồ ăn/uống
          price: ticket.price, // Giá vé từ ticket
        };
      })
    );

    // Trả về danh sách vé đã đặt
    res.status(200).json(ticketDetails);
  } catch (error) {
    // Xử lý lỗi nếu có
    res.status(500).json({ message: "Lỗi khi lấy lịch sử đặt vé", error });
  }
};


// Hàm tìm kiếm vé đặt theo email người dùng
const searchBookings = async (req, res) => {
  try {
    const { email } = req.query; // Lấy email từ query params

    // Kiểm tra nếu không có email trong query
    if (!email) {
      return res.render("booking-list", {
        errorMessage: "Email is required",
        bookings: [],
      });
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email: email });

    // Nếu không tìm thấy người dùng, trả về lỗi
    if (!user) {
      return res.render("booking-list", {
        errorMessage: "User not found",
        bookings: [],
      });
    }

    // Tìm tất cả booking của user_id
    const bookings = await BookTickets.find({ user_id: user.user_id });

    // Nếu không tìm thấy vé đặt, trả về lỗi
    if (bookings.length === 0) {
      return res.render("booking-list", {
        errorMessage: "No bookings found for this user",
        bookings: [],
      });
    }

    // Lấy thông tin chi tiết các vé đặt
    const bookingDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Lấy thông tin phim từ model Movie dựa trên movie_id của booking
        const movie = await Movie.findOne({ movie_id: booking.movie_id });

        // Lấy thông tin lịch chiếu từ model Showtime dựa trên showtime_id của booking
        const showtime = await Showtime.findOne({ showtime_id: booking.showtime_id });

        // Nếu không tìm thấy thông tin lịch chiếu, set giá trị mặc định là "N/A"
        const showtimeDetails = showtime ? {
          date: showtime.date || "N/A", // Ngày lịch chiếu
          time: showtime.time || "N/A", // Giờ lịch chiếu
        } : { date: "N/A", time: "N/A" };

        // Lấy thông tin món ăn/thức uống từ model FoodDrink dựa trên food_drink_id
        const foodDetails = await Promise.all(
          booking.food_drinks.map(async (foodItem) => {
            const food = await FoodDrinkModel.findOne({ food_drink_id: foodItem.food_drink_id });
            return {
              name: food ? food.name : "Không Có Đặt Food",
              price: food ? food.price : 0,
              quantity: foodItem.quantity || 0,
              total: food ? food.price * (foodItem.quantity || 0) : 0,
            };
          })
        );

        // Tính tổng giá trị đồ ăn/thức uống
        const foodTotal = foodDetails.reduce((acc, item) => acc + item.total, 0);

        // Thêm thông tin chi tiết vào booking
        return {
          ...booking.toObject(),
          movie: movie ? movie.title : "N/A", // Tiêu đề phim
          booking_time: booking.booking_time || "N/A", // Thời gian đặt vé
          payment_method: booking.payment_method || "N/A", // Hình thức thanh toán
          price: booking.price || 0, // Giá vé
          food_drinks: foodDetails, // Danh sách món ăn/thức uống
          food_total: foodTotal, // Tổng giá trị đồ ăn/thức uống
          showtime: showtimeDetails, // Thông tin lịch chiếu
        };
      })
    );

    // Render kết quả tìm kiếm vào view EJS
    res.render("booking-list", { bookings: bookingDetails, errorMessage: null });

  } catch (err) {
    console.error("Error searching booking:", err);
    res.render("booking-list", {
      errorMessage: "Đã có lỗi xảy ra trong quá trình tìm kiếm.",
      bookings: [],
    });
  }
};


module.exports = { getBookingHistory, getUserTicketHistory, searchBookings };
