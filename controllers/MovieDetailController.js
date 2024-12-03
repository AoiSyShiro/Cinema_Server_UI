const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const User = require("../models/User");

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

const getUpcomingMovies = async (req, res) => {
  try {
    const upcomingMovies = await Movie.find({
      release_date: { $gte: new Date() },  // Lấy phim có ngày phát hành lớn hơn hoặc bằng ngày hiện tại
      // coming_soon: true  // Lọc phim sắp chiếu
    }).sort({ release_date: 1 });  // Sắp xếp theo ngày phát hành

    if (upcomingMovies.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phim sắp chiếu" });
    }

    res.status(200).json(upcomingMovies);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim sắp chiếu:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phim sắp chiếu", error });
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

const searchMoviesByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên phim" });
    }

    const regex = new RegExp(title, "i"); // i để tìm kiếm không phân biệt chữ hoa chữ thường
    const movies = await Movie.find({ title: { $regex: regex } });

    if (movies.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phim" });
    }

    res.status(200).json(movies);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm phim:", error);
    res.status(500).json({ message: "Lỗi khi tìm kiếm phim", error });
  }
};

const addFavoriteMovie = async (req, res) => {
  const { movie_id } = req.params; // Lấy movie_id từ params request
  const { user_id } = req.params; // Lấy user_id từ params request

  console.log(
    `Nhận request để thêm phim yêu thích: user_id = ${user_id}, movie_id = ${movie_id}`
  );

  try {
    // Kiểm tra nếu phim tồn tại trong cơ sở dữ liệu
    const movie = await Movie.findOne({ movie_id });
    if (!movie) {
      console.log(`Phim với ID ${movie_id} không tồn tại trong cơ sở dữ liệu.`);
      return res.status(404).json({ message: "Phim không tồn tại" });
    }
    console.log(`Phim ${movie.title} đã được tìm thấy.`);

    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id });
    if (!user) {
      console.log(`Người dùng với ID ${user_id} không tồn tại.`);
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    console.log(`Người dùng ${user.username} đã được tìm thấy.`);

    // Kiểm tra nếu phim đã có trong danh sách yêu thích
    if (user.favorites.includes(movie_id)) {
      console.log(
        `Phim ${movie.title} đã có trong danh sách yêu thích của người dùng ${user.username}.`
      );
      return res
        .status(400)
        .json({ message: "Phim đã có trong danh sách yêu thích" });
    }

    // Thêm phim vào danh sách yêu thích
    user.favorites.push(movie_id);
    await user.save(); // Lưu người dùng lại sau khi cập nhật danh sách favorites

    console.log(
      `Phim ${movie.title} đã được thêm vào danh sách yêu thích của người dùng ${user.username}.`
    );

    // Trả về phản hồi thành công
    res.status(200).json({
      message: "Phim đã được thêm vào danh sách yêu thích",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Lỗi khi thêm phim yêu thích:", error); // Log lỗi chi tiết
    res
      .status(500)
      .json({ message: "Lỗi khi thêm phim yêu thích", error: error.message }); // Trả về thông báo lỗi chi tiết
  }
};

const removeFavoriteMovie = async (req, res) => {
  const { user_id, movie_id } = req.params;  // Lấy user_id và movie_id từ params request

  console.log(`Nhận request để xóa phim yêu thích: user_id = ${user_id}, movie_id = ${movie_id}`);

  try {
    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id });
    if (!user) {
      console.log(`Người dùng với ID ${user_id} không tồn tại.`);
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra nếu phim có trong danh sách yêu thích của người dùng
    if (!user.favorites.includes(Number(movie_id))) {
      console.log(`Phim ${movie_id} không có trong danh sách yêu thích của người dùng ${user.username}.`);
      return res.status(400).json({ message: "Phim không có trong danh sách yêu thích" });
    }

    // Xóa phim khỏi danh sách yêu thích
    user.favorites = user.favorites.filter((id) => id !== Number(movie_id)); // Dùng filter để loại bỏ movie_id khỏi mảng
    await user.save(); // Lưu người dùng lại sau khi xóa phim khỏi danh sách yêu thích

    console.log(`Phim ${movie_id} đã được xóa khỏi danh sách yêu thích của người dùng ${user.username}.`);

    // Trả về phản hồi thành công
    res.status(200).json({
      message: "Phim đã được xóa khỏi danh sách yêu thích",
      favorites: user.favorites,  // Trả về danh sách favorites mới
    });
  } catch (error) {
    console.error("Lỗi khi xóa phim yêu thích:", error);
    res.status(500).json({ message: "Lỗi khi xóa phim yêu thích", error: error.message });
  }
};




// Kiểm tra phim có trong danh sách yêu thích của người dùng không
const checkIfFavorite = async (req, res) => {
  const { user_id, movie_id } = req.params;

  try {
    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra nếu phim có trong danh sách yêu thích
    const isFavorite = user.favorites.includes(movie_id);

    // Trả về kết quả
    res.status(200).json({ isFavorite });
  } catch (error) {
    console.error("Lỗi khi kiểm tra phim yêu thích:", error);
    res.status(500).json({ message: "Lỗi khi kiểm tra phim yêu thích", error });
  }
};

// Lấy danh sách phim yêu thích của người dùng
const getFavoriteMovies = async (req, res) => {
  const { user_id } = req.params;

  try {
    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Lấy danh sách phim yêu thích của người dùng
    const favoriteMovies = await Movie.find({
      movie_id: { $in: user.favorites },
    });

    if (favoriteMovies.length === 0) {
      return res.status(404).json({ message: "Danh sách yêu thích trống" });
    }

    // Trả về danh sách phim yêu thích
    res.status(200).json(favoriteMovies);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim yêu thích:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phim yêu thích", error });
  }
};


module.exports = {
  getMovieDetails,
  getMoviesByGenre,
  getRandomMovies,
  getUpcomingMovies,
  getMoviesComingSoon,
  searchMoviesByTitle,
  addFavoriteMovie,
  removeFavoriteMovie,
  checkIfFavorite,
  getFavoriteMovies,
};
