const express = require("express");
const { getCurrentTrailers } = require("../controllers/TrailerController");

const router = express.Router();

// Route: Lấy trailer các phim đang chiếu tại rạp
router.get("/current", getCurrentTrailers);

module.exports = router;
