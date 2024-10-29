const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const FoodDrinkSchema = new mongoose.Schema({
  food_drink_id: { type: Number, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
  image: { type: String },
});

// Middleware để cập nhật `updated_at`
FoodDrinkSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

FoodDrinkSchema.plugin(AutoIncrement, { inc_field: "food_drink_id" });

const FoodDrinkModel = mongoose.model("FoodDrink", FoodDrinkSchema);

module.exports = FoodDrinkModel;
