const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const movieSchema = new mongoose.Schema({
  movie_id: { type: Number, unique: true }, 
  title: { type: String, required: true },
  description: { type: String },
  trailer_url: { type: String },
  category_id: { type: Number, required: true, ref: "Category" }, 
  duration: { type: Number },
  release_date: { type: Date },
  image_url: { type: String },
  coming_soon: { type: Boolean, default: false } // Thêm trường coming_soon
});

movieSchema.plugin(AutoIncrement, { inc_field: "movie_id" });

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
