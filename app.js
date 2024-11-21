const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
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
const Movie = require("./models/Movie");
const Category = require("./models/Category");
const FoodDrink = require("./models/FoodDrink");
const Showtime = require("./models/Showtime");
const Promotion = require('./models/Promotion'); 


require("dotenv").config();

// Kiểm tra xem biến môi trường đã được nạp đúng chưa
console.log("Cloud Name: ", process.env.CLOUD_NAME);
console.log("API Key: ", process.env.API_KEY);
console.log("API Secret: ", process.env.API_SECRET);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

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
app.use("/booking-history", bookingRoutes);
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

app.get("/movies-admin", async (req, res) => {
  try {
    // Lấy tất cả phim
    const movies = await Movie.find();
    // Lấy tất cả danh mục thể loại
    const categories = await Category.find();

    // Kết hợp tên thể loại vào mỗi phim
    const moviesWithCategories = movies.map((movie) => {
      // Tìm danh mục tương ứng với category_id của phim
      const category = categories.find(
        (cat) => cat.category_id === movie.category_id
      ); // So sánh category_id
      return {
        ...movie.toObject(),
        category: category ? category.name : "Không có danh mục",
      };
    });

    // Truyền thông tin phim và danh mục vào view
    res.render("movies", {
      movies: moviesWithCategories,
      categories: categories,
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách phim:", err);
    res.status(500).send("Lỗi khi lấy danh sách phim.");
  }
});

// Route để thêm phim
app.post("/movies-admin", upload.single("image"), async (req, res) => {
  const {
    title,
    description,
    trailer_url,
    category_id,
    duration,
    release_date,
    coming_soon,
  } = req.body;
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
      coming_soon: coming_soon === "on", // Nếu checkbox "coming_soon" được chọn
    });

    await movie.save();
    res.redirect("/movies-admin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi thêm phim");
  }
});

// Route xóa phim theo movie_id
app.get("/movies-admin/delete/:movie_id", async (req, res) => {
  const movieId = req.params.movie_id; // Lấy movie_id từ URL

  try {
    // Tìm và xóa phim theo movie_id
    const movie = await Movie.findOneAndDelete({ movie_id: movieId });

    if (!movie) {
      return res.status(404).send("Phim không tồn tại");
    }

    // Sau khi xóa thành công, chuyển hướng về trang quản lý phim
    res.redirect("/movies-admin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi khi xóa phim");
  }
});

// Route cập nhật phim
app.post("/movies-admin/:id", upload.single("image"), async (req, res) => {
  const movieId = req.params.id;
  const {
    title,
    description,
    trailer_url,
    category_id,
    duration,
    release_date,
    coming_soon,
  } = req.body;
  const image_url = req.file ? req.file.path : null;

  try {
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).send("Phim không tồn tại");
    }

    movie.title = title;
    movie.description = description;
    movie.trailer_url = trailer_url;
    movie.category_id = category_id;
    movie.duration = duration;
    movie.release_date = release_date;
    movie.coming_soon = coming_soon === "on";
    movie.image_url = image_url || movie.image_url;

    await movie.save();
    res.redirect("/movies-admin");
  } catch (err) {
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
    const showtimes = await Showtime.find().lean(); // Sử dụng .lean() để trả về plain object
    const movies = await Movie.find().lean();

    // Duyệt qua showtimes và bổ sung thông tin phim vào từng showtime
    const showtimesWithMovies = showtimes.map((showtime) => {
      // Tìm phim tương ứng với movie_id của showtime
      const movie = movies.find(
        (movie) => movie.movie_id === showtime.movie_id
      );

      // Trả về showtime đã được bổ sung thông tin movie
      return {
        ...showtime, 
        movie: movie ? movie : null, 
        movie_id: showtime.movie_id, 
      };
    });

    // Render view và truyền dữ liệu showtimesWithMovies và movies
    res.render("showtime", { showtimes: showtimesWithMovies, movies });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

// Route xử lý tạo suất chiếu mới
app.post("/showtime-admin/create", async (req, res) => {
  try {
    const { movie_id, start_time, room, ticket_price } = req.body;

    // Tạo mới đối tượng Showtime mà không cần phải chỉ định showtime_id
    const newShowtime = new Showtime({
      movie_id,
      start_time,
      room,
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
    const showtimeId = Number(req.params.id); 

    // Kiểm tra nếu showtimeId không hợp lệ
    if (isNaN(showtimeId)) {
      return res.status(400).send("ID suất chiếu không hợp lệ");
    }

    const { movie_id, start_time, room, ticket_price } = req.body;

    // Tìm kiếm và cập nhật theo showtime_id (không phải _id)
    const updatedShowtime = await Showtime.findOneAndUpdate(
      { showtime_id: showtimeId }, // Dùng showtime_id thay vì _id
      { movie_id, start_time, room, ticket_price },
      { new: true } 
    );

    // Kiểm tra nếu không tìm thấy suất chiếu
    if (!updatedShowtime) {
      return res.status(404).send("Không tìm thấy suất chiếu");
    }

    // Redirect về danh sách suất chiếu
    res.redirect("/showtime-admin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi khi cập nhật suất chiếu");
  }
});

// Xóa suất chiếu
app.get("/showtime-admin/delete/:id", async (req, res) => {
  try {
    const id = Number(req.params.id); 

    const deletedShowtime = await Showtime.findOneAndDelete({
      showtime_id: id,
    });

    if (!deletedShowtime) {
      return res.status(404).send("Không tìm thấy suất chiếu để xóa");
    }

    res.redirect("/showtime-admin"); // Quay lại danh sách suất chiếu sau khi xóa
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi khi xóa suất chiếu");
  }
});


// Lấy tất cả khuyến mãi
app.get('/promotions/:id', (req, res) => {
  const promotionId = req.params.id;
  Promotion.findById(promotionId, (err, promotion) => {
    if (err) {
      return res.status(500).send('Error retrieving promotion');
    }
    if (!promotion) {
      return res.status(404).send('Promotion not found');
    }
    res.render('promotionDetail', { promotion });
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
    promotion.discount_percentage = discount_percentage || promotion.discount_percentage;

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
