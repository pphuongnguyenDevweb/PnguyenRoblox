const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const halloweenGameSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
    level: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    rewardClaimed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HalloweenGame', halloweenGameSchema);
