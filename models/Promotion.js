const mongoose = require("mongoose");

const PromotionSchema = new mongoose.Schema({
  showtime_id: { type: Number, required: true, ref: "Showtime" }, 
  discount_percentage: { type: Number, required: true },
});

module.exports = mongoose.model("Promotion", PromotionSchema);
