const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    const users = await User.find({ encrypted_yw_id: { $exists: false } });

    for (const u of users) {
      const newId = crypto.randomBytes(12).toString('hex');
      await User.updateOne(
        { _id: u._id },
        { $set: { encrypted_yw_id: newId } },
        { runValidators: false } // ❌ tắt validation để tránh lỗi username/password
      );
      console.log(`✅ Updated ${u.username || u._id} => ${newId}`);
    }

    console.log("🎉 Hoàn tất cập nhật encrypted_yw_id cho tất cả user chưa có.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  }
})();
