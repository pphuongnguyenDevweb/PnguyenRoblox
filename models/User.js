const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  encrypted_yw_id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true }, // thêm username
  display_name: { type: String, default: "Anonymous User" },
  email: { type: String, unique: true, sparse: true, index: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "https://qhuyroblox.com/images/avatar/av-1.svg" },
  balance: { type: Number, default: 0, min: 0 },
  is_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema, "users");
