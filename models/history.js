const mongoose = require("mongoose");

// Schema cho lịch sử thay đổi số dư
const HistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  oldBalance: { 
    type: Number, 
    required: true 
  },
  newBalance: { 
    type: Number, 
    required: true 
  },
  reason: { 
    type: String, 
    default: "Cập nhật số dư" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Xuất model History
module.exports = mongoose.model("History", HistorySchema);
