const express = require('express');
const router = express.Router();
const cinemaRoomController = require('../controllers/cinemaRoomController');

router.get('/', cinemaRoomController.getCinemaRooms);
router.post('/', cinemaRoomController.createCinemaRoom);
router.post('/:room_id', cinemaRoomController.updateCinemaRoom);
router.get('/delete/:room_id', cinemaRoomController.deleteCinemaRoom);

module.exports = router;
