// ========================== Import các thư viện cần thiết ==========================

const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const session = require("express-session");
const bcrypt = require("bcrypt"); // Thư viện để mã hóa và so sánh mật khẩu
require("dotenv").config(); // Nạp biến môi trường

// ========================== Import các route của ứng dụng ==========================

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
const dashboardRouter = require("./routes/dashboardRouter");
const cinemaRoomRoutes = require("./routes/cinemaRoomRoutes");

// ========================== Import các controller và model của ứng dụng ==========================

// Import các controller liên quan đến mật khẩu
const forgotPasswordController = require("./controllers/forgotPasswordController");
const resetPasswordController = require("./controllers/resetPasswordController");

// Import các model của ứng dụng
const Movie = require("./models/Movie");
const Category = require("./models/Category");
const FoodDrink = require("./models/FoodDrink");
const Showtime = require("./models/Showtime");
const Promotion = require("./models/Promotion");
const Admin = require("./models/admin"); // Điều chỉnh đường dẫn nếu cần
const CinemaRoom = require("./models/CinemaRoom"); // Đảm bảo đường dẫn đúng với vị trí file CinemaRoom.js

// ========================== Cấu hình Cloudinary và Multer ==========================

// Kiểm tra biến môi trường (dành cho mục đích debug)
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

// ========================== Khởi tạo ứng dụng Express ==========================

const app = express();

app.use(express.json()); // Middleware để xử lý JSON
app.use(express.urlencoded({ extended: true })); // Middleware để xử lý URL-encoded

// ========================== Middleware log thông tin request ==========================

app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.on('finish', () => {
    const timeStamp = formatDateTime(new Date()); // Lấy thời gian khi phản hồi hoàn thành
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    console.log(
      `[${timeStamp}] ${ip} ${method} ${originalUrl} ${statusCode} ${duration}ms`
    );
  });

  next();
});

function formatDateTime(date) {
  const padZero = (num) => num.toString().padStart(2, '0');

  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1); // Tháng bắt đầu từ 0
  const year = date.getFullYear();
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const seconds = padZero(date.getSeconds());

  // Mảng các thứ trong tuần bằng tiếng Việt
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const weekday = weekdays[date.getDay()];

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${weekday}`;
}

// ========================== Cấu hình Session ==========================

app.use(
  session({
    secret: "secret_key", // Nên đặt secret_key trong biến môi trường
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Đảm bảo secure: false nếu không dùng HTTPS
  })
);

// ========================== Cấu hình View Engine là EJS ==========================

app.set("view engine", "ejs");

// ========================== Các Route của Ứng dụng ==========================

// Route trang chủ (kiểm tra đăng nhập)
app.get("/", (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/login"); // Nếu chưa đăng nhập, chuyển hướng về trang login
  }
  // Chuyển hướng về trang dashboard nếu đã đăng nhập
  res.redirect("/dashboard");
});

// Route trang login
app.get("/login", (req, res) => {
  res.render("login", { title: "Đăng nhập Quản trị viên", errorMessage: null });
});

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

// Cấu hình route cho reset mật khẩu
app.use("/reset-password", forgotPasswordController);
app.use("/reset-password", resetPasswordController);

// Kết nối các router của ứng dụng
app.use("/dashboard", dashboardRouter);
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
app.use("/cinema-rooms", cinemaRoomRoutes);

// ========================== Kết nối cơ sở dữ liệu và khởi động server ==========================

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

// ========================== Các Route Quản lý phim ==========================

// Hiện thị trang quản lý phim
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

// Route để thêm phim mới
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
    console.error("Lỗi khi thêm phim:", err);
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

// Route để cập nhật phim
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
    console.error("Lỗi khi cập nhật phim:", err);
    res.status(500).send("Lỗi khi cập nhật phim");
  }
});

// ========================== Các Route Quản lý đồ ăn/đồ uống ==========================

// Hiển thị danh sách đồ ăn/đồ uống
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
    console.error("Lỗi khi thêm đồ ăn/đồ uống:", err);
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
    console.error("Lỗi khi xóa đồ ăn/đồ uống:", err);
    res.status(500).send("Lỗi khi xóa đồ ăn/đồ uống");
  }
});

// Cập nhật đồ ăn/đồ uống
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
    console.error("Lỗi khi cập nhật đồ ăn/đồ uống:", err);
    res.status(500).send("Lỗi khi cập nhật đồ ăn/đồ uống");
  }
});

// ========================== Các Route Quản lý suất chiếu ==========================

// Hiển thị danh sách suất chiếu
app.get("/showtime-admin", async (req, res) => {
  try {
    // Lấy tất cả suất chiếu và phim dưới dạng plain object
    const showtimes = await Showtime.find().lean();
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
    console.error("Lỗi khi lấy danh sách suất chiếu:", error);
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
      room_id,
      ticket_price,
    });

    await newShowtime.save();

    res.redirect("/showtime-admin"); // Sau khi lưu thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error("Lỗi khi tạo suất chiếu:", error);
    res.status(500).send("Lỗi khi tạo suất chiếu");
  }
});

// Cập nhật suất chiếu theo showtime_id
app.post("/showtime-admin/update/:id", async (req, res) => {
  try {
    const showtimeId = req.params.id;

    const { movie_id, start_time, room_id, ticket_price } = req.body;

    // Tìm và cập nhật suất chiếu
    const updatedShowtime = await Showtime.findOneAndUpdate(
      { showtime_id: showtimeId },
      { movie_id, start_time, room_id, ticket_price },
      { new: true }
    );

    if (!updatedShowtime) {
      return res.status(404).send("Không tìm thấy suất chiếu");
    }

    res.redirect("/showtime-admin"); // Sau khi cập nhật thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error("Lỗi khi cập nhật suất chiếu:", error);
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
    console.error("Lỗi khi xóa suất chiếu:", error);
    res.status(500).send("Lỗi khi xóa suất chiếu");
  }
});

// ========================== Các Route Quản lý khuyến mãi ==========================

// Lấy thông tin khuyến mãi theo ID
app.get("/promotions/:id", async (req, res) => {
  const promotionId = req.params.id;
  try {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return res.status(404).send("Khuyến mãi không tồn tại");
    }
    res.render("promotionDetail", { promotion });
  } catch (err) {
    console.error("Lỗi khi lấy thông tin khuyến mãi:", err);
    res.status(500).send("Lỗi khi lấy thông tin khuyến mãi");
  }
});

// Tạo một khuyến mãi mới
app.post("/promotions", async (req, res) => {
  try {
    const { discount_percentage, discount_code } = req.body;

    if (!discount_percentage) {
      return res.status(400).json({
        message: "Vui lòng nhập phần trăm giảm giá",
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
    console.error("Lỗi khi tạo khuyến mãi:", error);
    res.status(500).json({
      message: "Lỗi khi tạo khuyến mãi",
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
    console.error("Lỗi khi cập nhật khuyến mãi:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật khuyến mãi",
      error: error.message,
    });
  }
});

// Xóa khuyến mãi
app.get("/promotions/delete/:promotion_id", async (req, res) => {
  try {
    const { promotion_id } = req.params;
    const deletedPromotion = await Promotion.findOneAndDelete({ promotion_id });

    if (!deletedPromotion) {
      return res.status(404).json({ message: "Khuyến mãi không tồn tại" });
    }

    // Sau khi xóa thành công, chuyển hướng về trang khuyến mãi
    res.redirect("/promotions");
  } catch (error) {
    console.error("Lỗi khi xóa khuyến mãi:", error);
    res.status(500).json({
      message: "Lỗi khi xóa khuyến mãi",
      error: error.message,
    });
  }
});

// ========================== Route lấy thời gian server theo múi giờ Việt Nam ==========================

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
