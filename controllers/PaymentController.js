const axios = require('axios');

const ZALO_PAY_URL = "https://sandbox.zalopay.vn/v001/transaction"; // Địa chỉ API ZaloPay (sử dụng sandbox)

// Tự bỏ vào code nhé

// Thực hiện thanh toán
const createPayment = async (req, res) => {
    const { order_id, amount, description, return_url, notify_url } = req.body;

    const data = {
        appid: process.env.ZALO_APP_ID, // ID ứng dụng ZaloPay
        appuser: process.env.APP_USER, // Tên người dùng ứng dụng
        apikey: process.env.ZALO_API_KEY, // Khóa API của ứng dụng
        amount,
        order_id,
        description,
        return_url,
        notify_url,
        request_id: Date.now(), // ID yêu cầu để đảm bảo không trùng lặp
    };

    // Tạo chữ ký
    const signature = generateSignature(data); // Hàm generateSignature sẽ được định nghĩa bên dưới
    data['mac'] = signature; // Thêm chữ ký vào dữ liệu

    try {
        const response = await axios.post(ZALO_PAY_URL, data);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Lỗi khi thực hiện thanh toán:", error);
        res.status(500).json({ message: "Lỗi khi thực hiện thanh toán", error });
    }
};

// Hàm tạo chữ ký
const generateSignature = (data) => {
    const secretKey = process.env.ZALO_SECRET_KEY; // Khóa bí mật của ứng dụng
    const sortedData = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('&');
    return require('crypto').createHmac('sha256', secretKey).update(sortedData).digest('hex');
};

module.exports = {
    createPayment,
};
