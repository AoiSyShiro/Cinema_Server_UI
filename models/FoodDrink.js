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


FoodDrinkSchema.plugin(AutoIncrement, { inc_field: "food_drink_id" });

const FoodDrinkModel = mongoose.model("FoodDrink", FoodDrinkSchema);

module.exports = FoodDrinkModel;
