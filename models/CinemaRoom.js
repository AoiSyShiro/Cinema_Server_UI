const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

// Khởi tạo mongoose-auto-increment với kết nối mongoose
AutoIncrement.initialize(mongoose.connection);

const cinemaRoomSchema = new Schema({
  room_id: { type: Number, required: true, unique: true },
  room_name: { type: String, required: true },
  seat_capacity: { type: Number, required: true },
  reserved_seats: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  duration: { type: Number, required: true },  // duration in hours
  movie_id: { type: Number, required: true }, // Now a number instead of ObjectId
});

// Áp dụng AutoIncrement cho trường room_id
cinemaRoomSchema.plugin(AutoIncrement.plugin, { model: 'CinemaRoom', field: 'room_id' });

const CinemaRoom = mongoose.model('CinemaRoom', cinemaRoomSchema);

module.exports = CinemaRoom;
