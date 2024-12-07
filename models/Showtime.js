const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ShowtimeSchema = new mongoose.Schema({
  showtime_id: { type: Number, unique: true }, 
  movie_id: { type: Number, required: true, ref: "Movie" },
  start_time: { type: Date, required: true },
  room_id: { type: Number, required: true, ref: "CinemaRoom" }, // Tham chiếu đến CinemaRoom
  ticket_price: { type: Number, required: true },
});

ShowtimeSchema.plugin(AutoIncrement, { inc_field: 'showtime_id' });

module.exports = mongoose.model('Showtime', ShowtimeSchema);
