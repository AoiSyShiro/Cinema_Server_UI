const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");

// Lấy danh sách tất cả suất chiếu
const getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find().populate("movie_id", "title").populate("room_id", "room_id"); // Chỉ lấy room_id
    res.status(200).json(showtimes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách suất chiếu", error });
  }
};


// Thêm mới một suất chiếu
const createShowtime = async (req, res) => {
  try {
    const { movie_id, start_time, room_id, ticket_price } = req.body;

    // Kiểm tra xem phòng chiếu có tồn tại không
    const room = await CinemaRoom.findOne({ room_id });
    if (!room) {
      return res.status(404).json({ message: "Phòng chiếu không tồn tại" });
    }

    const newShowtime = new Showtime({ movie_id, start_time, room_id, ticket_price });
    await newShowtime.save();

    res.status(201).json({ message: "Thêm suất chiếu thành công", showtime: newShowtime });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm suất chiếu", error });
  }
};


// Cập nhật suất chiếu
const updateShowtime = async (req, res) => {
  try {
    const id = Number(req.params.id); // Chuyển đổi id từ chuỗi sang số
    const updatedData = req.body;

    // Kiểm tra xem phòng chiếu có tồn tại không nếu room_id được cập nhật
    if (updatedData.room_id) {
      const room = await CinemaRoom.findOne({ room_id: updatedData.room_id });
      if (!room) {
        return res.status(404).json({ message: "Phòng chiếu không tồn tại" });
      }
    }

    // Tìm và cập nhật suất chiếu theo showtime_id
    const updatedShowtime = await Showtime.findOneAndUpdate(
      { showtime_id: id }, // Tìm theo showtime_id
      updatedData,
      { new: true }
    );

    if (!updatedShowtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu cần cập nhật" });
    }

    res.status(200).json({ message: "Cập nhật suất chiếu thành công", showtime: updatedShowtime });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật suất chiếu", error });
  }
};

  
// Xóa một suất chiếu
const deleteShowtime = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedShowtime = await Showtime.findByIdAndDelete(id);

    if (!deletedShowtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu cần xóa" });
    }

    res.status(200).json({ message: "Xóa suất chiếu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa suất chiếu", error });
  }
};

const getShowtimesByMovieId = async (req, res) => {
  const movieId = Number(req.params.id);  // Chuyển params id thành Number
  
  console.log(`Nhận request để tìm suất chiếu cho phim với ID: ${movieId}`);

  // Kiểm tra nếu movieId không phải là số hợp lệ
  if (isNaN(movieId)) {
    console.log(`Lỗi: movieId không hợp lệ: ${req.params.id}`);
    return res.status(400).send("Oops, có chút vấn đề với mã phim. Hãy thử lại nhé!");  // Thông báo thân thiện
  }

  try {
    console.log(`Đang tìm suất chiếu cho phim ID: ${movieId}`);
    
    // Truy vấn suất chiếu dựa trên movie_id
    const showtimes = await Showtime.find({ movie_id: movieId });

    // Kiểm tra nếu có suất chiếu
    if (showtimes.length > 0) {
      console.log(`Tìm thấy ${showtimes.length} suất chiếu cho phim ID: ${movieId}`);
      // Trả về suất chiếu nếu có
      return res.json(showtimes);  
    } else {
      console.log(`Không tìm thấy suất chiếu cho phim ID: ${movieId}`);
      // Nếu không có suất chiếu cho phim này
      return res.status(404).send("Rất tiếc, hiện tại không có suất chiếu cho bộ phim này. Bạn có thể thử phim khác nhé!");
    }
  } catch (error) {
    console.error("Lỗi khi truy vấn suất chiếu:", error);
    console.log(`Lỗi xảy ra khi truy vấn suất chiếu cho phim ID: ${movieId}`);
    return res.status(500).send("Chúng tôi đang gặp chút sự cố kỹ thuật. Vui lòng thử lại sau!");
  }
};


module.exports = { getAllShowtimes, createShowtime, updateShowtime, deleteShowtime, getShowtimesByMovieId };
