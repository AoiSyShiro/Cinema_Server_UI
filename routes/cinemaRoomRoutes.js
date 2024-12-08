const express = require('express');
const router = express.Router();
const cinemaRoomController = require('../controllers/cinemaRoomController');

router.get('/', cinemaRoomController.getCinemaRooms);
router.post('/', cinemaRoomController.createCinemaRoom);
router.post('/:room_id', cinemaRoomController.updateCinemaRoom);
router.get('/delete/:room_id', cinemaRoomController.deleteCinemaRoom);
// Route để lấy thông tin phòng chiếu theo room_id
router.get('/:room_id', cinemaRoomController.getCinemaRoomById);
module.exports = router;
