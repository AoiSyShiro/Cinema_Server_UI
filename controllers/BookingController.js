const BookTickets = require("../models/BookTickets"); 
const User = require("../models/User");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const FoodDrinkModel = require("../models/FoodDrink");

const getBookingHistory = async (req, res) => {
  try {
    // Fetch all bookings
    const bookings = await BookTickets.find();
    const users = await User.find();  // Fetch all users from the User collection
    const movies = await Movie.find(); // Fetch all movies
    const showtimes = await Showtime.find(); // Fetch all showtimes
    const foodItems = await FoodDrinkModel.find(); // Fetch all food/drink items

    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    // Process bookings to include user, movie, showtime, and food items
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Ensure food_drinks is an array
        const foodDrinks = Array.isArray(booking.food_drinks) ? booking.food_drinks : [];

        // Fetch the related user, movie, and showtime by their IDs
        const user = await User.findOne({ user_id: booking.user_id });
        const movie = await Movie.findOne({ movie_id: booking.movie_id });
        const showtime = await Showtime.findOne({ showtime_id: booking.showtime_id });

        // Fetch food details for each food item in the booking
        const foodDetails = await Promise.all(
          foodDrinks.map(async (foodItem) => {
            const food = await FoodDrinkModel.findOne({ food_drink_id: foodItem.food_drink_id });
            return {
              name: food ? food.name : "Không Có Đặt Food",
              price: food ? food.price : 0,
              quantity: foodItem.quantity || 0,
              total: food ? food.price * (foodItem.quantity || 0) : 0,
            };
          })
        );

        // Calculate the total price of the food
        const foodTotal = foodDetails.reduce((acc, item) => acc + item.total, 0);

        return {
          ...booking.toObject(),
          user: user ? user.username : "N/A",
          movie: movie ? movie.title : "N/A",
          showtime: showtime 
            ? `${showtime.start_time.toLocaleString()} - Room: ${showtime.room_id}`
            : "N/A",
          booking_time: booking.booking_time || "N/A",
          payment_method: booking.payment_method || "N/A",
          price: booking.price || 0,
          food_drinks: foodDetails,
          food_total: foodTotal,
        };
      })
    );

    // Render the booking history view with the populated data
    res.render("bookingHistory", { 
      bookings: bookingsWithDetails,
      users: users,  // Pass the list of users to the view
      movies: movies, // Pass the list of movies to the view
      showtimes: showtimes, // Pass the list of showtimes to the view
      foodItems: foodItems, // Pass the list of food items to the view
    });
  } catch (err) {
    console.error("Error fetching booking history:", err);
    res.status(500).send("Error fetching booking history.");
  }
};


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
        // Lấy thông tin người dùng từ bảng User
        const user = await User.findOne({ user_id: ticket.user_id });

        // Lấy thông tin suất chiếu từ bảng Showtime
        const showtime = await ShowTime.findOne({
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

        return {
          ...ticket.toObject(),
          book_tickets_id: ticket.book_tickets_id
            ? ticket.book_tickets_id
            : "N/A",
          user: {
            username: user ? user.username : "N/A", // Hiển thị tên người dùng từ model User
            email: user ? user.email : "N/A",
          },
          showtime: {
            start_time: showtime ? showtime.start_time : "N/A",
            room: showtime ? showtime.room : "N/A",
            price: showtime ? showtime.ticket_price : "N/A", // Sử dụng ticket_price từ Showtime
          },
          movie: {
            title: movie ? movie.title : "N/A", // Tên phim
            description: movie ? movie.description : "N/A", // Mô tả phim
            trailer_url: movie ? movie.trailer_url : "N/A", // URL trailer phim
            image_url: movie ? movie.image_url : "N/A", // Hình ảnh phim
          },
          food_drinks: foodDrinks.map((item) => ({
            name: item.name,
            quantity: ticket.food_drinks.find(
              (fd) => fd.food_drink_id === item.food_drink_id
            ).quantity,
            price: item.price,
          })), // Danh sách món ăn/thức uống với tên và số lượng
          food_total: foodTotal, // Tổng giá trị đồ ăn/thức uống
          price: ticket.price, // Thêm thông tin giá vé từ ticket
        };
      })
    );

    // Trả về danh sách vé đã đặt
    res.status(200).json(ticketDetails);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử đặt vé", error });
  }
};


const searchBookings = async (req, res) => {
  try {
    const { book_tickets_id } = req.query; // Lấy book_tickets_id từ query params

    if (!book_tickets_id) {
      return res.status(400).json({ message: "book_tickets_id is required" });
    }

    // Tìm BookTicket theo book_tickets_id
    const booking = await BookTickets.findOne({ book_tickets_id: Number(book_tickets_id) });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Lấy thông tin người dùng từ model User dựa trên user_id
    const user = await User.findOne({ user_id: booking.user_id });

    // Lấy thông tin phim từ model Movie dựa trên movie_id
    const movie = await Movie.findOne({ movie_id: booking.movie_id });

    // Lấy thông tin lịch chiếu từ model Showtime dựa trên showtime_id
    const showtime = await ShowTime.findOne({ showtime_id: booking.showtime_id });

    // Lấy thông tin đồ ăn/thức uống từ model FoodDrink dựa trên food_drink_id
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
    const bookingWithDetails = {
      ...booking.toObject(),
      user: user ? user.username : "N/A", // Tên người dùng
      movie: movie ? movie.title : "N/A", // Tiêu đề phim
      booking_time: booking.booking_time || "N/A", // Thời gian đặt vé
      payment_method: booking.payment_method || "N/A", // Hình thức thanh toán
      price: booking.price || 0, // Giá tiền
      food_drinks: foodDetails, // Danh sách món ăn/thức uống với tên và số lượng
      food_total: foodTotal, // Tổng giá trị đồ ăn/thức uống
    };

    // Render kết quả tìm kiếm vào view EJS
    res.render("booking-list", { bookings: [bookingWithDetails] });

  } catch (err) {
    console.error("Error searching booking:", err);
    res.status(500).send("Error searching booking.");
  }
};




module.exports = { getBookingHistory, getUserTicketHistory, searchBookings };
