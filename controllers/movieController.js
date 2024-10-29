const Movie = require("../models/Movie");

// Lấy danh sách phim
const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().populate("category_id");
    res.json(movies);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phim", error });
  }
};

// Thêm phim
const addMovie = async (req, res) => {
  const {
    title,
    description,
    trailer_url,
    category_id,
    duration,
    release_date,
  } = req.body;
  const image = req.file ? req.file.path : null;

  try {
    const movie = new Movie({
      title,
      description,
      trailer_url,
      category_id,
      duration,
      release_date,
      image,
    });
    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    console.error("Lỗi khi thêm phim:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi thêm phim", error: error.message });
  }
};

// Cập nhật phim theo movie_id
const updateMovie = async (req, res) => {
    const { title, description, trailer_url, category_id, duration, release_date } = req.body;
    const image = req.file ? req.file.path : null;

    try {
        const movie = await Movie.findOneAndUpdate(
            { movie_id: req.params.id },  // Tìm theo movie_id
            { title, description, trailer_url, category_id, duration, release_date, image },
            { new: true }
        );

        if (!movie) {
            return res.status(404).json({ message: 'Không tìm thấy phim' });
        }
        res.status(200).json(movie);
    } catch (error) {
        console.error('Lỗi khi cập nhật phim:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật phim', error: error.message });
    }
};


// Xóa phim theo movie_id
const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findOneAndDelete({ movie_id: parseInt(req.params.id) }); // Tìm theo movie_id và chuyển đổi sang số nguyên
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
  addMovie,
  updateMovie,
  deleteMovie,
};
