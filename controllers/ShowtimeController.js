const Showtime = require("../models/Showtime");

// Lấy danh sách tất cả suất chiếu
const getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find().populate("movie_id", "title");
    res.status(200).json(showtimes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách suất chiếu", error });
  }
};

// Thêm mới một suất chiếu
const createShowtime = async (req, res) => {
  try {
    const { movie_id, start_time, room, ticket_price } = req.body;
    const newShowtime = new Showtime({ movie_id, start_time, room, ticket_price });
    await newShowtime.save();
    res.status(201).json({ message: "Thêm suất chiếu thành công", showtime: newShowtime });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm suất chiếu", error });
  }
};

const updateShowtime = async (req, res) => {
    try {
      const id = Number(req.params.id); // Chuyển đổi id từ chuỗi sang số
      const updatedData = req.body;
  
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

module.exports = { getAllShowtimes, createShowtime, updateShowtime, deleteShowtime };
