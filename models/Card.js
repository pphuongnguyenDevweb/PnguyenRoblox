const mongoose = require('mongoose');


const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardType: String,
  cardNumber: String,
  amount: Number,
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  date: { type: Date, default: Date.now },
});

const Card = mongoose.model("Card", cardSchema);

module.exports = Card;
