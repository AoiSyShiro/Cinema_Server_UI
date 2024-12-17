const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const CinemaRoom = require("../models/CinemaRoom"); 


// Lấy danh sách tất cả suất chiếu
const getAllShowtimes = async (req, res) => {
  try {
    // Lấy tất cả suất chiếu và phim dưới dạng plain object
    const showtimes = await Showtime.find().lean();
    const movies = await Movie.find().lean();
    const rooms = await CinemaRoom.find().lean(); // Lấy tất cả phòng chiếu từ CinemaRoom

    // Duyệt qua showtimes và bổ sung thông tin phim và phòng chiếu vào từng showtime
    const showtimesWithDetails = showtimes.map((showtime) => {
      // Tìm phim tương ứng với movie_id của showtime
      const movie = movies.find(
        (movie) => movie.movie_id === showtime.movie_id
      );

      // Tìm phòng chiếu tương ứng với room_id của showtime
      const room = rooms.find(
        (room) => room.room_id === showtime.room_id
      );

      // Trả về showtime đã được bổ sung thông tin movie và room
      return {
        ...showtime,
        movie: movie ? movie : { title: "Phim không xác định" },
        room: room ? room : { name: "Phòng chiếu không xác định" },
      };
    });

    // Gửi danh sách suất chiếu kèm thông tin phim và phòng chiếu dưới dạng JSON
    res.json(showtimesWithDetails);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách suất chiếu:', error);
    res.status(500).send('Lỗi server');
  }
};

// // Thêm mới một suất chiếu
// const createShowtime = async (req, res) => {
//   try {
//     const { movie_id, start_time, room_id, ticket_price } = req.body;

//     // Kiểm tra xem phòng chiếu có tồn tại không
//     const room = await CinemaRoom.findOne({ room_id });
//     if (!room) {
//       return res.status(404).json({ message: "Phòng chiếu không tồn tại" });
//     }

//     const newShowtime = new Showtime({ movie_id, start_time, room_id, ticket_price });
//     await newShowtime.save();

//     res.status(201).json({ message: "Thêm suất chiếu thành công", showtime: newShowtime });
//   } catch (error) {
//     res.status(500).json({ message: "Lỗi khi thêm suất chiếu", error });
//   }
// };


// // Cập nhật suất chiếu
// const updateShowtime = async (req, res) => {
//   try {
//     const id = Number(req.params.id); // Chuyển đổi id từ chuỗi sang số
//     const updatedData = req.body;

//     // Kiểm tra xem phòng chiếu có tồn tại không nếu room_id được cập nhật
//     if (updatedData.room_id) {
//       const room = await CinemaRoom.findOne({ room_id: updatedData.room_id });
//       if (!room) {
//         return res.status(404).json({ message: "Phòng chiếu không tồn tại" });
//       }
//     }

//     // Tìm và cập nhật suất chiếu theo showtime_id
//     const updatedShowtime = await Showtime.findOneAndUpdate(
//       { showtime_id: id }, // Tìm theo showtime_id
//       updatedData,
//       { new: true }
//     );

//     if (!updatedShowtime) {
//       return res.status(404).json({ message: "Không tìm thấy suất chiếu cần cập nhật" });
//     }

//     res.status(200).json({ message: "Cập nhật suất chiếu thành công", showtime: updatedShowtime });
//   } catch (error) {
//     res.status(500).json({ message: "Lỗi khi cập nhật suất chiếu", error });
//   }
// };

  
// // Xóa một suất chiếu
// const deleteShowtime = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedShowtime = await Showtime.findByIdAndDelete(id);

//     if (!deletedShowtime) {
//       return res.status(404).json({ message: "Không tìm thấy suất chiếu cần xóa" });
//     }

//     res.status(200).json({ message: "Xóa suất chiếu thành công" });
//   } catch (error) {
//     res.status(500).json({ message: "Lỗi khi xóa suất chiếu", error });
//   }
// };


// Lấy xuất chiếu dựa trên ID
const getShowtimesByMovieId = async (req, res) => {
  // Lấy movieId từ tham số URL và chuyển thành kiểu Number
  const movieId = Number(req.params.id); // Chuyển params id thành Number

  // Ghi log để theo dõi request nhận được
  console.log(`Nhận request để tìm suất chiếu cho phim với ID: ${movieId}`);

  // Kiểm tra nếu movieId không hợp lệ
  if (isNaN(movieId)) {
    console.log(`Lỗi: movieId không hợp lệ: ${req.params.id}`);
    return res.status(400).send("Oops, có chút vấn đề với mã phim. Hãy thử lại nhé!"); // Thông báo thân thiện
  }

  try {
    // Ghi log bắt đầu quá trình tìm kiếm
    console.log(`Đang tìm suất chiếu cho phim ID: ${movieId}`);

    // Tìm tất cả suất chiếu với movie_id tương ứng
    const showtimes = await Showtime.find({ movie_id: movieId }).lean();

    // Kiểm tra nếu không tìm thấy suất chiếu nào
    if (showtimes.length === 0) {
      console.log(`Không tìm thấy suất chiếu cho phim ID: ${movieId}`);
      return res.status(404).send("Rất tiếc, hiện tại không có suất chiếu cho bộ phim này. Bạn có thể thử phim khác nhé!");
    }

    // Lấy thông tin phim dựa trên movie_id
    const movie = await Movie.findOne({ movie_id: movieId }).lean();

    // Kiểm tra nếu không tìm thấy thông tin phim
    if (!movie) {
      console.log(`Không tìm thấy thông tin phim với ID: ${movieId}`);
      return res.status(404).send("Không tìm thấy thông tin về bộ phim. Vui lòng kiểm tra lại.");
    }

    // Lấy thông tin tất cả các phòng chiếu
    const rooms = await CinemaRoom.find().lean();

    // Lấy thời gian hiện tại
    const currentDate = new Date();

    // Bổ sung thông tin chi tiết cho từng suất chiếu và lọc những suất chiếu đã hết
    const showtimesWithDetails = showtimes
      .filter((showtime) => new Date(showtime.start_time) >= currentDate) // Lọc suất chiếu chưa qua ngày hiện tại
      .map((showtime) => {
        // Tìm phòng chiếu tương ứng với room_id của suất chiếu
        const room = rooms.find((room) => room.room_id === showtime.room_id);
        return {
          ...showtime, // Giữ nguyên thông tin suất chiếu ban đầu
          movie: {
            // Thêm thông tin phim vào suất chiếu
            title: movie.title,
            description: movie.description,
            duration: movie.duration,
            release_date: movie.release_date,
            image_url: movie.image_url,
          },
          room: room
            ? {
                // Nếu tìm thấy phòng chiếu, thêm thông tin phòng
                room_name: room.room_name,
                seat_capacity: room.seat_capacity,
                reserved_seats: room.reserved_seats,
                is_active: room.is_active,
              }
            : { room_name: "Phòng không xác định" }, // Nếu không, đặt tên phòng mặc định
        };
      });

    // Kiểm tra nếu không có suất chiếu còn lại
    if (showtimesWithDetails.length === 0) {
      console.log("Hiện tại đã hết suất chiếu cho phim này.");
      return res.status(404).send("Hiện tại đã hết suất chiếu cho bộ phim này. Bạn có thể thử phim khác nhé!");
    }

    // Ghi log số lượng suất chiếu tìm được
    console.log(`Đã tìm thấy ${showtimesWithDetails.length} suất chiếu cho phim ID: ${movieId}`);
    return res.json(showtimesWithDetails); // Trả về danh sách chi tiết cho client
  } catch (error) {
    // Xử lý ngoại lệ và ghi log lỗi
    console.error("Lỗi khi truy vấn suất chiếu:", error);
    return res.status(500).send("Chúng tôi đang gặp chút sự cố kỹ thuật. Vui lòng thử lại sau!");
  }
};




module.exports = { getAllShowtimes,  getShowtimesByMovieId };
//createShowtime, updateShowtime, deleteShowtime,
