const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cinemaRoomSchema = new Schema({
  room_id: { type: Number, unique: true },
  room_name: { type: String, required: true },
  seat_capacity: { type: Number, required: true },
  reserved_seats: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  duration: { type: Number, required: true },
  movie_id: { type: Number, required: true },
});

cinemaRoomSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Tìm tài liệu có room_id lớn nhất
    const lastRoom = await mongoose.model('CinemaRoom').findOne().sort({ room_id: -1 }).exec();
    // Tăng room_id lên 1
    this.room_id = lastRoom ? lastRoom.room_id + 1 : 1;
  }
  next();
});

const CinemaRoom = mongoose.model('CinemaRoom', cinemaRoomSchema);

module.exports = CinemaRoom;