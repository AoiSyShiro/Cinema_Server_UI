const CinemaRoom = require("../models/CinemaRoom");
const Movie = require('../models/Movie'); 

// Thêm phòng chiếu
const createCinemaRoom = async (req, res) => {
  try {
    const {
      room_name,
      seat_capacity,
      is_active,
      start_time,
      end_time,
      movie_id,
    } = req.body;

    // Chuyển đổi start_time và end_time sang kiểu Date
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    // Tính thời lượng (duration) theo giờ
    const duration = (endDate - startDate) / (1000 * 60 * 60);

    // Kiểm tra trùng thời gian với các phòng chiếu khác
    const overlappingRoom = await CinemaRoom.findOne({
      room_name: room_name,
      $or: [
        {
          start_time: { $lt: endDate },
          end_time: { $gt: startDate },
        },
      ],
    });

    if (overlappingRoom) {
      // Nếu có phòng chiếu trùng thời gian, render lại trang với thông báo lỗi
      const rooms = await CinemaRoom.find();
      const movies = await Movie.find();
      return res.render('cinema-rooms', {
        errorMessage: 'Thời gian chiếu bị trùng với một phim khác trong phòng này.',
        formData: req.body,
        rooms,
        movies,
        openModal: true,   // Mở modal khi có lỗi
        isEdit: false,     // Đặt là false vì đây là thêm mới
      });
    }

    // Tạo phòng chiếu mới
    const newRoom = new CinemaRoom({
      room_name,
      seat_capacity: Number(seat_capacity),
      is_active: is_active === 'on',
      start_time: startDate,
      end_time: endDate,
      duration,
      movie_id: Number(movie_id),
    });

    await newRoom.save();
    res.redirect('/cinema-rooms');
  } catch (error) {
    console.error(error);
    const rooms = await CinemaRoom.find();
    const movies = await Movie.find();
    res.render('cinema-rooms', {
      errorMessage: 'Lỗi khi thêm phòng chiếu',
      formData: req.body,
      rooms,
      movies,
      openModal: true,   // Mở modal khi có lỗi
      isEdit: false,     // Đặt là false vì đây là thêm mới
    });
  }
};

// Cập nhật phòng chiếu
const updateCinemaRoom = async (req, res) => {
  try {
    const {
      room_name,
      seat_capacity,
      is_active,
      start_time,
      end_time,
      movie_id,
    } = req.body;
    const { room_id } = req.params;

    const numericRoomId = Number(room_id);

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    // Kiểm tra thời gian bắt đầu và kết thúc
    if (startDate >= endDate) {
      const rooms = await CinemaRoom.find();
      const movies = await Movie.find();
      return res.render('cinema-rooms', {
        errorMessage: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.',
        formData: { ...req.body, room_id },
        rooms,
        movies,
        openModal: true,   // Mở modal khi có lỗi
        isEdit: true,      // Đặt là true vì đây là chỉnh sửa
      });
    }

    const duration = (endDate - startDate) / (1000 * 60 * 60);

    // Kiểm tra trùng thời gian với các phòng chiếu khác
    const overlappingRoom = await CinemaRoom.findOne({
      room_name: room_name,
      room_id: { $ne: numericRoomId },
      start_time: { $lt: endDate },
      end_time: { $gt: startDate },
    });

    if (overlappingRoom) {
      const rooms = await CinemaRoom.find();
      const movies = await Movie.find();
      return res.render('cinema-rooms', {
        errorMessage: 'Thời gian chiếu bị trùng với một phim khác trong phòng này.',
        formData: { ...req.body, room_id },
        rooms,
        movies,
        openModal: true,   // Mở modal khi có lỗi
        isEdit: true,      // Đặt là true vì đây là chỉnh sửa
      });
    }

    // Cập nhật phòng chiếu
    const updatedRoom = await CinemaRoom.findOneAndUpdate(
      { room_id: numericRoomId },
      {
        room_name,
        seat_capacity: Number(seat_capacity),
        is_active: is_active === 'on',
        start_time: startDate,
        end_time: endDate,
        duration,
        movie_id: Number(movie_id),
      },
      { new: true }
    );

    if (!updatedRoom) {
      const rooms = await CinemaRoom.find();
      const movies = await Movie.find();
      return res.render('cinema-rooms', {
        errorMessage: 'Phòng chiếu không tìm thấy',
        formData: { ...req.body, room_id },
        rooms,
        movies,
        openModal: true,   // Mở modal khi có lỗi
        isEdit: true,      // Đặt là true vì đây là chỉnh sửa
      });
    }

    res.redirect('/cinema-rooms');
  } catch (error) {
    console.error(error);
    const rooms = await CinemaRoom.find();
    const movies = await Movie.find();
    res.render('cinema-rooms', {
      errorMessage: 'Lỗi khi cập nhật phòng chiếu',
      formData: { ...req.body, room_id },
      rooms,
      movies,
      openModal: true,   // Mở modal khi có lỗi
      isEdit: true,      // Đặt là true vì đây là chỉnh sửa
    });
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
  
// Hàm để hiển thị trang danh sách phòng chiếu
const getCinemaRooms = async (req, res) => {
  try {
    // Lấy danh sách phòng chiếu và phim từ cơ sở dữ liệu
    const rooms = await CinemaRoom.find();
    const movies = await Movie.find();

    // Truyền các biến vào template, đảm bảo openModal và isEdit luôn được định nghĩa
    res.render('cinema-rooms', {
      rooms,
      movies,
      formData: {},        // Dữ liệu form mặc định là rỗng
      errorMessage: '',    // Thông báo lỗi mặc định là rỗng
      openModal: false,    // Đặt mặc định là false khi tải trang
      isEdit: false,       // Đặt mặc định là false khi tải trang
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng chiếu:', error);
    res.status(500).send('Lỗi máy chủ nội bộ');
  }
};

// Lấy thông tin phòng chiếu theo room_id
const getCinemaRoomById = async (req, res) => {
  try {
    const { room_id } = req.params;

    // Chuyển room_id sang kiểu number
    const numericRoomId = Number(room_id);

    // Kiểm tra xem room_id có hợp lệ không
    if (isNaN(numericRoomId)) {
      return res.status(400).json({ message: 'room_id không hợp lệ' });
    }

    // Tìm phòng chiếu theo room_id
    const cinemaRoom = await CinemaRoom.findOne({ room_id: numericRoomId });

    if (!cinemaRoom) {
      // Nếu không tìm thấy phòng chiếu
      return res.status(404).json({ message: 'Không tìm thấy phòng chiếu' });
    }

    // Trả về thông tin phòng chiếu dưới dạng JSON
    res.json(cinemaRoom);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin phòng chiếu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};

module.exports = {
  createCinemaRoom,
  updateCinemaRoom,
  deleteCinemaRoom,
  getCinemaRooms,
  getCinemaRoomById,
};