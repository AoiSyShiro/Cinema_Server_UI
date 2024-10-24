const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ChooseSeatSchema = new mongoose.Schema({
  choose_seat_id: { type: Number, unique: true },
  book_tickets_id: { type: mongoose.Schema.Types.ObjectId, ref: "BookTickets", required: true }, // Tham chiếu đến BookTickets
  seat_number: { type: Number, required: true },
});

ChooseSeatSchema.plugin(AutoIncrement, { inc_field: "choose_seat_id" });

const ChooseSeat = mongoose.model("ChooseSeat", ChooseSeatSchema);

module.exports = ChooseSeat;
