const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes"); //

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configure multer with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "movies",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

dotenv.config();

const upload = multer();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logRequestInfo = (req, res, next) => {
  const start = Date.now();
  const { method, path } = req;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  console.log("Thông tin yêu cầu:", method, path, ip, new Date().toISOString());

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      "Trạng thái phản hồi:",
      res.statusCode,
      "Thời gian xử lý (ms):",
      duration
    );
  });

  next();
};

app.use(logRequestInfo);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", { title: "Trang chủ" });
});

app.post("/upload", upload.single("movieImage"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tải lên", error: error.message });
  }
});

app.use("/auth", userRoutes);

const PORT = process.env.PORT || 5000;
const connectToDatabase = require("./config/db.js");

const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, async () => {
    console.log(`Server đang chạy ở cổng ${PORT}`);
    const open = await import("open");
    await open.default(`http://localhost:${PORT}`);
  });
};

startServer();
