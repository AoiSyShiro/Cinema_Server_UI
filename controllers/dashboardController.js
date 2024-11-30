const User = require('../models/User');
const Booking = require('../models/BookTickets');

exports.getDashboardStats = async (req, res) => {
    try {
      // Lấy tổng số người dùng
      const totalUsers = await User.countDocuments();
  
      // Tính tổng số vé và tổng số tiền đặt, đồng thời lấy tổng số bản ghi trong collection BookTickets
      const bookingStats = await Booking.aggregate([
        {
          $group: {
            _id: null,
            totalTickets: { $sum: { $size: "$seats" } }, // Tổng số vé (số lượng trong mảng seats)
            totalAmount: { $sum: '$price' },  // Tổng số tiền
            totalBookings: { $sum: 1 }, // Tổng số vé đã đặt (số bản ghi trong collection)
          },
        },
      ]);
  
      const stats = {
        totalUsers,
        totalTickets: bookingStats[0]?.totalTickets || 0,  // Tổng số vé
        totalAmount: bookingStats[0]?.totalAmount || 0,    // Tổng số tiền
        totalBookings: bookingStats[0]?.totalBookings || 0, // Tổng số lịch sử đặt vé (số lượng vé)
      };
  
      console.log(stats);  // Log stats để kiểm tra
  
      // Truyền dữ liệu thống kê vào view
      res.render('index', { stats: stats });  // Đảm bảo truyền đúng đối tượng stats
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
      res.status(500).send('Lỗi khi lấy thống kê');
    }
  };
  