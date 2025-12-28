
const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CashTransaction', cashTransactionSchema);