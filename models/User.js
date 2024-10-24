const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const UserSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String, default: null },
  last_login: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  age: { type: Number, min: 0, default: null },
  gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  address: { type: String, default: null },
  role: { type: String, required: true, default: "user" },
});

UserSchema.plugin(AutoIncrement, { inc_field: "user_id" });

module.exports = mongoose.model("User", UserSchema);
