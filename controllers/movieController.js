const Movie = require("../models/Movie");
const Category = require("../models/Category");  // Đảm bảo bạn có mô hình Category

// Lấy danh sách phim
const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    const categories = await Category.find();  // Lấy danh sách tất cả các danh mục

    // Kết hợp danh mục vào danh sách phim
    const moviesWithCategories = movies.map(movie => {
      // Tìm thể loại tương ứng với category_id của phim
      const category = categories.find(cat => cat.category_id === movie.category_id);

      return {
        ...movie.toObject(),
        category: category ? category.name : null  // Thêm tên thể loại vào thông tin phim
      };
    });

    res.json(moviesWithCategories);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phim", error });
  }
};


// Thêm phim
const addMovieAdmin = async (req, res) => {  // Đổi tên từ addMovie thành addMovieAdmin
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Lỗi khi tải ảnh lên", error: err.message });
    }

    const { title, description, trailer_url, category_id, duration, release_date, coming_soon } = req.body;
    try {
      const image_url = req.file ? req.file.path : null;
      const movie = new Movie({
        title,
        description,
        trailer_url,
        category_id: parseInt(category_id),
        duration,
        release_date,
        image_url,
        coming_soon,
      });

      await movie.save();
      res.redirect("/movies");  // Redirect về trang danh sách phim
    } catch (error) {
      console.error("Lỗi khi thêm phim:", error);
      res.status(500).json({ message: "Lỗi khi thêm phim", error });
    }
  });
};

// Cập nhật phim
const updateMovieAdmin = async (req, res) => {  // Đổi tên từ updateMovie thành updateMovieAdmin
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Lỗi khi tải ảnh lên", error: err.message });
    }

    const { movie_id, title, description, trailer_url, category_id, duration, release_date, coming_soon } = req.body;
    try {
      const image_url = req.file ? req.file.path : null;
      const movie = await Movie.findOneAndUpdate(
        { movie_id },
        {
          title,
          description,
          trailer_url,
          category_id: parseInt(category_id),
          duration,
          release_date,
          image_url,
          coming_soon,
        },
        { new: true }
      );
      res.json(movie);
    } catch (error) {
      console.error("Lỗi khi cập nhật phim:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật phim", error });
    }
  });
};

// Xóa phim theo movie_id
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findOneAndDelete({
      movie_id: parseInt(req.params.id),
    });
    if (!movie) {
      return res.status(404).json({ message: "Không tìm thấy phim để xóa" });
    }
    res.json({ message: "Xóa phim thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa phim:", error);
    res.status(500).json({ message: "Lỗi khi xóa phim", error });
  }
};

module.exports = {
  getMovies,
  addMovieAdmin,
  updateMovieAdmin,
  deleteMovie,
};
