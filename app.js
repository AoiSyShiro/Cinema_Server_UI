const express = require("express");
const punycode = require('punycode/');
const path = require("path");
const cloudinary = require("cloudinary").v2; // Khai báo cloudinary chỉ một lần
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
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
<<<<<<< Updated upstream
=======
const Movie = require("./models/Movie");
const Category = require("./models/Category");  // Đảm bảo bạn có mô hình Category
const FoodDrink = require('./models/FoodDrink');
require('dotenv').config(); // Đảm bảo dotenv.config() được gọi đầu tiên

// Kiểm tra xem biến môi trường đã được nạp đúng chưa
console.log("Cloud Name: ", process.env.CLOUD_NAME);
console.log("API Key: ", process.env.API_KEY);
console.log("API Secret: ", process.env.API_SECRET);
>>>>>>> Stashed changes

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configure multer with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "movies",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", { title: "Trang chủ" });
});

<<<<<<< Updated upstream
app.post("/upload", upload.single("movieImage"), async (req, res) => {
=======
app.get("/movies-admin", async (req, res) => {
  try {
    // Lấy tất cả phim
    const movies = await Movie.find();
    // Lấy tất cả danh mục thể loại
    const categories = await Category.find();

    // Kết hợp tên thể loại vào mỗi phim
    const moviesWithCategories = movies.map(movie => {
      // Tìm danh mục tương ứng với category_id của phim
      const category = categories.find(cat => cat.category_id === movie.category_id);  // So sánh category_id
      return {
        ...movie.toObject(),
        category: category ? category.name : 'Không có danh mục'
      };
    });

    // Truyền thông tin phim và danh mục vào view
    res.render("movies", { movies: moviesWithCategories, categories: categories });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách phim:", err);
    res.status(500).send("Lỗi khi lấy danh sách phim.");
  }
});


// Route để thêm phim
app.post("/movies-admin", upload.single("image"), async (req, res) => {
  const { title, description, trailer_url, category_id, duration, release_date, coming_soon } = req.body;
  const image_url = req.file ? req.file.path : null;

  try {
    const movie = new Movie({
      title,
      description,
      trailer_url,
      category_id,
      duration,
      release_date,
      image_url,
      coming_soon: coming_soon === 'on' // Nếu checkbox "coming_soon" được chọn
    });

    await movie.save();
    res.redirect("/movies-admin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi thêm phim");
  }
});

// Route xóa phim theo movie_id
app.get('/movies-admin/delete/:movie_id', async (req, res) => {
  const movieId = req.params.movie_id;  // Lấy movie_id từ URL

>>>>>>> Stashed changes
  try {
    // Tìm và xóa phim theo movie_id
    const movie = await Movie.findOneAndDelete({ movie_id: movieId });

    if (!movie) {
      return res.status(404).send('Phim không tồn tại');
    }

    // Sau khi xóa thành công, chuyển hướng về trang quản lý phim
    res.redirect('/movies-admin');
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi xóa phim");
  }
});



// Route cập nhật phim
app.post('/movies-admin/:id', upload.single('image'), async (req, res) => {
  const movieId = req.params.id;
  const { title, description, trailer_url, category_id, duration, release_date, coming_soon } = req.body;
  const image_url = req.file ? req.file.path : null; 

  try {
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).send('Phim không tồn tại');
    }

    movie.title = title;
    movie.description = description;
    movie.trailer_url = trailer_url;
    movie.category_id = category_id;
    movie.duration = duration;
    movie.release_date = release_date;
    movie.coming_soon = coming_soon === 'on';
    movie.image_url = image_url || movie.image_url;

    await movie.save();
    res.redirect('/movies-admin');
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi cập nhật phim");
  }
});





// Các route khác của ứng dụng
app.use("/auth", userRoutes);
app.use("/food-drinks", foodDrinkRoutes);
app.use("/movies", movieRoutes);
app.use("/categories", categoryRoutes);
app.use("/current", trailerRouter);
app.use("/showtimes", showtimeRouter);
app.use("/tickets", ticketBookingRouter);
app.use("/promotions", promotionRoutes);
app.use("/reviews", reviewRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRouter);

const PORT = process.env.PORT || 5000;
const connectToDatabase = require("./config/db.js");

const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, async () => {
    console.log(`Server đang chạy ở cổng ${PORT}`);
    const open = await import("open");
    await open.default(`http://localhost:${PORT}`);
  });
};

startServer();
