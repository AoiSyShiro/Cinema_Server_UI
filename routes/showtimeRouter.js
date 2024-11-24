const express = require("express");
const {
  getAllShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getShowtimesByMovieId,
} = require("../controllers/ShowtimeController");

const router = express.Router();

// Route: Lấy danh sách tất cả suất chiếu
router.get("/", getAllShowtimes);

// Route: Thêm mới một suất chiếu
router.post("/", createShowtime);

// Route: Cập nhật một suất chiếu theo ID
router.put("/:id", updateShowtime);

// Route: Xóa một suất chiếu theo ID
router.delete("/:id", deleteShowtime);

router.get("/:id", getShowtimesByMovieId);

module.exports = router;
