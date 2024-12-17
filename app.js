// ========================== Import các thư viện cần thiết ==========================

const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const session = require("express-session");
const bcrypt = require("bcrypt"); // Thư viện để mã hóa và so sánh mật khẩu
require("dotenv").config(); // Nạp biến môi trường
const os = require("os");

// ========================== Import các route của ứng dụng ==========================

const userRoutes = require("./routes/userRoutes");
const foodDrinkRoutes = require("./routes/foodDrinkRoutes");
const movieRoutes = require("./routes/movieRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const trailerRouter = require("./routes/trailerRouter");
const showtimeRouter = require("./routes/showtimeRouter");
const ticketBookingRouter = require("./routes/ticketBookingRouter");
const promotionRoutes = require("./routes/promotionRouter");
// const reviewRoutes = require("./routes/reviewRouter");
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
const BookTickets = require("./models/BookTickets");

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
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  res.on("finish", () => {
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
  const padZero = (num) => num.toString().padStart(2, "0");

  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1); // Tháng bắt đầu từ 0
  const year = date.getFullYear();
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const seconds = padZero(date.getSeconds());

  // Mảng các thứ trong tuần bằng tiếng Việt
  const weekdays = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const weekday = weekdays[date.getDay()];

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${weekday}`;
}

console.log("Local IP Address:", getLocalIP());

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
// app.use("/reviews", reviewRoutes);
app.use("/booking-history", bookingRoutes);
app.use("/cinema-rooms", cinemaRoomRoutes);

// ========================== Kết nối cơ sở dữ liệu và khởi động server ==========================

const PORT = process.env.PORT || 3000;

const connectToDatabase = require("./config/db.js");

const startServer = async () => {
  try {
    await connectToDatabase(); // Kết nối cơ sở dữ liệu

    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server đang chạy tại cổng:${PORT}`);

      // Chỉ mở trình duyệt sau khi server khởi động thành công
      const open = await import("open");
      await open.default(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi khi khởi động server:", error);
  }
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
    const foodDrinks = await FoodDrink.find(); // Lấy toàn bộ danh sách đồ ăn/đồ uống từ cơ sở dữ liệu
    res.render("fooddrink", { foodDrinks: foodDrinks }); // Hiển thị danh sách đồ ăn/đồ uống trên giao diện "fooddrink"
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đồ ăn/đồ uống:", err); // Ghi log lỗi nếu xảy ra vấn đề khi truy vấn dữ liệu
    res.status(500).send("Lỗi khi lấy danh sách đồ ăn/đồ uống."); // Phản hồi lỗi đến người dùng
  }
});

// Route để thêm đồ ăn/đồ uống
app.post("/food-drinks-admin", upload.single("image"), async (req, res) => {
  const { name, type, price } = req.body; // Lấy dữ liệu tên, loại, giá từ yêu cầu gửi lên
  const image_url = req.file ? req.file.path : null; // Nếu có hình ảnh tải lên, lấy đường dẫn ảnh

  try {
    const foodDrink = new FoodDrink({
      name, // Tên đồ ăn/đồ uống
      type, // Loại (đồ ăn hoặc đồ uống)
      price, // Giá
      image: image_url, // Đường dẫn hình ảnh
    });

    await foodDrink.save(); // Lưu đối tượng đồ ăn/đồ uống mới vào cơ sở dữ liệu
    res.redirect("/food-drinks-admin"); // Chuyển hướng về trang danh sách đồ ăn/đồ uống
  } catch (err) {
    console.error("Lỗi khi thêm đồ ăn/đồ uống:", err); // Ghi log lỗi nếu có vấn đề khi lưu
    res.status(500).send("Lỗi khi thêm đồ ăn/đồ uống"); // Phản hồi lỗi đến người dùng
  }
});

// Route xóa đồ ăn/đồ uống theo food_drink_id
app.get("/food-drinks-admin/delete/:food_drink_id", async (req, res) => {
  const foodDrinkId = req.params.food_drink_id; // Lấy food_drink_id từ URL

  try {
    // Tìm và xóa đồ ăn/đồ uống dựa trên food_drink_id
    const foodDrink = await FoodDrink.findOneAndDelete({
      food_drink_id: foodDrinkId, // Điều kiện xóa theo food_drink_id
    });

    if (!foodDrink) {
      return res.status(404).send("Đồ ăn/đồ uống không tồn tại"); // Phản hồi lỗi nếu không tìm thấy
    }

    // Nếu xóa thành công, chuyển hướng về trang quản lý đồ ăn/đồ uống
    res.redirect("/food-drinks-admin");
  } catch (err) {
    console.error("Lỗi khi xóa đồ ăn/đồ uống:", err); // Ghi log lỗi nếu xảy ra vấn đề
    res.status(500).send("Lỗi khi xóa đồ ăn/đồ uống"); // Phản hồi lỗi đến người dùng
  }
});

// Route cập nhật đồ ăn/đồ uống
app.post("/food-drinks-admin/:id", upload.single("image"), async (req, res) => {
  const foodDrinkId = req.params.id; // Lấy food_drink_id từ URL

  const { name, type, price } = req.body; // Lấy thông tin cần cập nhật từ body
  const priceNumber = price ? parseFloat(price) : null; // Chuyển giá thành số (nếu có)
  const image_url = req.file ? req.file.path : null; // Lấy đường dẫn hình ảnh (nếu có)

  try {
    // Tìm đồ ăn/đồ uống theo food_drink_id
    const foodDrink = await FoodDrink.findOne({ food_drink_id: foodDrinkId });

    if (!foodDrink) {
      return res.status(404).send("Đồ ăn/đồ uống không tồn tại"); // Phản hồi lỗi nếu không tìm thấy
    }

    // Cập nhật thông tin nếu có dữ liệu mới
    foodDrink.name = name || foodDrink.name; // Nếu không có dữ liệu mới, giữ nguyên giá trị cũ
    foodDrink.type = type || foodDrink.type;
    foodDrink.price = priceNumber || foodDrink.price;

    if (image_url) {
      foodDrink.image = image_url; // Cập nhật đường dẫn ảnh mới (nếu có)
    }

    await foodDrink.save(); // Lưu thay đổi vào cơ sở dữ liệu
    res.redirect("/food-drinks-admin"); // Chuyển hướng sau khi cập nhật thành công
  } catch (err) {
    console.error("Lỗi khi cập nhật đồ ăn/đồ uống:", err); // Ghi log lỗi nếu có vấn đề
    res.status(500).send("Lỗi khi cập nhật đồ ăn/đồ uống"); // Phản hồi lỗi đến người dùng
  }
});

// ========================== Các Route Quản lý suất chiếu ==========================

// Hiển thị danh sách suất chiếu
app.get("/showtime-admin", async (req, res) => {
  try {
    // Lấy tất cả suất chiếu và phim dưới dạng plain object
    const showtimes = await Showtime.find().lean(); // Lấy danh sách suất chiếu từ cơ sở dữ liệu
    const movies = await Movie.find().lean(); // Lấy danh sách phim từ cơ sở dữ liệu
    const rooms = await CinemaRoom.find().lean(); // Lấy danh sách phòng chiếu từ cơ sở dữ liệu

    // Duyệt qua từng suất chiếu và bổ sung thông tin phim vào từng suất chiếu
    const showtimesWithMovies = showtimes.map((showtime) => {
      // Tìm phim có movie_id khớp với movie_id trong showtime
      const movie = movies.find(
        (movie) => movie.movie_id === showtime.movie_id
      );

      // Trả về thông tin suất chiếu kèm thông tin phim hoặc thông báo nếu không tìm thấy phim
      return {
        ...showtime, // Giữ nguyên các thông tin suất chiếu
        movie: movie ? movie : { title: "Phim không xác định" }, // Thêm thông tin phim hoặc thông báo
        movie_id: showtime.movie_id, // Bảo toàn movie_id của suất chiếu
      };
    });

    // Render giao diện "showtime" với các dữ liệu đã chuẩn bị
    res.render("showtime", {
      showtimes: showtimesWithMovies, // Danh sách suất chiếu kèm thông tin phim
      movies, // Danh sách tất cả phim
      rooms, // Danh sách tất cả phòng chiếu
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách suất chiếu:", error); // Ghi log lỗi nếu xảy ra vấn đề
    res.status(500).send("Lỗi server"); // Phản hồi lỗi đến người dùng
  }
});

// Route xử lý tạo suất chiếu mới
app.post("/showtime-admin/create", async (req, res) => {
  try {
    const { movie_id, start_time, room_id, ticket_price } = req.body; // Lấy thông tin từ form

    // Tạo mới suất chiếu dựa trên thông tin nhận được
    const newShowtime = new Showtime({
      movie_id, // ID phim
      start_time, // Thời gian bắt đầu chiếu
      room_id, // ID phòng chiếu
      ticket_price, // Giá vé
    });

    await newShowtime.save(); // Lưu suất chiếu mới vào cơ sở dữ liệu

    res.redirect("/showtime-admin"); // Sau khi lưu thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error("Lỗi khi tạo suất chiếu:", error); // Ghi log lỗi nếu xảy ra vấn đề
    res.status(500).send("Lỗi khi tạo suất chiếu"); // Phản hồi lỗi đến người dùng
  }
});

// Cập nhật suất chiếu theo showtime_id
app.post("/showtime-admin/update/:id", async (req, res) => {
  try {
    const showtimeId = req.params.id; // Lấy showtime_id từ URL

    const { movie_id, start_time, room_id, ticket_price } = req.body; // Lấy thông tin từ form

    // Tìm suất chiếu theo showtime_id và cập nhật thông tin mới
    const updatedShowtime = await Showtime.findOneAndUpdate(
      { showtime_id: showtimeId }, // Điều kiện tìm suất chiếu
      { movie_id, start_time, room_id, ticket_price }, // Dữ liệu cần cập nhật
      { new: true } // Trả về dữ liệu sau khi cập nhật
    );

    if (!updatedShowtime) {
      return res.status(404).send("Không tìm thấy suất chiếu"); // Thông báo lỗi nếu không tìm thấy
    }

    res.redirect("/showtime-admin"); // Sau khi cập nhật thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error("Lỗi khi cập nhật suất chiếu:", error); // Ghi log lỗi nếu có vấn đề
    res.status(500).send("Lỗi khi cập nhật suất chiếu"); // Phản hồi lỗi đến người dùng
  }
});

// Xóa suất chiếu
app.get("/showtime-admin/delete/:id", async (req, res) => {
  try {
    const id = Number(req.params.id); // Lấy showtime_id từ URL và chuyển sang số

    // Tìm và xóa suất chiếu dựa trên showtime_id
    const deletedShowtime = await Showtime.findOneAndDelete({
      showtime_id: id, // Điều kiện tìm suất chiếu
    });

    if (!deletedShowtime) {
      return res.status(404).send("Không tìm thấy suất chiếu để xóa"); // Thông báo lỗi nếu không tìm thấy
    }

    res.redirect("/showtime-admin"); // Sau khi xóa thành công, chuyển hướng về danh sách suất chiếu
  } catch (error) {
    console.error("Lỗi khi xóa suất chiếu:", error); // Ghi log lỗi nếu xảy ra vấn đề
    res.status(500).send("Lỗi khi xóa suất chiếu"); // Phản hồi lỗi đến người dùng
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
      discount_code,
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

// Lấy thông tin khuyến mãi theo ID
app.get("/promotions/:id", async (req, res) => {
  const promotionId = req.params.id; // Lấy ID khuyến mãi từ URL
  try {
    const promotion = await Promotion.findById(promotionId); // Tìm khuyến mãi theo ID
    if (!promotion) {
      return res.status(404).send("Khuyến mãi không tồn tại"); // Nếu không tìm thấy, phản hồi lỗi
    }
    res.render("promotionDetail", { promotion }); // Hiển thị thông tin khuyến mãi
  } catch (err) {
    console.error("Lỗi khi lấy thông tin khuyến mãi:", err); // Ghi log lỗi nếu xảy ra vấn đề
    res.status(500).send("Lỗi khi lấy thông tin khuyến mãi"); // Phản hồi lỗi đến người dùng
  }
});

// Tạo một khuyến mãi mới
app.post("/promotions", async (req, res) => {
  try {
    const { discount_percentage, discount_code } = req.body; // Lấy dữ liệu từ form

    if (!discount_percentage) {
      return res.status(400).json({
        message: "Vui lòng nhập phần trăm giảm giá", // Yêu cầu nhập nếu thiếu phần trăm giảm giá
      });
    }

    const newPromotion = new Promotion({
      discount_percentage, // Phần trăm giảm giá
      discount_code, // Mã giảm giá (không bắt buộc)
    });

    await newPromotion.save(); // Lưu khuyến mãi vào cơ sở dữ liệu
    res.redirect("/promotions"); // Chuyển hướng về danh sách khuyến mãi sau khi lưu thành công
  } catch (error) {
    console.error("Lỗi khi tạo khuyến mãi:", error); // Ghi log lỗi nếu xảy ra vấn đề
    res.status(500).json({
      message: "Lỗi khi tạo khuyến mãi", // Phản hồi lỗi đến người dùng
      error: error.message, // Hiển thị thông báo lỗi chi tiết
    });
  }
});

// Cập nhật khuyến mãi
app.post("/promotions/:promotion_id", async (req, res) => {
  try {
    const { promotion_id } = req.params; // Lấy ID khuyến mãi từ URL
    const { discount_code, discount_percentage } = req.body; // Lấy dữ liệu từ form

    const promotion = await Promotion.findOne({ promotion_id }); // Tìm khuyến mãi theo promotion_id
    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tìm thấy" }); // Nếu không tìm thấy, phản hồi lỗi
    }

    // Cập nhật các trường nếu có dữ liệu mới
    promotion.discount_code = discount_code || promotion.discount_code;
    promotion.discount_percentage =
      discount_percentage || promotion.discount_percentage;

    await promotion.save(); // Lưu thay đổi vào cơ sở dữ liệu

    res.redirect("/promotions"); // Chuyển hướng về danh sách khuyến mãi sau khi cập nhật thành công
  } catch (error) {
    console.error("Lỗi khi cập nhật khuyến mãi:", error); // Ghi log lỗi nếu xảy ra vấn đề
    res.status(500).json({
      message: "Lỗi khi cập nhật khuyến mãi", // Phản hồi lỗi đến người dùng
      error: error.message, // Hiển thị thông báo lỗi chi tiết
    });
  }
});

// ========================== Route lấy thời gian server theo múi giờ Việt Nam ==========================

// Route để lấy thời gian hiện tại của server
app.get("/get-server-time", (req, res) => {
  const options = {
    timeZone: "Asia/Ho_Chi_Minh", // Thiết lập múi giờ là Việt Nam
    hour12: false, // Sử dụng định dạng giờ 24 giờ
    year: "numeric", // Hiển thị năm đầy đủ
    month: "2-digit", // Hiển thị tháng với 2 chữ số (01-12)
    day: "2-digit", // Hiển thị ngày với 2 chữ số (01-31)
    hour: "2-digit", // Hiển thị giờ với 2 chữ số (00-23)
    minute: "2-digit", // Hiển thị phút với 2 chữ số (00-59)
    second: "2-digit", // Hiển thị giây với 2 chữ số (00-59)
  };

  const serverTime = new Intl.DateTimeFormat("vi-VN", options).format(
    new Date() // Lấy thời gian hiện tại của server
  );
  res.json({ time: serverTime }); // Gửi phản hồi dạng JSON chứa thời gian hiện tại
});

// ========================== Route để lấy danh sách suất chiếu của một phim cụ thể Server ==========================
app.get("/get-showtimes/:movieId", async (req, res) => {
  const movieId = req.params.movieId; // Lấy movie_id từ URL

  // Tìm tất cả suất chiếu liên quan đến movie_id
  const showtimes = await Showtime.find({ movie_id: movieId });

  // Duyệt qua các suất chiếu và bổ sung thông tin ghế đã đặt
  const showtimesWithReservedSeats = showtimes.map((showtime) => {
    return {
      showtime_id: showtime.showtime_id, // ID của suất chiếu
      start_time: showtime.start_time, // Thời gian bắt đầu suất chiếu
      room_id: showtime.room_id, // ID phòng chiếu
      reserved_seats: showtime.reserved_seats, // Dữ liệu ghế đã được đặt trước
    };
  });

  res.json(showtimesWithReservedSeats); // Gửi danh sách suất chiếu cùng thông tin ghế đã đặt
});

// ========================== Route xử lý đặt vé Server ==========================

// Route xử lý đặt vé
app.post("/book-ticket", async (req, res) => {
  try {
    console.log(req.body); // In ra thông tin trong body của yêu cầu để kiểm tra dữ liệu được gửi từ client
    const {
      user_id,
      showtime_id,
      seats,
      food_drinks,
      payment_method,
      price,
      movie_id,
    } = req.body;

    // Kiểm tra các trường thông tin bắt buộc
    // Nếu bất kỳ trường nào bị thiếu, trả về phản hồi với mã lỗi 400
    if (
      !user_id ||
      !showtime_id ||
      !seats ||
      !movie_id ||
      !payment_method ||
      !price
    ) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Tìm suất chiếu theo showtime_id
    // Dùng `findOne` để kiểm tra xem suất chiếu có tồn tại hay không
    const showtime = await Showtime.findOne({ showtime_id });
    if (!showtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    }

    // Xử lý thông tin đồ ăn/uống (food_drinks)
    // Nếu trường food_drinks được gửi kèm, tìm danh sách đồ ăn/uống dựa trên các ID
    let selectedFoodDrinks = [];
    if (food_drinks && food_drinks.length > 0) {
      selectedFoodDrinks = await FoodDrink.find({
        food_drink_id: { $in: food_drinks.split(",") }, // Giả định food_drinks là chuỗi các ID phân cách bằng dấu phẩy
      });
    }

    // Tính tổng giá vé
    // Biến `price` có thể là chuỗi, vì vậy cần chuyển đổi thành số nguyên bằng parseInt
    let totalPrice = parseInt(price, 10); // Giá trị mặc định nếu price không hợp lệ sẽ là NaN

    // Tạo một đối tượng vé mới từ model BookTickets
    // Lưu thông tin người dùng, suất chiếu, ghế ngồi, đồ ăn/uống, phương thức thanh toán và giá vé
    const newTicket = new BookTickets({
      user_id, // ID của người dùng đặt vé
      movie_id, // ID phim mà người dùng đặt vé
      showtime_id, // ID của suất chiếu
      seats: seats.split(","), // Chuyển chuỗi ghế thành mảng (phân tách bằng dấu phẩy)
      food_drinks: selectedFoodDrinks.map((item) => ({
        food_drink_id: item.food_drink_id, // ID của đồ ăn/uống
        quantity: 1, // Giả định số lượng là 1, có thể cập nhật logic nếu cần
      })),
      payment_method, // Phương thức thanh toán mà người dùng chọn
      price: totalPrice, // Tổng giá trị thanh toán của vé
    });

    // Lưu vé vào cơ sở dữ liệu
    const savedTicket = await newTicket.save();

    // Cập nhật danh sách ghế đã đặt trong suất chiếu
    // Ghép danh sách ghế mới vào mảng reserved_seats của suất chiếu hiện tại
    showtime.reserved_seats = [...showtime.reserved_seats, ...seats.split(",")]; // Đảm bảo danh sách ghế không bị ghi đè
    await showtime.save(); // Lưu lại thay đổi của suất chiếu vào cơ sở dữ liệu

    // Trả về phản hồi thành công với mã 201 và thông tin vé đã được lưu
    res.status(201).json({
      message: "Đặt vé thành công", // Thông báo đặt vé thành công
      ticket: savedTicket, // Thông tin chi tiết về vé vừa được tạo
    });
  } catch (error) {
    // Xử lý lỗi trong quá trình đặt vé
    console.error("Lỗi khi tạo vé:", error); // In ra lỗi để kiểm tra
    res.status(500).json({ message: "Lỗi khi tạo vé", error: error.message }); // Trả về phản hồi lỗi với mã 500
  }
});

// Hàm lấy địa chỉ IP cục bộ
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address; // Địa chỉ IP cục bộ
      }
    }
  }
  return "127.0.0.1"; // Trả về localhost nếu không tìm thấy
}
