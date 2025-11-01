const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token, truy cập bị từ chối" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 🔍 Lấy user từ DB để đảm bảo tồn tại
    const user = await User.findById(decoded.userId).select('-password').lean();
    
    if (!user) {
      return res.status(401).json({ message: "User không tồn tại" });
    }

    // ✅ Gán toàn bộ thông tin user vào req.user
    req.user = {
      _id: user._id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      encrypted_yw_id: user.encrypted_yw_id,
      isAdmin: user.is_admin || decoded.isAdmin || false
    };

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

module.exports = authMiddleware;