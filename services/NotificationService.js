const admin = require('firebase-admin');

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('../serviceAccountKey.json')), // Đường dẫn tới file serviceAccountKey.json
});

// Hàm gửi thông báo
const sendNotification = async (deviceToken, title, body) => {
  const payload = {
    notification: {
      title,
      body,
    },
    token: deviceToken,
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log('Thông báo đã được gửi:', response);
  } catch (error) {
    console.error('Lỗi khi gửi thông báo:', error);
  }
};

module.exports = { sendNotification };  // Đảm bảo xuất đúng
