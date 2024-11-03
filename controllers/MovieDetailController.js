const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const getMovieDetails = async (req, res) => {
  console.log("Received request for movie_id:", req.params.movie_id);
  try {
    const movie_id = Number(req.params.movie_id);

    if (isNaN(movie_id) || movie_id <= 0) {
      return res.status(400).json({ message: "ID phim không hợp lệ" });
    }

    const movie = await Movie.findOne({ movie_id: movie_id });

    if (!movie) {
      return res.status(404).json({ message: "Không tìm thấy phim" });
    }

    res.status(200).json(movie);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phim:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin phim", error });
  }
};

// Lấy danh sách phim theo thể loại
const getMoviesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;

    const category_id = Number(genre);
    if (isNaN(category_id) || category_id <= 0) {
      return res.status(400).json({ message: "Thể loại không hợp lệ" });
    }

    // Tìm danh sách phim theo category_id
    const movies = await Movie.find({ category_id: category_id });
    if (movies.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phim cho thể loại này" });
    }

    res.status(200).json(movies);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách phim theo thể loại", error });
  }
};

const getRandomMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const movies = await Movie.aggregate([{ $sample: { size: limit } }]);

    if (movies.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phim" });
    }

    res.status(200).json(movies);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim ngẫu nhiên:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách phim ngẫu nhiên", error });
  }
};

// Lấy danh sách phim sắp chiếu
const getUpcomingMovies = async (req, res) => {
  try {
    const upcomingMovies = await Movie.find({
      release_date: { $gte: new Date() }, // Lấy phim có ngày phát hành lớn hơn hoặc bằng ngày hiện tại
    }).sort({ release_date: 1 }); // Sắp xếp theo ngày phát hành

    if (upcomingMovies.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phim sắp chiếu" });
    }

    res.status(200).json(upcomingMovies);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim sắp chiếu:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách phim sắp chiếu", error });
  }
};

// Lấy danh sách phim sắp ra mắt
const getMoviesComingSoon = async (req, res) => {
  try {
    const currentDate = new Date();
    const comingSoonMovies = await Movie.find({
      // release_date: { $gt: currentDate }, // Lấy phim có ngày phát hành lớn hơn ngày hiện tại
      // Giả sử bạn có trường `is_coming_soon` để đánh dấu phim sắp ra mắt
      coming_soon: true,
    }).sort({ release_date: 1 });

    if (comingSoonMovies.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phim sắp ra mắt" });
    }

    res.status(200).json(comingSoonMovies);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim sắp ra mắt:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách phim sắp ra mắt", error });
  }
};

module.exports = {
  getMovieDetails,
  getMoviesByGenre,
  getRandomMovies,
  getUpcomingMovies,
  getMoviesComingSoon,
};
