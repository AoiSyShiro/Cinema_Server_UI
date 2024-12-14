const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const User = require("../models/User");

// Lấy thông tin chi tiết của một phim
const getMovieDetails = async (req, res) => {
  console.log("Received request for movie_id:", req.params.movie_id); // Ghi log movie_id nhận được
  try {
    const movie_id = Number(req.params.movie_id); // Chuyển movie_id từ string thành số

    if (isNaN(movie_id) || movie_id <= 0) {
      // Kiểm tra movie_id có hợp lệ không
      return res.status(400).json({ message: "ID phim không hợp lệ" }); // Phản hồi nếu không hợp lệ
    }

    const movie = await Movie.findOne({ movie_id: movie_id }); // Tìm phim có movie_id tương ứng

    if (!movie) {
      // Nếu không tìm thấy phim
      return res.status(404).json({ message: "Không tìm thấy phim" }); // Phản hồi lỗi 404
    }

    res.status(200).json(movie); // Trả về thông tin phim
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phim:", error); // Ghi log lỗi
    res.status(500).json({ message: "Lỗi khi lấy thông tin phim", error }); // Phản hồi lỗi
  }
};

// Lấy danh sách phim theo thể loại
const getMoviesByGenre = async (req, res) => {
  try {
    const { genre } = req.params; // Lấy thông tin thể loại từ URL

    const category_id = Number(genre); // Chuyển đổi thể loại thành số
    if (isNaN(category_id) || category_id <= 0) {
      // Kiểm tra category_id có hợp lệ không
      return res.status(400).json({ message: "Thể loại không hợp lệ" }); // Phản hồi lỗi
    }

    // Tìm danh sách phim theo category_id
    const movies = await Movie.find({ category_id: category_id }); // Lọc phim dựa trên thể loại
    if (movies.length === 0) {
      // Nếu không có phim nào
      return res
        .status(404)
        .json({ message: "Không tìm thấy phim cho thể loại này" }); // Phản hồi lỗi 404
    }

    res.status(200).json(movies); // Trả về danh sách phim
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách phim theo thể loại", error }); // Phản hồi lỗi
  }
};


// Lấy danh sách phim sắp chiếu
const getUpcomingMovies = async (req, res) => {
  try {
    const upcomingMovies = await Movie.find({
      release_date: { $gte: new Date() },  // Lọc phim có ngày phát hành lớn hơn hoặc bằng ngày hiện tại
    }).sort({ release_date: 1 });  // Sắp xếp danh sách phim theo ngày phát hành tăng dần

    if (upcomingMovies.length === 0) {
      // Nếu không có phim sắp chiếu
      return res.status(404).json({ message: "Không tìm thấy phim sắp chiếu" }); // Phản hồi lỗi 404
    }

    res.status(200).json(upcomingMovies); // Trả về danh sách phim sắp chiếu
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim sắp chiếu:", error); // Ghi log lỗi
    res.status(500).json({ message: "Lỗi khi lấy danh sách phim sắp chiếu", error }); // Phản hồi lỗi
  }
};



// Lấy danh sách phim sắp ra mắt
const getMoviesComingSoon = async (req, res) => {
  try {
    const currentDate = new Date(); // Lấy ngày hiện tại
    const comingSoonMovies = await Movie.find({
      coming_soon: true, // Lọc các phim được đánh dấu là sắp ra mắt
    }).sort({ release_date: 1 }); // Sắp xếp theo ngày phát hành

    if (comingSoonMovies.length === 0) {
      // Nếu không có phim nào
      return res
        .status(404)
        .json({ message: "Không tìm thấy phim sắp ra mắt" }); // Phản hồi lỗi 404
    }

    res.status(200).json(comingSoonMovies); // Trả về danh sách phim sắp ra mắt
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim sắp ra mắt:", error); // Ghi log lỗi
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách phim sắp ra mắt", error }); // Phản hồi lỗi
  }
};

// Thêm yêu thích phim
const addFavoriteMovie = async (req, res) => {
  const { movie_id } = req.params; // Lấy movie_id từ params trong request
  const { user_id } = req.params; // Lấy user_id từ params trong request

  console.log(
    `Nhận request để thêm phim yêu thích: user_id = ${user_id}, movie_id = ${movie_id}`
  ); // Ghi log thông tin request

  try {
    // Kiểm tra nếu phim tồn tại trong cơ sở dữ liệu
    const movie = await Movie.findOne({ movie_id }); // Tìm phim theo movie_id
    if (!movie) {
      console.log(`Phim với ID ${movie_id} không tồn tại trong cơ sở dữ liệu.`);
      return res.status(404).json({ message: "Phim không tồn tại" }); // Trả về lỗi nếu không tìm thấy phim
    }
    console.log(`Phim ${movie.title} đã được tìm thấy.`); // Ghi log phim được tìm thấy

    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id }); // Tìm người dùng theo user_id
    if (!user) {
      console.log(`Người dùng với ID ${user_id} không tồn tại.`);
      return res.status(404).json({ message: "Người dùng không tồn tại" }); // Trả về lỗi nếu không tìm thấy người dùng
    }
    console.log(`Người dùng ${user.username} đã được tìm thấy.`); // Ghi log người dùng được tìm thấy

    // Kiểm tra nếu phim đã có trong danh sách yêu thích
    if (user.favorites.includes(movie_id)) {
      console.log(
        `Phim ${movie.title} đã có trong danh sách yêu thích của người dùng ${user.username}.`
      );
      return res
        .status(400)
        .json({ message: "Phim đã có trong danh sách yêu thích" }); // Trả về lỗi nếu phim đã có trong danh sách
    }

    // Thêm phim vào danh sách yêu thích
    user.favorites.push(movie_id); // Thêm movie_id vào mảng favorites
    await user.save(); // Lưu người dùng lại sau khi cập nhật danh sách favorites

    console.log(
      `Phim ${movie.title} đã được thêm vào danh sách yêu thích của người dùng ${user.username}.`
    ); // Ghi log khi thêm thành công

    // Trả về phản hồi thành công
    res.status(200).json({
      message: "Phim đã được thêm vào danh sách yêu thích",
      favorites: user.favorites, // Trả về danh sách favorites mới
    });
  } catch (error) {
    console.error("Lỗi khi thêm phim yêu thích:", error); // Log lỗi chi tiết
    res
      .status(500)
      .json({ message: "Lỗi khi thêm phim yêu thích", error: error.message }); // Trả về thông báo lỗi
  }
};



// Xoá yêu thích phim
const removeFavoriteMovie = async (req, res) => {
  const { user_id, movie_id } = req.params; // Lấy user_id và movie_id từ params trong request

  console.log(`Nhận request để xóa phim yêu thích: user_id = ${user_id}, movie_id = ${movie_id}`); // Ghi log thông tin request

  try {
    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id }); // Tìm người dùng theo user_id
    if (!user) {
      console.log(`Người dùng với ID ${user_id} không tồn tại.`);
      return res.status(404).json({ message: "Người dùng không tồn tại" }); // Trả về lỗi nếu không tìm thấy người dùng
    }

    // Kiểm tra nếu phim có trong danh sách yêu thích của người dùng
    if (!user.favorites.includes(Number(movie_id))) {
      console.log(`Phim ${movie_id} không có trong danh sách yêu thích của người dùng ${user.username}.`);
      return res.status(400).json({ message: "Phim không có trong danh sách yêu thích" }); // Trả về lỗi nếu phim không có trong danh sách
    }

    // Xóa phim khỏi danh sách yêu thích
    user.favorites = user.favorites.filter((id) => id !== Number(movie_id)); // Dùng filter để loại bỏ movie_id khỏi mảng
    await user.save(); // Lưu người dùng lại sau khi xóa phim khỏi danh sách yêu thích

    console.log(`Phim ${movie_id} đã được xóa khỏi danh sách yêu thích của người dùng ${user.username}.`); // Ghi log khi xóa thành công

    // Trả về phản hồi thành công
    res.status(200).json({
      message: "Phim đã được xóa khỏi danh sách yêu thích",
      favorites: user.favorites, // Trả về danh sách favorites mới
    });
  } catch (error) {
    console.error("Lỗi khi xóa phim yêu thích:", error); // Log lỗi chi tiết
    res.status(500).json({ message: "Lỗi khi xóa phim yêu thích", error: error.message }); // Trả về thông báo lỗi
  }
};





// Kiểm tra phim có trong danh sách yêu thích của người dùng không
const checkIfFavorite = async (req, res) => {
  const { user_id, movie_id } = req.params; // Lấy user_id và movie_id từ params request

  try {
    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id }); // Tìm người dùng dựa vào user_id
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" }); // Trả về lỗi nếu người dùng không tồn tại
    }

    // Kiểm tra nếu phim có trong danh sách yêu thích
    const isFavorite = user.favorites.includes(movie_id); // Kiểm tra xem movie_id có nằm trong mảng favorites không

    // Trả về kết quả
    res.status(200).json({ isFavorite }); // Trả về giá trị boolean `isFavorite`
  } catch (error) {
    console.error("Lỗi khi kiểm tra phim yêu thích:", error); // Log lỗi chi tiết
    res.status(500).json({ message: "Lỗi khi kiểm tra phim yêu thích", error }); // Trả về lỗi nếu có
  }
};


// Lấy danh sách phim yêu thích của người dùng
const getFavoriteMovies = async (req, res) => {
  const { user_id } = req.params; // Lấy user_id từ params request

  try {
    // Tìm người dùng theo user_id
    const user = await User.findOne({ user_id }); // Tìm người dùng dựa vào user_id
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" }); // Trả về lỗi nếu người dùng không tồn tại
    }

    // Lấy danh sách phim yêu thích của người dùng
    const favoriteMovies = await Movie.find({
      movie_id: { $in: user.favorites }, // Lấy các bộ phim có movie_id nằm trong mảng favorites
    });

    if (favoriteMovies.length === 0) {
      return res.status(404).json({ message: "Danh sách yêu thích trống" }); // Trả về lỗi nếu danh sách trống
    }

    // Trả về danh sách phim yêu thích
    res.status(200).json(favoriteMovies); // Trả về danh sách phim yêu thích
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim yêu thích:", error); // Log lỗi chi tiết
    res.status(500).json({ message: "Lỗi khi lấy danh sách phim yêu thích", error }); // Trả về lỗi nếu có
  }
};



// const getRandomMovies = async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit) || 5;

//     const movies = await Movie.aggregate([{ $sample: { size: limit } }]);

//     if (movies.length === 0) {
//       return res.status(404).json({ message: "Không tìm thấy phim" });
//     }

//     res.status(200).json(movies);
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách phim ngẫu nhiên:", error);
//     res
//       .status(500)
//       .json({ message: "Lỗi khi lấy danh sách phim ngẫu nhiên", error });
//   }
// };

// Tìm kiếm phim theo tên
// const searchMoviesByTitle = async (req, res) => {
//   try {
//     const { title } = req.query; // Lấy tên phim từ query string
//     if (!title) {
//       // Nếu không cung cấp tên phim
//       return res.status(400).json({ message: "Vui lòng cung cấp tên phim" }); // Phản hồi lỗi
//     }

//     const regex = new RegExp(title, "i"); // Tạo biểu thức chính quy để tìm kiếm không phân biệt hoa thường
//     const movies = await Movie.find({ title: { $regex: regex } }); // Tìm kiếm phim theo tên

//     if (movies.length === 0) {
//       // Nếu không tìm thấy phim
//       return res.status(404).json({ message: "Không tìm thấy phim" }); // Phản hồi lỗi 404
//     }

//     res.status(200).json(movies); // Trả về danh sách phim
//   } catch (error) {
//     console.error("Lỗi khi tìm kiếm phim:", error); // Ghi log lỗi
//     res.status(500).json({ message: "Lỗi khi tìm kiếm phim", error }); // Phản hồi lỗi
//   }
// };

module.exports = {
  getMovieDetails,
  getMoviesByGenre,
  // getRandomMovies,
  getUpcomingMovies,
  getMoviesComingSoon,
  // searchMoviesByTitle,
  addFavoriteMovie,
  removeFavoriteMovie,
  checkIfFavorite,
  getFavoriteMovies,
};
