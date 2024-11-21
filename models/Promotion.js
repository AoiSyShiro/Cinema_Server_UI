const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const PromotionSchema = new mongoose.Schema({
  promotion_id: { type: Number, unique: true },
  showtime_id: { type: Number, required: true, ref: "Showtime" },
  discount_percentage: { type: Number, required: true },
});

PromotionSchema.plugin(AutoIncrement, { inc_field: "promotion_id" });

// Kiểm tra nếu model Promotion đã tồn tại, nếu chưa thì định nghĩa model mới
const Promotion =
  mongoose.models.Promotion || mongoose.model("Promotion", PromotionSchema);

module.exports = Promotion;
