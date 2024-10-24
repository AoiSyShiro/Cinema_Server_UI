const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ChooseFoodDrinkSchema = new mongoose.Schema({
  choose_food_drink_id: { type: Number, unique: true },
  book_tickets_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BookTickets",
    required: true,
  },
  food_drink_id: { type: Number, required: true, ref: "FoodDrink" },
  amount: { type: Number, required: true },
});

ChooseFoodDrinkSchema.plugin(AutoIncrement, {
  inc_field: "choose_food_drink_id",
});

const ChooseFoodDrink = mongoose.model(
  "ChooseFoodDrink",
  ChooseFoodDrinkSchema
);

module.exports = ChooseFoodDrink;
