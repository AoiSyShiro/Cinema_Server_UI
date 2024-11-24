const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const BookTicketsSchema = new mongoose.Schema({
  book_tickets_id: { type: Number, unique: true },
  user_id: { type: Number, required: true, ref: "User" },
  showtime_id: { type: Number, required: true, ref: "Showtime" },
  movie_id: { type: Number, required: true, ref: "Movie" },
  booking_time: { type: Date, default: Date.now },
  payment_method: { type: String, default: "N/A" },
  qr_code: { type: String },
  flag: { type: Number, default: 0 },
  seats: { type: [String], required: true },
  price: { type: Number, required: true }, 
  food_drinks: [{
    food_drink_id: { type: Number, ref: "FoodDrink" },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] }
  }],
}, { timestamps: true });

// Add index for user_id and showtime_id to improve query performance
BookTicketsSchema.index({ user_id: 1 });
BookTicketsSchema.index({ showtime_id: 1 });

// Auto increment for book_tickets_id field
BookTicketsSchema.plugin(AutoIncrement, { inc_field: "book_tickets_id" });

const BookTickets = mongoose.model("BookTickets", BookTicketsSchema);

module.exports = BookTickets;
