const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const BookTicketsSchema = new mongoose.Schema({
  book_tickets_id: { type: Number, unique: true },
  user_id: { type: Number, required: true, ref: "User" }, 
  showtime_id: { type: Number, required: true, ref: "Showtime" }, 
  booking_time: { type: Date, default: Date.now },
  payment_method: { type: String },
  qr_code: { type: String },
  flag: { type: Number, default: 0 },
});

BookTicketsSchema.plugin(AutoIncrement, { inc_field: "book_tickets_id" });

const BookTickets = mongoose.model("BookTickets", BookTicketsSchema);

module.exports = BookTickets;
