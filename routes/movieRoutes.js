const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const movieDetailController = require("../controllers/MovieDetailController"); // Import MovieDetailController
const multer = require("multer");

// Cấu hình Multer với bộ nhớ tạm
const upload = multer({ storage: multer.memoryStorage() });

// Lấy danh sách phim
router.get("/", movieController.getMovies);

// Thêm phim
router.post("/", upload.single("image"), movieController.addMovie);

// Cập nhật phim
router.put("/:id", upload.single("image"), movieController.updateMovie);

// Xóa phim
router.delete("/:id", movieController.deleteMovie);

// Lấy thông tin chi tiết của một bộ phim
router.get("/detail/:movie_id", movieDetailController.getMovieDetails);

// Lấy danh sách phim theo thể loại
router.get("/genre/:genre", movieDetailController.getMoviesByGenre);

// Lấy danh sách ramdom movie để chiếu lên slide
router.get("/random", movieDetailController.getRandomMovies); // Random movies route

// Lấy danh sách phim sắp chiếu
router.get("/upcoming", movieDetailController.getUpcomingMovies);

// Lấy danh sách phim sắp ra mắt
router.get("/coming-soon", movieDetailController.getMoviesComingSoon);

// Tìm kiếm phim theo tên
router.get("/search", movieDetailController.searchMoviesByTitle);


// Thêm phim vào danh sách yêu thích của người dùng
router.post("/users/:user_id/favorites/:movie_id", movieDetailController.addFavoriteMovie);

// Xóa phim khỏi danh sách yêu thích của người dùng
router.delete("/users/:user_id/favorites/:movie_id", movieDetailController.removeFavoriteMovie);

router.get("/users/:user_id/favorites/:movie_id", movieDetailController.checkIfFavorite);


module.exports = router;
