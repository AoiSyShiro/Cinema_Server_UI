const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Kết nối đến MongoDB thành công');
    } catch (err) {
        console.error('Không thể kết nối đến MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectToDatabase;
