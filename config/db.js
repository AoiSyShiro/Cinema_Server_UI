// Import thư viện mongoose để làm việc với MongoDB
const mongoose = require('mongoose');
// Import dotenv để đọc các biến môi trường từ tệp .env
const dotenv = require('dotenv');

// Cấu hình dotenv để có thể sử dụng biến môi trường từ tệp .env
dotenv.config();

// Hàm kết nối đến cơ sở dữ liệu MongoDB
const connectToDatabase = async () => {
    try {
        // Sử dụng mongoose để kết nối đến cơ sở dữ liệu với chuỗi kết nối từ biến môi trường MONGO_URI
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Kết nối đến MongoDB thành công'); // In ra thông báo thành công nếu kết nối thành công
    } catch (err) {
        // Xử lý lỗi nếu không thể kết nối
        console.error('Không thể kết nối đến MongoDB:', err.message); // In ra thông báo lỗi
        process.exit(1); // Thoát chương trình với mã lỗi 1
    }
};

// Xuất hàm connectToDatabase để sử dụng trong các phần khác của ứng dụng
module.exports = connectToDatabase;
