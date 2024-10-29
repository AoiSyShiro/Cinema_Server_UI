const Movie = require("../models/Movie");

// Lấy danh sách trailer của các phim đang chiếu tại rạp khi mở app
const getCurrentTrailers = async (req, res) => {
  try {
    const today = new Date();
    const movies = await Movie.find({
      release_date: { $lte: today }, 
    }, { title: 1, trailer_url: 1, release_date: 1 });

    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy trailer phim", error });
  }
};

module.exports = { getCurrentTrailers };
