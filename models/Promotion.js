const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Define the promotion schema
const promotionSchema = new mongoose.Schema(
  {
    discount_percentage: { type: Number, required: true },
    promotion_id: { type: Number }, // The `promotion_id` is now auto-incremented
    discount_code: { type: String, required: false },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

// Automatically increment `promotion_id` for each new document
promotionSchema.plugin(AutoIncrement, { inc_field: "promotion_id" });

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
