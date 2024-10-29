const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ReviewSchema = new mongoose.Schema({
  review_id: { type: Number, unique: true },
  book_tickets_id: { type: Number, required: true, ref: "BookTickets" }, // Changed to Number
  comment: { type: String },
  rate: { type: Number, min: 1, max: 10, required: true },
  created_at: { type: Date, default: Date.now },
});

ReviewSchema.plugin(AutoIncrement, { inc_field: "review_id" });

const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;
