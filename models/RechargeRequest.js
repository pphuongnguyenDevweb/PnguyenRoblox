const mongoose = require('mongoose');

const rechargeSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  network_provider: { type: String, required: true },
  denomination: { type: Number, required: true },
  card_serial: { type: String, required: true },
  card_code: { type: String, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const RechargeRequest = mongoose.model('RechargeRequest', rechargeSchema);

module.exports = RechargeRequest;
