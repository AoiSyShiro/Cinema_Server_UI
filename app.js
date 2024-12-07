// Nhập các thư viện cần thiết
const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const session = require("express-session");
const bcrypt = require("bcrypt"); // Thêm bcrypt để mã hóa và so sánh mật khẩu

// Nhập các route của ứng dụng
const userRoutes = require("./routes/userRoutes");
const foodDrinkRoutes = require("./routes/foodDrinkRoutes");
const movieRoutes = require("./routes/movieRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const trailerRouter = require("./routes/trailerRouter");
const showtimeRouter = require("./routes/showtimeRouter");
const ticketBookingRouter = require("./routes/ticketBookingRouter");
const promotionRoutes = require("./routes/promotionRouter");
const reviewRoutes = require("./routes/reviewRouter");
const bookingRoutes = require("./routes/bookingRouter");
const paymentRouter = require("./routes/paymentRouter");
const dashboardRouter = require("./routes/dashboardRouter");
const cinemaRoomRoutes = require("./routes/cinemaRoomRoutes");

//Nhập PassWord
const forgotPasswordController = require("./controllers/forgotPasswordController");
const resetPasswordController = require("./controllers/resetPasswordController");

// Nhập các model của ứng dụng
const Movie = require("./models/Movie");
const Category = require("./models/Category");
const FoodDrink = require("./models/FoodDrink");
const Showtime = require("./models/Showtime");
const Promotion = require("./models/Promotion");
const Admin = require("./models/admin"); // Điều chỉnh đường dẫn nếu cần
const CinemaRoom = require('./models/CinemaRoom');  // Đảm bảo đường dẫn đúng với vị trí file CinemaRoom.js

// Nạp biến môi trường
require("dotenv").config();

// LOG Kiểm tra xem biến môi trường đã được nạp đúng chưa
console.log("Cloud Name: ", process.env.CLOUD_NAME);
console.log("API Key: ", process.env.API_KEY);
console.log("API Secret: ", process.env.API_SECRET);

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Cấu hình lưu trữ Cloudinary qua Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "movies",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage: storage });

// Khởi tạo ứng dụng Express
const app = express();
app.use(express.json()); // Middleware để xử lý JSON
app.use(express.urlencoded({ extended: true })); // Middleware để xử lý URL-encoded


// Middleware log thông tin request
const logRequestInfo = (req, res, next) => {
  const start = Date.now();
  const { method, path } = req;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  console.log("Thông tin yêu cầu:", method, path, ip, new Date().toISOString());

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      "Trạng thái phản hồi:",
      res.statusCode,
      "Thời gian xử lý (ms):",
      duration
    );
  });

  next();
};
app.use(logRequestInfo);

// Cấu hình session để lưu trữ thông tin đăng nhập
app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Đảm bảo secure: false nếu không dùng HTTPS
  })
);

// Cấu hình view engine là EJS
app.set("view engine", "ejs");

// Route trang chủ (kiểm tra đăng nhập)
app.get("/", (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/login"); // Nếu chưa đăng nhập, chuyển hướng về trang login
  }
  // Chuyển hướng về trang dashboard nếu đã đăng nhập
  res.redirect("/dashboard");
});

// Connect các router
app.use("/dashboard", dashboardRouter);
// Route trang login
app.get("/login", (req, res) => {
  res.render("login", { title: "Đăng nhập Quản trị viên", errorMessage: null });
});

// Cấu hình route
app.use("/reset-password", forgotPasswordController);
app.use("/reset-password", resetPasswordController);

// Route xử lý đăng nhập
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra nếu username hoặc password trống
  if (!username || !password) {
    return res.render("login", {
      title: "Đăng nhập Quản trị viên",
      errorMessage: "Vui lòng nhập đầy đủ thông tin.",
    });
  }

  try {
    // Tìm admin trong cơ sở dữ liệu
    const admin = await Admin.findOne({ username });

    // Nếu không tìm thấy admin, trả về thông báo lỗi
    if (!admin) {
      return res.render("login", {
        title: "Đăng nhập Quản trị viên",
        errorMessage: "Tài khoản không tồn tại.",
      });
    }

    // So sánh mật khẩu thô với mật khẩu trong DB
    if (password !== admin.password) {
      return res.render("login", {
        title: "Đăng nhập Quản trị viên",
        errorMessage: "Mật khẩu không chính xác.",
      });
    }

    // Lưu thông tin admin vào session và chuyển hướng tới trang chủ
    req.session.adminId = admin._id;
    res.redirect("/"); // Chuyển hướng sau khi đăng nhập thành công
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    res.render("login", {
      title: "Đăng nhập Quản trị viên",
      errorMessage: "Đã có lỗi xảy ra. Vui lòng thử lại.",
    });
  }
});


// Các route của ứng dụng
app.use("/auth", userRoutes);
app.use("/food-drinks", foodDrinkRoutes);
app.use("/movies", movieRoutes);
app.use("/categories", categoryRoutes);
app.use("/current", trailerRouter);
app.use("/showtimes", showtimeRouter);
app.use("/tickets", ticketBookingRouter);
app.use("/promotions", promotionRoutes);
app.use("/reviews", reviewRoutes);
app.use("/booking-history", bookingRoutes);
app.use("/payments", paymentRouter);
app.use("/cinema-rooms", cinemaRoomRoutes);

// Cổng mặc định và kết nối cơ sở dữ liệu
const PORT = process.env.PORT || 5000;
const connectToDatabase = require("./config/db.js");

// Hàm khởi động server
const startServer = async () => {
  await connectToDatabase(); // Kết nối cơ sở dữ liệu

  app.listen(PORT, async () => {
    console.log(`Server đang chạy ở cổng ${PORT}`);
    const open = await import("open");
    await open.default(`http://localhost:${PORT}`);
  });
};

startServer(); // Khởi chạy server

//Tương Tác Server

// Hiện thị Movie Web
app.get("/movies-admin", async (req, res) => {
  try {
    // Lấy tất cả các phim từ cơ sở dữ liệu
    const movies = await Movie.find();

    // Lấy tất cả danh mục thể loại từ cơ sở dữ liệu
    const categories = await Category.find();

    // Kết hợp thông tin tên thể loại vào mỗi phim
    const moviesWithCategories = movies.map((movie) => {
      // Tìm danh mục tương ứng dựa trên category_id của phim
      const category = categories.find(
        (cat) => cat.category_id === movie.category_id
      );

      // Trả về đối tượng phim với thông tin tên thể loại đã kết hợp
      return {
        ...movie.toObject(), // Sao chép các thuộc tính của đối tượng phim
        category: category ? category.name : "Không có danh mục", // Thêm tên danh mục hoặc giá trị mặc định
      };
    });

    // Kết xuất thông tin phim và danh mục ra giao diện view 'movies'
    res.render("movies", {
      movies: moviesWithCategories, // Danh sách phim đã kết hợp với tên thể loại
      categories: categories, // Danh sách tất cả danh mục thể loại
    });
  } catch (err) {
    // Xử lý lỗi khi lấy dữ liệu
    console.error("Lỗi khi lấy danh sách phim:", err);
    res.status(500).send("Lỗi khi lấy danh sách phim."); // Gửi phản hồi lỗi
  }
});

/// Route để thêm phim mới
app.post("/movies-admin", upload.single("image"), async (req, res) => {
  // Lấy thông tin phim từ request body
  const {
    title, // Tiêu đề phim
    description, // Mô tả phim
    trailer_url, // URL trailer
    category_id, // ID thể loại
    duration, // Thời lượng phim
    release_date, // Ngày phát hành
    coming_soon, // Trạng thái sắp chiếu
  } = req.body;

  // Lấy đường dẫn hình ảnh nếu có tải lên
  const image_url = req.file ? req.file.path : null;

  try {
    // Tạo đối tượng phim mới
    const movie = new Movie({
      title, // Tiêu đề
      description, // Mô tả
      trailer_url, // Trailer URL
      category_id, // ID thể loại
      duration, // Thời lượng
      release_date, // Ngày phát hành
      image_url, // Đường dẫn ảnh
      coming_soon: coming_soon === "on", // Nếu checkbox "sắp chiếu" được chọn
    });

    // Lưu phim vào cơ sở dữ liệu
    await movie.save();

    // Sau khi lưu thành công, chuyển hướng về trang quản lý phim
    res.redirect("/movies-admin");
  } catch (err) {
    // Xử lý lỗi trong quá trình thêm phim
    console.error(err);
    res.status(500).send("Lỗi khi thêm phim"); // Gửi thông báo lỗi về phía client
  }
});

// Route để xóa phim theo movie_id
app.get("/movies-admin/delete/:movie_id", async (req, res) => {
  // Lấy movie_id từ tham số URL
  const movieId = req.params.movie_id;

  try {
    // Tìm và xóa phim trong cơ sở dữ liệu dựa trên movie_id
    const movie = await Movie.findOneAndDelete({ movie_id: movieId });

    if (!movie) {
      // Nếu không tìm thấy phim có movie_id tương ứng
      // Trả về phản hồi với mã trạng thái 404 và thông báo lỗi
      return res.status(404).send("Phim không tồn tại");
    }

    // Nếu xóa thành công, chuyển hướng về trang quản lý phim
    res.redirect("/movies-admin");
  } catch (err) {
    // Ghi lỗi ra console để kiểm tra
    console.error("Lỗi khi xóa phim:", err);

    // Gửi phản hồi lỗi với mã trạng thái 500 về phía client
    res.status(500).send("Lỗi khi xóa phim");
  }
});

// Định nghĩa một route POST tại URL "/movies-admin/:id"
// Middleware `upload.single("image")` được sử dụng để xử lý file upload (trường "image")
app.post("/movies-admin/:id", upload.single("image"), async (req, res) => {
  // Lấy movieId từ tham số URL
  const movieId = req.params.id;

  // Trích xuất dữ liệu từ body của request
  const {
    title, // Tiêu đề phim
    description, // Mô tả phim
    trailer_url, // URL trailer phim
    category_id, // ID thể loại phim
    duration, // Thời lượng phim
    release_date, // Ngày phát hành
    coming_soon, // Cờ đánh dấu phim sắp ra mắt
  } = req.body;

  // Lấy đường dẫn file ảnh nếu có file được upload, nếu không thì gán null
  const image_url = req.file ? req.file.path : null;

  try {
    // Tìm bộ phim trong cơ sở dữ liệu theo movieId
    const movie = await Movie.findById(movieId);

    // Nếu không tìm thấy phim, trả về lỗi 404
    if (!movie) {
      return res.status(404).send("Phim không tồn tại");
    }

    // Cập nhật các trường thông tin của bộ phim
    movie.title = title; // Cập nhật tiêu đề
    movie.description = description; // Cập nhật mô tả
    movie.trailer_url = trailer_url; // Cập nhật URL trailer
    movie.category_id = category_id; // Cập nhật ID thể loại
    movie.duration = duration; // Cập nhật thời lượng
    movie.release_date = release_date; // Cập nhật ngày phát hành
    movie.coming_soon = coming_soon === "on"; // Chuyển đổi "on" thành boolean
    movie.image_url = image_url || movie.image_url; // Nếu không upload ảnh mới, giữ ảnh cũ

    // Lưu thay đổi vào cơ sở dữ liệu
    await movie.save();

    // Chuyển hướng về trang quản lý phim
    res.redirect("/movies-admin");
  } catch (err) {
    // Nếu xảy ra lỗi, log lỗi ra console và trả về lỗi 500
    console.error(err);
    res.status(500).send("Lỗi khi cập nhật phim");
  }
});

// Route hiển thị danh sách đồ ăn/đồ uống
app.get("/food-drinks-admin", async (req, res) => {
  try {
    const foodDrinks = await FoodDrink.find();
    res.render("fooddrink", { foodDrinks: foodDrinks });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đồ ăn/đồ uống:", err);
    res.status(500).send("Lỗi khi lấy danh sách đồ ăn/đồ uống.");
  }
});

// Route để thêm đồ ăn/đồ uống
app.post("/food-drinks-admin", upload.single("image"), async (req, res) => {
  const { name, type, price } = req.body;
  const image_url = req.file ? req.file.path : null;

  try {
    const foodDrink = new FoodDrink({
      name,
      type,
      price,
      image: image_url,
    });

    await foodDrink.save();
    res.redirect("/food-drinks-admin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi thêm đồ ăn/đồ uống");
  }
});

// Route xóa đồ ăn/đồ uống theo food_drink_id
app.get("/food-drinks-admin/delete/:food_drink_id", async (req, res) => {
  const foodDrinkId = req.params.food_drink_id; // Lấy food_drink_id từ URL

  try {
    // Tìm và xóa đồ ăn/đồ uống theo food_drink_id
    const foodDrink = await FoodDrink.findOneAndDelete({
      food_drink_id: foodDrinkId,
    });

    if (!foodDrink) {
      return res.status(404).send("Đồ ăn/đồ uống không tồn tại");
    }

    // Sau khi xóa thành công, chuyển hướng về trang quản lý đồ ăn/đồ uống
    res.redirect("/food-drinks-admin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi xóa đồ ăn/đồ uống");
  }
});

app.post("/food-drinks-admin/:id", upload.single("image"), async (req, res) => {
  const foodDrinkId = req.params.id; // Đây là `food_drink_id` (dạng số)

  const { name, type, price } = req.body;
  const priceNumber = price ? parseFloat(price) : null;
  const image_url = req.file ? req.file.path : null;

  try {
    // Tìm đồ ăn/đồ uống theo `food_drink_id` thay vì `_id`
    const foodDrink = await FoodDrink.findOne({ food_drink_id: foodDrinkId });

    if (!foodDrink) {
      return res.status(404).send("Đồ ăn/đồ uống không tồn tại");
    }

    // Cập nhật các trường nếu có dữ liệu mới
    foodDrink.name = name || foodDrink.name;
    foodDrink.type = type || foodDrink.type;
    foodDrink.price = priceNumber || foodDrink.price;

    if (image_url) {
      foodDrink.image = image_url;
    }

    await foodDrink.save();
    res.redirect("/food-drinks-admin"); // Chuyển hướng sau khi cập nhật thành công
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi cập nhật đồ ăn/đồ uống");
  }
});

app.get("/showtime-admin", async (req, res) => {
  try {
    // Lấy tất cả suất chiếu và phim dưới dạng plain object
    const showtimes = await Showtime.find().lean(); // Không cần populate nữa vì room_id là kiểu number
    const movies = await Movie.find().lean();
    const rooms = await CinemaRoom.find().lean(); // Lấy tất cả phòng chiếu từ CinemaRoom

    // Duyệt qua showtimes và bổ sung thông tin phim vào từng showtime
    const showtimesWithMovies = showtimes.map((showtime) => {
      // Tìm phim tương ứng với movie_id của showtime
      const movie = movies.find(
        (movie) => movie.movie_id === showtime.movie_id
      );

      // Trả về showtime đã được bổ sung thông tin movie
      return {
        ...showtime,
        movie: movie ? movie : { title: "Phim không xác định" },
        movie_id: showtime.movie_id,
      };
    });

    // Render view và truyền dữ liệu showtimesWithMovies, movies, rooms
    res.render("showtime", { showtimes: showtimesWithMovies, movies, rooms });
  } catch (error) {
    console.log(error);
    res.status(500).send("Lỗi server");
  }
});


// Route xử lý tạo suất chiếu mới
app.post("/showtime-admin/create", async (req, res) => {
  try {
    const { movie_id, start_time, room_id, ticket_price } = req.body;

    // Tạo mới suất chiếu với thông tin đã chọn
    const newShowtime = new Showtime({
      movie_id,
      start_time,
      room_id,  // room_id là kiểu Number, không cần phải chuyển đổi thành ObjectId
      ticket_price,
    });

    await newShowtime.save();

    res.redirect("/showtime-admin"); // Sau khi lưu thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi khi tạo suất chiếu");
  }
});


// Cập nhật suất chiếu theo showtime_id
app.post("/showtime-admin/update/:id", async (req, res) => {
  try {
    const showtimeId = req.params.id;  // Không cần chuyển kiểu, chỉ cần chuỗi

    const { movie_id, start_time, room_id, ticket_price } = req.body;

    // Tìm và cập nhật suất chiếu với room_id là Number (không phải ObjectId)
    const updatedShowtime = await Showtime.findOneAndUpdate(
      { showtime_id: showtimeId },
      { movie_id, start_time, room_id, ticket_price },  // room_id truyền vào như kiểu number
      { new: true }
    );

    if (!updatedShowtime) {
      return res.status(404).send("Không tìm thấy suất chiếu");
    }

    res.redirect("/showtime-admin"); // Sau khi cập nhật thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi khi cập nhật suất chiếu");
  }
});



// Xóa suất chiếu
app.get("/showtime-admin/delete/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Tìm và xóa suất chiếu theo showtime_id
    const deletedShowtime = await Showtime.findOneAndDelete({
      showtime_id: id,
    });

    if (!deletedShowtime) {
      return res.status(404).send("Không tìm thấy suất chiếu để xóa");
    }

    res.redirect("/showtime-admin"); // Sau khi xóa thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi khi xóa suất chiếu");
  }
});


// Lấy tất cả khuyến mãi
app.get("/promotions/:id", (req, res) => {
  const promotionId = req.params.id;
  Promotion.findById(promotionId, (err, promotion) => {
    if (err) {
      return res.status(500).send("Error retrieving promotion");
    }
    if (!promotion) {
      return res.status(404).send("Promotion not found");
    }
    res.render("promotionDetail", { promotion });
  });
});

// Tạo một khuyến mãi mới
app.post("/promotions", async (req, res) => {
  try {
    const { discount_percentage, discount_code } = req.body;

    if (!discount_percentage) {
      return res.status(400).json({
        message: "Discount percentage is required",
      });
    }

    const newPromotion = new Promotion({
      discount_percentage,
      discount_code, // Trường không bắt buộc
    });

    // Lưu khuyến mãi
    await newPromotion.save();
    res.redirect("/promotions"); // Chuyển hướng sau khi lưu thành công
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({
      message: "Error creating promotion",
      error: error.message,
    });
  }
});

// Cập nhật khuyến mãi
app.post("/promotions/:promotion_id", async (req, res) => {
  try {
    const { promotion_id } = req.params;
    const { discount_code, discount_percentage } = req.body;

    const promotion = await Promotion.findOne({ promotion_id });
    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tìm thấy" });
    }

    promotion.discount_code = discount_code || promotion.discount_code;
    promotion.discount_percentage =
      discount_percentage || promotion.discount_percentage;

    await promotion.save();

    res.redirect("/promotions");
  } catch (error) {
    console.error("Error updating promotion:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật khuyến mãi",
      error: error.message,
    });
  }
});

// Xóa khuyến mãi
app.delete("/promotions/:promotion_id", async (req, res) => {
  try {
    const { promotion_id } = req.params;
    const deletedPromotion = await Promotion.findOneAndDelete({ promotion_id });

    if (!deletedPromotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    // Sau khi xóa thành công, chuyển hướng về trang khuyến mãi
    res.redirect("/promotions");
  } catch (error) {
    console.error("Error deleting promotion:", error);
    res.status(500).json({
      message: "Error deleting promotion",
      error: error.message,
    });
  }
});

// Định nghĩa route trả về thời gian server theo múi giờ Việt Nam (GMT+7)
app.get("/get-server-time", (req, res) => {
  const options = {
    timeZone: "Asia/Ho_Chi_Minh", // Múi giờ Việt Nam
    hour12: false, // Định dạng 24 giờ
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  const serverTime = new Intl.DateTimeFormat("vi-VN", options).format(
    new Date()
  );
  res.json({ time: serverTime });
});
