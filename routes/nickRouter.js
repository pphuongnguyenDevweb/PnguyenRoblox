// routes/nickRouter.js
const express = require("express");
const axios = require("axios");
const Product = require("../models/Product.js");
const User = require("../models/User.js");
const Order = require("../models/Order.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const router = express.Router();

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// 🧩 Lấy danh sách nick (hiển thị trong giao diện)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({ category: "Nick", is_active: true, sold: false });
    return res.json({
      success: true,
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        description: p.description,
        image_url: p.image_url,
      })),
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách nick:", err);
    return res.status(500).json({ success: false, error: "Lỗi máy chủ" });
  }
});

// 💳 Mua nick
router.post("/buy/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, category: "Nick", sold: false });
    if (!product) return res.json({ success: false, error: "Nick không tồn tại hoặc đã bán" });

    const user = await User.findById(req.user._id);
    if (!user) return res.json({ success: false, error: "Không tìm thấy user" });

    if (user.balance < product.price) {
      return res.json({ success: false, error: "Số dư không đủ để mua nick này" });
    }

    // ✅ Trừ tiền và đánh dấu đã bán
    user.balance -= product.price;
    product.sold = true;
    await user.save();
    await product.save();

    // ✅ Tạo lịch sử đơn hàng (Order)
    await Order.create({
      user_id: user._id,
      product_id: product._id,
      product_name: product.name,
      category: product.category,
      total_amount: product.price,
      username: product.username,
      password: product.password,
      note: product.note_admin,

      status: "completed",
      created_at: new Date(),
    });

    // 🧾 Gửi webhook (log giao dịch)
    if (WEBHOOK_URL) {
      await axios.post(WEBHOOK_URL, {
        content: `🛒 **${user.username}** đã mua TÀI KHOẢN **${product.name}** giá **${product.price.toLocaleString()}đ**`,
      });
    }

    // ✅ Trả thông tin tài khoản cho client
    return res.json({
      success: true,
      message: "Mua nick thành công!",
      account: {
        username: product.username,
        password: product.password,
        note: product.note_admin,
      },
      new_balance: user.balance,
    });

  } catch (err) {
    console.error("Lỗi mua nick:", err);
    return res.status(500).json({ success: false, error: "Lỗi máy chủ khi mua nick" });
  }
});


module.exports = router;
