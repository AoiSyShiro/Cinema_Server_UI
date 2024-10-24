const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const CategorySchema = new mongoose.Schema({
  category_id: { type: Number, unique: true },
  name: { type: String, required: true },
  description: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
});

CategorySchema.plugin(AutoIncrement, { inc_field: "category_id" });

module.exports = mongoose.model("Category", CategorySchema);
