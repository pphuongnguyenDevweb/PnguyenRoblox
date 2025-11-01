const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const History = require("../models/history.js");
const Order = require("../models/Order.js");

require("dotenv").config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_ENCRYPTED_YWID = process.env.ADMIN_ENCRYPTED_YWID ;

// ===================================
// 🧩 Đăng ký + Tự đăng nhập
// ===================================
router.post("/register", async (req, res) => {
  console.log("📩 Register request:", req.body);

  try {
    const { display_name, email, password } = req.body;

    // 🧩 Kiểm tra đầu vào
    if (!display_name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    // 🔍 Kiểm tra user đã tồn tại chưa
const existingUser = await User.findOne({
  $or: [
    { username: display_name }
  ]
});


if (existingUser) {
  return res.status(400).json({ message: "Tên người dùng đã tồn tại." });
}


    // 🔐 Mã hoá mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newYwId = crypto.randomBytes(16).toString("hex");

    // 🧱 Tạo user mới
    const newUser = new User({
      encrypted_yw_id: newYwId,
      username: display_name,
      display_name,
      email,
      password: hashedPassword,
      balance: 0,
    });

    await newUser.save();

    // 🎫 Tạo token đăng nhập luôn
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    // ✅ Trả về dữ liệu user cho frontend hiển thị thanh user
    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      token,
      user: {
        id: newUser._id,
        name: newUser.display_name,
        email: newUser.email,
        balance: newUser.balance,
      },
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký.",
      error: err.message,
    });
  }
});



// ===================================
// 🔐 Đăng nhập
// ===================================
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ message: "Tên và mật khẩu là bắt buộc." });
    }

    const user = await User.findOne({ username: name });
    if (!user)
      return res.status(400).json({ message: "Tên hoặc mật khẩu không đúng." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Tên hoặc mật khẩu không đúng." });

    const isAdmin = user.encrypted_yw_id === ADMIN_ENCRYPTED_YWID;
    const token = jwt.sign({ userId: user._id, isAdmin }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user._id,
        name: user.display_name,
        email: user.email,
        balance: user.balance,
        isAdmin,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ===================================
// 👤 Lấy thông tin user
// ===================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ===================================
// 💰 Cập nhật số dư (cả admin và user đều có thể update số dư riêng)
// ===================================
router.post("/update-balance", authMiddleware, async (req, res) => {
  try {
    const { userId, newBalance, reason } = req.body;

    if (!userId || newBalance == null)
      return res.status(400).json({ message: "Thiếu thông tin user hoặc số dư mới" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const oldBalance = user.balance;
    user.balance = newBalance;
    await user.save();

    // Ghi lại lịch sử thay đổi số dư
    const history = new History({
      userId: user._id,
      oldBalance,
      newBalance,
      reason: reason || "Cập nhật số dư",
      createdAt: new Date(),
    });
    await history.save();

    res.json({
      success: true,
      message: "Cập nhật số dư thành công",
      balance: user.balance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ===================================
// 📜 Lấy lịch sử giao dịch / thay đổi số dư
// ===================================
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy toàn bộ lịch sử của user, sắp xếp mới nhất trước
    const histories = await History.find({ userId })
      .sort({ createdAt: -1 })
      .select("-__v"); // loại bỏ __v

    res.json({
      success: true,
      userId,
      history: histories,
    });
  } catch (err) {
    console.error("History Fetch Error:", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
});



module.exports = router;