const CinemaRoom = require("../models/CinemaRoom");
const Movie = require('../models/Movie'); 

// Thêm phòng chiếu
const createCinemaRoom = async (req, res) => {
    try {
      const { room_name, seat_capacity, is_active, start_time, end_time, movie_id } = req.body;
  
      // Chuyển start_time và end_time thành kiểu Date để tính toán duration
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
  
      // Tính duration (thời gian chiếu) theo giờ
      const duration = (endDate - startDate) / (1000 * 60 * 60);  // Đổi từ milliseconds sang giờ
  
      const newRoom = new CinemaRoom({
        room_name,
        seat_capacity: Number(seat_capacity), // Đảm bảo seat_capacity là số
        is_active: is_active === 'on', // Biến boolean cho is_active
        start_time: startDate,
        end_time: endDate,
        duration,
        movie_id: Number(movie_id),  // movie_id is passed as a number now
      });
  
      await newRoom.save();
      res.redirect('/cinema-rooms');
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi thêm phòng chiếu", error });
    }
};

  

// Cập nhật phòng chiếu
const updateCinemaRoom = async (req, res) => {
    try {
      const { room_name, seat_capacity, is_active, start_time, end_time, movie_id } = req.body;
      const { room_id } = req.params; // Lấy room_id từ tham số URL (dưới dạng number)
  
      // Chuyển room_id sang kiểu number (nếu chưa)
      const numericRoomId = Number(room_id);
  
      // Chuyển start_time và end_time thành kiểu Date
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
  
      // Tính duration (thời gian chiếu) theo giờ
      const duration = (endDate - startDate) / (1000 * 60 * 60);  // Đổi từ milliseconds sang giờ
  
      // Cập nhật phòng chiếu dựa trên room_id là number
      const updatedRoom = await CinemaRoom.findOneAndUpdate(
        { room_id: numericRoomId }, // Dùng room_id là number để tìm kiếm
        {
          room_name,
          seat_capacity: Number(seat_capacity),  // Đảm bảo seat_capacity là number
          is_active: is_active === 'on',  // Chuyển đổi is_active từ string thành boolean
          start_time: startDate,
          end_time: endDate,
          duration,
          movie_id: Number(movie_id),  // Đảm bảo movie_id là number
        },
        { new: true } // Trả về document mới sau khi cập nhật
      );
  
      if (!updatedRoom) {
        return res.status(404).json({ message: "Phòng chiếu không tìm thấy" });
      }
  
      // Cập nhật thành công, chuyển hướng về trang cinema-rooms
      res.redirect('/cinema-rooms'); // Hoặc bạn có thể redirect đến một trang cụ thể nếu cần
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi cập nhật phòng chiếu", error });
    }
  };
  

// Xóa phòng chiếu
const deleteCinemaRoom = async (req, res) => {
    try {
      const { room_id } = req.params;
  
      // Chuyển room_id sang kiểu number
      const numericRoomId = Number(room_id);
  
      // Xóa phòng chiếu theo room_id là number
      const deletedRoom = await CinemaRoom.findOneAndDelete({ room_id: numericRoomId });
  
      if (!deletedRoom) {
        return res.status(404).json({ message: "Phòng chiếu không tìm thấy" });
      }
  
      // Sau khi xóa thành công, chuyển hướng về trang danh sách phòng chiếu
      res.redirect('/cinema-rooms');
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa phòng chiếu", error });
    }
  };
  
// Hàm lấy danh sách phòng chiếu
const getCinemaRooms = async (req, res) => {
  try {
    const rooms = await CinemaRoom.find({});
    const movies = await Movie.find({});

    res.render('cinema-rooms', { rooms, movies });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng chiếu", error });
  }
};

module.exports = {
  createCinemaRoom,
  updateCinemaRoom,
  deleteCinemaRoom,
  getCinemaRooms,
};
