// server.js - Phiên bản Hoàn Chỉnh (Đã tích hợp JWT, Auth, Transaction)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // 🔑 Thư viện JWT
const bcrypt = require('bcryptjs'); // 🔒 Thư viện mã hóa mật khẩu
const path = require('path'); // 🌐 Thư viện path cho tệp tĩnh
const { verifyKeyMiddleware, InteractionResponseType, InteractionType } = require('discord-interactions');
const authRouter = require("./routes/authRoutes.js"); 
const { verifyToken } = require('./middleware/authMiddleware.js'); // định dạng tài khoản
const authMiddleware = require('./middleware/authMiddleware.js');
const User = require('./models/User.js');
const Order = require('./models/Order.js');
const RechargeRequest = require('./models/RechargeRequest.js');
const Product = require('./models/Product.js');
const History = require('./models/history.js');
const Notification = require('./models/Notification.js');
const axios = require('axios');
const halloween = require('./halloween');
const nickRouter = require("./routes/nickRouter.js");
const { Client, GatewayIntentBits } = require('discord.js');
const CashTransaction = require('./models/CashTransaction.js');




//123




// Đường dẫn tuyệt đối đến các thư mục tĩnh
const publicPath = path.join(__dirname, 'public');
const imagesPath = path.join(publicPath, 'images');
const productPath = path.join(publicPath, 'product');







// =================================================================
// KHỞI TẠO VÀ CẤU HÌNH CƠ BẢN
// =================================================================
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const ADMIN_ENCRYPTED_YWID = process.env.ADMIN_ENCRYPTED_YWID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Hàm kết nối DB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Connected!');
    } catch (err) {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
};

const logError = require("./checkerror.js");

// Ví dụ log lỗi khi route gặp vấn đề:
app.use((err, req, res, next) => {
  logError(err);
  res.status(500).json({ error: "Server Internal Error" });
});

// =================================================================
// MIDDLEWARE IS ADMIN
// =================================================================



// --- Middleware kiểm tra quyền Admin ---
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Bạn chưa đăng nhập.' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Bạn không có quyền truy cập trang quản trị.' });
  }

  next();
};


// =================================================================
// 🔑 MIDDLEWARE XÁC THỰC JWT
// =================================================================




// =================================================================
// 🧩 DISCORD INTERACTIONS HANDLER
// =================================================================



app.post(
  '/api/discord/interactions',
  express.raw({ type: 'application/json' }),
  verifyKeyMiddleware(DISCORD_PUBLIC_KEY),
  async (req, res) => {
    try {
      // --- Giải mã payload ---
      const interaction =
        req.body instanceof Buffer
          ? JSON.parse(req.body.toString('utf8'))
          : req.body;

      // --- Ping check ---
      if (interaction.type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
      }

      // --- Message Component ---
      if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        const customId = interaction.data?.custom_id;
        const match = customId?.match(
          /process_(order|recharge)_(.+)_(completed|failed)/
        );

        if (!match) {
          return res.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '❌ Custom ID không hợp lệ.',
              flags: 64,
            },
          });
        }

        // Tách thông tin
        const [, type, objectId, status] = match;

        // ⚡ Phản hồi sớm cho Discord (tránh lỗi headers sent)
        res.json({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });

        // --- Thực thi xử lý backend ---
        let result;
        try {
          result = await fetch(
            `https://pnguyenroblox.onrender.com/api/admin/update-status-discord`,//---------CHỖ ĐỂ DÁN URL !!!--------------------------------------------------------------------------------------------------------------------------
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
              body: JSON.stringify({
                type,
                id: objectId,
                status,
                admin_note: 'Duyệt từ Discord',
              }),
            }
          ).then((r) => r.json());
        } catch (err) {
          console.error('⚠️ Lỗi gọi API update-status-discord:', err);
          return;
        }

        // --- Kiểm tra dữ liệu trả về ---
        const detail =
          type === 'order'
            ? result?.result?.order
            : result?.result?.rechargeRequest;

        if (!detail) {
          console.warn(
            `⚠️ Không tìm thấy dữ liệu detail cho ${type} ${objectId}:`,
            result
          );
          return;
        }

        // --- Lấy thông tin user ---
        const user = await User.findById(detail.user_id)
          .select('display_name encrypted_yw_id')
          .lean()
          .catch(() => null);

        if (!user) {
          console.warn('⚠️ Không tìm thấy user khi xử lý Discord:', detail.user_id);
          return;
        }

        // --- Gửi thông báo realtime ---
        try {
          await sendAdminNotification(
            `${type}_${status}`,
            `${type} #${objectId.substring(0, 8)} đã xử lý`,
            detail,
            user
          );
        } catch (err) {
          console.warn('⚠️ Lỗi khi gửi public notification Discord:', err.message);
        }

        // --- Cập nhật lại message Discord ---
        try {
          const channelId = interaction.channel_id;
          const messageId = interaction.message.id;

          const newColor = status === 'completed' ? 5763719 : 15548997;
          const emoji = status === 'completed' ? '✅' : '❌';
          const statusText =
            status === 'completed' ? 'HOÀN THÀNH' : 'HỦY/TỪ CHỐI';

          await fetch(
            `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              },
              body: JSON.stringify({
                content: `**${emoji} ${type.toUpperCase()} (#${objectId.substring(
                  0,
                  8
                )}) đã ${statusText} ${emoji}**`,
                embeds: (interaction.message.embeds || []).map((embed) => ({
                  ...embed,
                  color: newColor,
                  title: (embed.title || '').replace('MỚI', 'ĐÃ XỬ LÝ'),
                  footer: { text: `Status: ${statusText}` },
                })),
                components: [],
              }),
            }
          );
        } catch (err) {
          console.error('⚠️ Lỗi cập nhật message Discord:', err.message);
        }
      }
    } catch (err) {
      console.error('🔥 Discord Interaction Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Discord interaction error.' });
      }
    }
  }
);




// Global body-parser và CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/auth", authRouter);
app.use('/api/halloween', halloween);
app.use("/api/nick", nickRouter);









app.post('/api/admin/update-status-discord', async (req, res) => {
    const { type, id, status, admin_note } = req.body;

    if (!['order', 'recharge'].includes(type) || !['completed', 'failed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ.' });
    }

    try {
        let result;
        
        // 🔑 Gán thông tin Admin cho req.user để các hàm processInternal hoạt động
        const adminUser = await User.findOne({ encrypted_yw_id: ADMIN_ENCRYPTED_YWID }).lean();
        if (!adminUser) {
             throw new Error("Không tìm thấy Admin User trong DB.");
        }
        // Giả lập req.user như thể Admin đã đăng nhập
        req.user = { ...adminUser, isAdmin: true }; 
        
        // Lấy thông tin người dùng sở hữu giao dịch để gọi sendAdminNotification
        let transaction;
        if (type === 'order') {
             transaction = await Order.findById(id).lean();
             if (!transaction) throw new Error("Không tìm thấy đơn hàng.");
             result = await processOrderInternal(id, status, ADMIN_ENCRYPTED_YWID, admin_note);
        } else if (type === 'recharge') {
             transaction = await RechargeRequest.findById(id).lean();
             if (!transaction) throw new Error("Không tìm thấy yêu cầu nạp thẻ.");
             result = await processRechargeInternal(id, status, ADMIN_ENCRYPTED_YWID, admin_note);
        }

        // Lấy lại user sau khi giao dịch đã được xử lý
        const targetUser = await User.findById(transaction.user_id).select('-password').lean();

        // 🔑 GỌI HÀM THÔNG BÁO SAU KHI XỬ LÝ (Để kích hoạt Real-time/Socket.IO cho User)
        if (result.success) {
            const detail = type === 'order' ? result.order : result.rechargeRequest;
            // Dùng type+status để gửi thông báo Real-time cho User
            sendAdminNotification(`${type}_${status}`, 'Trạng thái giao dịch đã được cập nhật.', detail, targetUser);
        }

        return res.json({ success: true, type, id, status, result });

    } catch (err) {
        console.error('Update status (Discord) error:', err.message, err.stack);
        res.status(500).json({ success: false, error: err.message || 'Lỗi khi cập nhật trạng thái.' });
    }
});


app.post('/api/admin/update-status-manual', authMiddleware, isAdmin, async (req, res) => {
    const { type, id, status, admin_note } = req.body;

    if (!['order', 'recharge'].includes(type) || !['completed', 'failed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ.' });
    }

    try {
        let result;
        
        if (type === 'order') {
            result = await processOrderInternal(id, status, req.user.encrypted_yw_id, admin_note);
        } else if (type === 'recharge') {
            result = await processRechargeInternal(id, status, req.user.encrypted_yw_id, admin_note);
        }
        
        // Lấy thông tin người dùng sở hữu giao dịch
        const transaction = type === 'order' ? await Order.findById(id).lean() : await RechargeRequest.findById(id).lean();
        const targetUser = await User.findById(transaction.user_id).select('-password').lean();

        // 🔑 GỌI HÀM THÔNG BÁO SAU KHI XỬ LÝ (Để kích hoạt Real-time/Socket.IO cho User)
        if (result.success) {
            const detail = type === 'order' ? result.order : result.rechargeRequest;
            sendAdminNotification(`${type}_${status}`, 'Trạng thái giao dịch đã được cập nhật.', detail, targetUser);
        }

        return res.json({ success: true, type, id, status, result });

    } catch (err) {
        console.error('Update status (Manual) error:', err.message, err.stack);
        res.status(500).json({
            success: false,
            error: err.message || 'Lỗi khi cập nhật trạng thái.',
            stack: err.stack
        });
    }
});




// =================================================================
// 🌐 KHẮC PHỤC LỖI TỆP TĨNH & ROUTE GỐC
// =================================================================

const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));
app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// =================================================================
// CÁC HÀM XỬ LÝ (Helper Functions)
// =================================================================

/** Lấy User từ Header/JWT và tạo mới nếu cần */
async function getUserFromHeaders(req) {
    if (req.user) {
        return { user: req.user, isAdmin: req.user.isAdmin || (req.user.encrypted_yw_id === ADMIN_ENCRYPTED_YWID) };
    }
    
    const encryptedYwId = req.headers['x-encrypted-yw-id'];
    if (!encryptedYwId) {
        return { user: null, isAdmin: false };
    }
    
    let user = await User.findOne({ encrypted_yw_id: encryptedYwId }).lean();
    
    if (!user) {
        const shortId = encryptedYwId.substring(0, 4);
        user = await user.create({ 
            encrypted_yw_id: encryptedYwId, 
            display_name: `Khách_${shortId}_${crypto.randomBytes(2).toString('hex')}` 
        });
        user = user.toObject();
    }
    
    user.isAdmin = user.encrypted_yw_id === ADMIN_ENCRYPTED_YWID; 
    
    return { user, isAdmin: user.isAdmin };
}
module.exports = { getUserFromHeaders };

/** Xử lý nội bộ việc duyệt/hủy đơn hàng (Giữ nguyên logic Transaction) */
// =========================
// ✅ PROCESS ORDER INTERNAL
// =========================
async function processOrderInternal(orderId, status, adminYwId, adminNote = null) {
  if (!['completed', 'failed'].includes(status)) {
    throw new Error('Trạng thái đơn hàng không hợp lệ.');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findOne({ _id: orderId, status: 'pending' }).session(session);
    if (!order) {
      throw new Error(`Đơn hàng #${orderId.toString().substring(0, 8)} không tìm thấy hoặc đã được xử lý.`);
    }

    const updateData = {
      status,
      admin_note: adminNote || `Processed by ${adminYwId.substring(0, 8)}`,
      processed_by: adminYwId,
      processed_at: new Date(),
    };

    if (status === 'failed') {
      await User.updateOne(
        { _id: order.user_id },
        { $inc: { balance: order.total_amount }, updated_at: new Date() }
      ).session(session);
      await Product.updateOne({ _id: order.product_id }, { $inc: { inventory_count: 1 } }).session(session);
    } else if (status === 'completed') {
      await Product.updateOne({ _id: order.product_id }, { $inc: { sold: 1 } }).session(session);
    }

    await Order.updateOne({ _id: orderId }, updateData).session(session);

    await session.commitTransaction();
    const updatedOrder = await Order.findById(orderId).lean();

    return { success: true, order: updatedOrder };
  } catch (error) {
    // ✅ chỉ abort nếu transaction còn đang active
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    throw error;
  } finally {
    await session.endSession();
  }
}


// ============================
// ✅ PROCESS RECHARGE INTERNAL (bản fix an toàn)
// ============================
async function processRechargeInternal(rechargeId, status, adminYwId, adminNote = null) {
  if (!['completed', 'failed'].includes(status)) {
    throw new Error('Trạng thái nạp thẻ không hợp lệ.');
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ✅ tìm yêu cầu còn đang pending
    const rechargeRequest = await RechargeRequest.findOne({ _id: rechargeId, status: 'pending' }).session(session);
    if (!rechargeRequest) {
      throw new Error(`Yêu cầu nạp thẻ #${rechargeId.toString().substring(0, 8)} không tìm thấy hoặc đã được xử lý.`);
    }

    // ✅ chuẩn bị dữ liệu update
    const updateData = {
      status,
      admin_note: adminNote || `Processed by ${adminYwId?.substring(0, 8) || 'System'}`,
      processed_by: adminYwId,
      processed_at: new Date(),
    };

    // ✅ nếu duyệt thành công, cộng tiền user
    if (status === 'completed') {
      await User.updateOne(
        { _id: rechargeRequest.user_id },
        { $inc: { balance: rechargeRequest.denomination || 0 }, updated_at: new Date() }
      ).session(session);
    }

    // ✅ cập nhật request
    await RechargeRequest.updateOne({ _id: rechargeId }, updateData).session(session);

    await session.commitTransaction();

    const updatedRequest = await RechargeRequest.findById(rechargeId).lean();
    return { success: true, rechargeRequest: updatedRequest };

  } catch (error) {
    // ✅ tránh abort 2 lần (fix lỗi chính)
    if (session.inTransaction()) {
      try { await session.abortTransaction(); } catch {}
    }
    throw error;

  } finally {
    await session.endSession();
  }
}

/** Gửi thông báo (Giữ nguyên logic) */
const sendAdminNotification = async (type, message, detail = {}, user = {}) => {
    // --- Gửi thông báo đến Admin ---
    const notification = { type, message, timestamp: new Date(), detail: { id: detail._id } };
    io.to('adminRoom').emit('newNotification', notification);

    // --- Gửi thông báo công khai ---
    try {
        if (type === 'new_order') {
            const productName = detail?.product_name || 'Sản phẩm';
            const rawPrice = Number(detail?.product_price);
            const productPrice = isNaN(rawPrice) ? 0 : rawPrice;

            const publicMessage = `🛒 **${user?.display_name || 'Khách'}** đã mua **${productName}** với **${productPrice.toLocaleString()}đ**!`;
            io.emit('public_notification', { type: 'purchase', message: publicMessage });
            

        } else if (type === 'new_recharge') {
            const rawDenom = Number(detail?.denomination);
            const denom = isNaN(rawDenom) ? 0 : rawDenom;
            const isBigRecharge = denom >= 100000;

            const publicMessage = `💳 **${user?.display_name || 'Khách'}** đã nạp ${isBigRecharge ? '🎉 MỆNH GIÁ LỚN' : denom.toLocaleString() + 'đ'}!`;
            io.emit('public_notification', { type: 'recharge', message: publicMessage });
            
        }
    } catch (err) {
        console.warn('⚠️ Lỗi khi gửi Public Notification:', err.message);
    }

    // --- Gửi thông báo Discord ---
    if (DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID && (type === 'new_order' || type === 'new_recharge')) {
        let title = '';
        let color = 16763904;
        let fields = [];
        let components = [];
        const objectId = detail?._id?.toString?.() || 'unknown';
        const userId = user?._id?.toString?.() || 'Unknown';
        const userName = user?.display_name || user?.encrypted_yw_id?.substring?.(0, 8) || 'Unknown User';

        try {
            if (type === 'new_order') {
                const productName = detail.product_name || 'Sản phẩm';
                const productPrice = Number(detail.product_price) || 0;
                const cookie = detail.cookie || null;

                let cookieDisplay = "Không có";
                if (cookie) {
                    if (cookie.startsWith("http")) cookieDisplay = `🔗 Link: ${cookie}`;
                    else if (cookie.length > 60) cookieDisplay = `🔒 Chuỗi cookie: \`${cookie.slice(0, 60)}...\``;
                    else cookieDisplay = `🔒 Chuỗi cookie: \`${cookie}\``;
                }

                title = `🛒 ĐƠN HÀNG MỚI (#${objectId.substring(0, 8)})`;
                color = 3447003;
                fields = [
                    { name: "👤 Người dùng", value: String(userName), inline: true },
                    { name: "💰 Số tiền", value: `${productPrice.toLocaleString()}đ`, inline: true },
                    { name: "📦 Sản phẩm", value: productName, inline: true },
                    { name: "🧾 Tài khoản", value: `\`${detail.username || 'N/A'}\``, inline: false },
                    { name: "🔑 Mật khẩu", value: `\`${detail.password || 'N/A'}\``, inline: false },
                    { name: "📝 Ghi chú", value: detail.note || "Không có", inline: false },
                    { name: "🍪 Cookie / 2FA", value: cookieDisplay, inline: false }
                ];

                components = [{
                    type: 1,
                    components: [
                        { type: 2, style: 3, label: "✅ THÀNH CÔNG", custom_id: `process_order_${objectId}_completed` },
                        { type: 2, style: 4, label: "❌ THẤT BẠI (Hoàn tiền)", custom_id: `process_order_${objectId}_failed` }
                    ]
                }];

            } else if (type === 'new_recharge') {
                const denom = Number(detail.denomination) || 0;
                title = `💳 YÊU CẦU NẠP THẺ (#${objectId.substring(0, 8)})`;
                color = 16750899;
                fields = [
                    { name: "👤 Người dùng", value: String(userName), inline: true },
                    { name: "💰 Mệnh giá", value: `${denom.toLocaleString()}đ`, inline: true },
                    { name: "🏷️ Nhà mạng", value: detail.network_provider || 'N/A', inline: true },
                    { name: "🔢 Serial", value: `\`${detail.card_serial || 'N/A'}\``, inline: false },
                    { name: "🔣 Mã thẻ", value: `\`${detail.card_code || 'N/A'}\``, inline: false },
                    { name: "📝 Ghi chú", value: detail.note || "Không có", inline: false }
                ];

                components = [{
                    type: 1,
                    components: [
                        { type: 2, style: 3, label: "✅ THÀNH CÔNG (Cộng tiền)", custom_id: `process_recharge_${objectId}_completed` },
                        { type: 2, style: 4, label: "❌ THẤT BẠI", custom_id: `process_recharge_${objectId}_failed` }
                    ]
                }];
            }
        } catch (err) {
            console.error('❌ Lỗi khi tạo Discord Embed:', err.message);
            title = `⚠️ LỖI DATA: ${title || 'Giao dịch mới'}`;
        }

        // Gửi đến Discord
        try {
            await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
                },
                body: JSON.stringify({
                    content: '@everyone',
                    embeds: [{
                        title,
                        color,
                        fields,
                        timestamp: new Date().toISOString(),
                        footer: { text: `User ID: ${userId} | Status: pending | ID: ${objectId}` }
                    }],
                    components
                })
            });
            console.log(`✅ Discord notification sent for ${type}: ${objectId.substring(0, 8)}`);
        } catch (err) {
            console.error('❌ Lỗi gửi Discord:', err.message);
        }
    }

    // --- Cập nhật realtime cho User/Admin ---
    if (user && type && (type.includes('completed') || type.includes('failed'))) {
        try {
            const updatedUser = await User.findById(user._id).select('balance encrypted_yw_id').lean();
            if (!updatedUser) return;

            let userMessage = '';
            if (type.includes('order')) {
                userMessage = type.includes('completed')
                    ? `Đơn hàng #${detail._id.toString().substring(0, 8)} đã được **DUYỆT**! 🎉`
                    : `Đơn hàng #${detail._id.toString().substring(0, 8)} đã bị **HỦY**. ${detail.total_amount?.toLocaleString() || 0}đ đã được hoàn lại. 💸`;

                io.to(updatedUser.encrypted_yw_id).emit('order_status_update', {
                    id: detail._id,
                    status: detail.status,
                    message: userMessage,
                    new_balance: updatedUser.balance
                });

            } else if (type.includes('recharge')) {
                userMessage = type.includes('completed')
                    ? `Yêu cầu nạp thẻ #${detail._id.toString().substring(0, 8)} đã được **DUYỆT**. ${detail.denomination?.toLocaleString() || 0}đ đã được cộng vào số dư. ✅`
                    : `Yêu cầu nạp thẻ #${detail._id.toString().substring(0, 8)} đã bị **TỪ CHỐI**! ❌`;

                io.to(updatedUser.encrypted_yw_id).emit('recharge_status_update', {
                    id: detail._id,
                    status: detail.status,
                    message: userMessage,
                    new_balance: updatedUser.balance
                });
            }

            io.to('adminRoom').emit('transaction_status_update', {
                id: detail._id,
                status: detail.status,
                type: type.split('_')[0]
            });
        } catch (err) {
            console.error('❌ Lỗi gửi Realtime:', err.message);
        }
    }
};









//  SOCKET.IO REALTIME SETUP

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('joinAdmin', (key) => {
        if (key === ADMIN_ENCRYPTED_YWID) {
            socket.join('adminRoom');
            console.log(`${socket.id} joined adminRoom.`);
            socket.emit('adminConnected', { message: 'Welcome Admin!' }); 
        } else {
             socket.emit('adminAuthFailed', { message: 'Authentication failed.' });
        }
    });
    socket.on('joinUser', (encryptedYwId) => {
        if (encryptedYwId) {
            socket.join(encryptedYwId);
            
        }
    });
    socket.on('disconnect', () => {
        
    });
});










//   LẤY THÔNG TIN USER
app.get('/api/user/me', authMiddleware, async (req, res) => {
    try {
        // ✅ Lấy thông tin user, bao gồm encrypted_yw_id để client join socket
const userId = req.user._id || req.user.userId;
const user = await User.findById(userId)
             .select('username display_name balance avatar email is_admin encrypted_yw_id created_at updated_at')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Người dùng không tồn tại.'
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,               // 👈 thêm username
                display_name: user.display_name,
                balance: user.balance,
                avatar: user.avatar,
                email: user.email,
                is_admin: user.is_admin,
                encrypted_yw_id: user.encrypted_yw_id,
                created_at: user.created_at,
                updated_at: user.updated_at // 👈 cần cho realtime join
            }
        });

    } catch (error) {
        console.error("User ME Error:", error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy thông tin người dùng.'
        });
    }
});




// ✅ LẤY DANH SÁCH SẢN PHẨM

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true })
      .select('name price category inventory_count');
    res.json({ success: true, products });
  } catch (err) {
    console.error('❌ Lỗi tải sản phẩm:', err.message);
    res.status(500).json({ error: err.message });
  }
});






// ✅  ĐẶT HÀNG

app.post('/api/order', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { username, password, note, cookie,  price, product_name } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        const missingFields = [];
        if (!username) missingFields.push('username');
        if (!password) missingFields.push('password');
        if (!price && price !== 0) missingFields.push('price');
        if (!product_name) missingFields.push('product_name');

        if (missingFields.length > 0) {
            await session.abortTransaction();
            return res.status(400).json({
                error: `Thiếu dữ liệu bắt buộc: ${missingFields.join(', ')}`,
                missing_fields: missingFields
            });
        }

        // 🔍 Tìm sản phẩm trong DB theo tên
        const product = await Product.findOne({ name: { $regex: `^${product_name.trim()}$`, $options: 'i' } }).lean();

        if (!product) {
            await session.abortTransaction();
            return res.status(400).json({ error: `Không tìm thấy sản phẩm "${product_name}" trong hệ thống.` });
        }

        const safePrice = product.price || 0;

        // ✅ Xác minh giá có khớp DB không
        if (product.price !== Number(price)) {
            await session.abortTransaction();
            return res.status(400).json({
                error: `Giá sản phẩm không khớp. Giá hiện tại: ${product.price.toLocaleString()}đ`
            });
        }

        // Lấy thông tin user
        const user = await User.findById(req.user._id).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Không tìm thấy người dùng.' });
        }

        // Kiểm tra số dư
        if (user.balance < price) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Số dư không đủ để mua sản phẩm này.' });
        }

        // Trừ tiền
        user.balance -= price;
        await user.save({ session });

        // 🧾 Tạo đơn hàng
        const newOrder = await Order.create([{
            user_id: user._id,
            product_id: product._id,
            total_amount: price,
            category: product.category, // ✅ Lưu danh mục sản phẩm
            username,
            password,
            cookie,
            note,   // note mặc định = tên sản phẩm
            product_name: product.name,
            product_price: product.price,
            status: 'pending',
            created_at: new Date()
        }], { session });

        await session.commitTransaction();




        // 📢 Gửi thông báo Discord: hiển thị note + product_name + price
        if (sendAdminNotification) {
            const orderInfo = newOrder[0];
sendAdminNotification(
    'new_order',
    `🛒 Đơn hàng mới: #${orderInfo._id.toString().substring(0,8)}
    Tên sản phẩm: ${orderInfo.product_name}
    Giá: ${safePrice.toLocaleString()}đ
    Note: ${orderInfo.note || ''}`,
    orderInfo,
    user
            );
        }

        // ✅ Gửi realtime cho user khi mua hàng xong
io.to(user.encrypted_yw_id).emit("balance_update", {
    new_balance: user.balance,

});



        // ✅ Trả kết quả về frontend
        res.json({
            success: true,
            message: 'Đặt hàng thành công!',
            order_id: newOrder[0]._id,
            new_balance: user.balance,
        });

} catch (err) {
    console.error("🔥 Lỗi khi đặt hàng (chi tiết):", err.message, err.stack);
    try { await session.abortTransaction(); } catch {}
    res.status(500).json({ error: 'Lỗi khi đặt hàng: ' + err.message });
} finally {
    session.endSession();
}


});








// ✅  NẠP THẺ

app.post('/api/recharge', authMiddleware, async (req, res) => {
  try {
    const { network_provider, card_serial, card_code, denomination, note } = req.body;

    // 🧩 Kiểm tra đầu vào
    if (!network_provider || !card_serial || !card_code || !denomination)
      return res.status(400).json({ error: 'Vui lòng nhập đủ thông tin.' });

    if (!req.user || !req.user._id)
      return res.status(401).json({ error: "Không xác thực người dùng. Vui lòng đăng nhập lại." });

    // 🧩 Tránh gửi trùng
    const existing = await RechargeRequest.findOne({ card_serial, card_code });
    if (existing)
      return res.status(400).json({ error: 'Thẻ cào này đã được gửi trước đó.' });

    // ✅ Chuyển denomination về số (phòng trường hợp client gửi chuỗi)
    const parsedDenomination = Number(denomination);
    if (isNaN(parsedDenomination) || parsedDenomination <= 0)
      return res.status(400).json({ error: 'Mệnh giá không hợp lệ.' });

    // ✅ Tạo yêu cầu mới
    const newRequest = await RechargeRequest.create({
      user_id: req.user._id,
      network_provider,
      card_serial,
      card_code,
      denomination: parsedDenomination,
      note,
      status: 'pending', // ✅ quan trọng
      created_at: new Date(),
      updated_at: new Date(),
    });

    // ✅ Gửi thông báo admin (an toàn)
    const user = await User.findById(req.user._id).select('display_name encrypted_yw_id').lean();
    const displayName =
      user?.display_name ||
      (user?.encrypted_yw_id ? user.encrypted_yw_id.substring(0, 8) : 'Người dùng');

    sendAdminNotification(
      'new_recharge',
      `💳 Yêu cầu nạp ${parsedDenomination.toLocaleString()}đ từ ${displayName}.`,
      newRequest,
      user
    );

    // ✅ Phản hồi thành công
    res.json({ success: true, message: 'Yêu cầu nạp thẻ đã được gửi!' });
  } catch (error) {
    console.error('Recharge Error:', error);
    res.status(500).json({ error: 'Lỗi khi gửi yêu cầu nạp thẻ.' });
  }
});



// ✅  LỊCH SỬ GIAO DỊCH

app.get('/api/history', authMiddleware, async (req, res) => {
  try {
    const [orderRes, cardRes, balanceRes] = await Promise.all([
      axios.get(`${process.env.API_BASE_URL}/api/history/order`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${process.env.API_BASE_URL}/api/history/card`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${process.env.API_BASE_URL}/api/history/balance`, { headers: { Authorization: req.headers.authorization } }),
    ]);

    const all = [...orderRes.data.history, ...cardRes.data.history, ...balanceRes.data.history]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);

    res.json({ success: true, history: all });
  } catch (error) {
    console.error('History Combine Error:', error);
    res.status(500).json({ error: 'Lỗi khi tổng hợp lịch sử.' });
  }
});


app.get('/api/history/order', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const category = req.query.category?.trim()?.toLowerCase();

    // 🔍 Lấy dữ liệu đơn hàng của user
    const orders = await Order.find({ user_id: userId })
      .populate('product_id', 'name category')
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    // 🧭 Chuẩn hóa dữ liệu trả về
    const mapped = orders.map(o => {
      const productCategory = (o.product_id?.category || o.category || '').trim() || 'Khác';
      return {
        _id: o._id,
        type: 'order',
        // ✅ Dùng đúng tên sản phẩm trong DB
        name: o.product_name || o.product_id?.name || 'Không rõ tên sản phẩm',
        // ✅ Dùng đúng danh mục
        category: productCategory,
        // ✅ Dùng đúng tổng tiền
        price: o.total_amount || 0,
        // ✅ Dùng đúng trạng thái
        status: o.status || 'Không rõ',
        // ✅ Dùng đúng ghi chú
        note: o.note || o.admin_note || 'Không có ghi chú',
        // ✅ Gộp thêm thông tin tài khoản (nếu có)
        username: o.username || 'Không có',
        password: o.password || 'Không có',
        // ✅ Thời gian
        created_at: o.created_at || o.createdAt || new Date(),
      };
    });

    // 🎯 Lọc theo category nếu có
    const filtered = category
      ? mapped.filter(o => o.category.toLowerCase() === category)
      : mapped;

    res.json({ success: true, history: filtered });
  } catch (error) {
    console.error('Order History Error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử mua hàng.' });
  }
});




app.get('/api/history/card', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const recharges = await RechargeRequest.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    const mapped = recharges.map(r => ({
      ...r,
      type: 'recharge',
      category: 'Nạp thẻ',
      created_at: r.created_at || r.createdAt || new Date(),
    }));

    res.json({ success: true, history: mapped });
  } catch (error) {
    console.error('Recharge History Error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử nạp thẻ.' });
  }
});



app.get('/api/history/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const histories = await History.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const mapped = histories.map(h => ({
      ...h,
      type: 'balance',
      category: h.category || 'Biến động số dư',
      reason: h.reason || 'Cập nhật số dư',
      created_at: h.created_at || h.createdAt || new Date(),
    }));

    res.json({ success: true, history: mapped });
  } catch (error) {
    console.error('Balance History Error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử số dư.' });
  }
});

// GỬI THÔNG BÁO CHO USER TỪ DISCORD--------------------------->
// ✅ Lấy danh sách thông báo của user hiện tại
app.get('/api/notifications/me', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy thông báo' });
  }
});

// ✅ Gửi thông báo đến user (chỉ admin)
app.post('/api/admin/send-notification', async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({ success: false, error: 'Thiếu username hoặc message' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy user' });
    }

    // 🔑 Check duplicate notification (trong vòng 5 phút)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existing = await Notification.findOne({
      user_id: user._id,
      message: `[Admin]: ${message}`,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existing) {
      return res.status(409).json({ success: false, error: 'Notification đã gửi trước đó (tránh dupe).' });
    }

    const notification = await Notification.create({
      user_id: user._id,
      message: `[Admin]: ${message}`,
      from_admin: true,
      createdAt: new Date()
    });

    res.json({ success: true, username, notificationId: notification._id });
  } catch (err) {
    console.error('🔥 Lỗi khi gửi thông báo:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi gửi thông báo' });
  }
});

// ✅ Gửi thông báo đến TẤT CẢ người dùng
app.post('/api/admin/send-notification-all', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Thiếu nội dung message' });
    }

    const users = await User.find({}, '_id username');
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Không có user nào trong hệ thống' });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const notifications = [];

    for (const u of users) {
      const exists = await Notification.findOne({
        user_id: u._id,
        message: `[Admin]: ${message}`,
        createdAt: { $gte: fiveMinutesAgo }
      });
      if (!exists) {
        notifications.push({
          user_id: u._id,
          message: `[Admin]: ${message}`,
          from_admin: true,
          createdAt: new Date()
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, count: notifications.length });
  } catch (err) {
    console.error('🔥 Lỗi khi gửi thông báo hàng loạt:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi gửi thông báo hàng loạt' });
  }
});

// ✅ Cộng tiền vào tài khoản user


// ✅ Cộng tiền vào tài khoản user (chống cộng trùng)
app.post('/api/admin/add-cash', async (req, res) => {
  try {
    const { username, amount, transactionId } = req.body;

    if (!username || !amount) {
      return res.status(400).json({ success: false, error: 'Thiếu username hoặc amount' });
    }

    // Tạo transactionId nếu không có
    const txId = transactionId || `${username}-${Date.now()}`;

    // 🔍 Kiểm tra trùng transaction
    const existingTx = await CashTransaction.findOne({ transactionId: txId });
    if (existingTx) {
      console.warn(`⚠️ Giao dịch trùng lặp: ${txId}`);
      return res.status(409).json({ success: false, error: 'Giao dịch này đã được xử lý trước đó.' });
    }

    // 🔍 Kiểm tra user tồn tại
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy user' });
    }

    // ✅ Ghi nhận giao dịch vào DB trước
    await CashTransaction.create({ transactionId: txId, username, amount });

    // ✅ Cộng tiền
    user.balance = (user.balance || 0) + Number(amount);
    await user.save();

    console.log(`💰 Đã cộng ${amount} vào tài khoản ${username} (Tổng: ${user.balance})`);

    // ✅ Kiểm tra thông báo trùng trong 5 phút gần nhất
    const recentNotif = await Notification.findOne({
      user_id: user._id,
      message: `[Admin]: Bạn đã được cộng ${amount} vào tài khoản.`,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (!recentNotif) {
      await Notification.create({
        user_id: user._id,
        message: `[Admin]: Bạn đã được cộng ${amount} vào tài khoản.`,
        from_admin: true,
        createdAt: new Date()
      });
      console.log(`📩 Đã gửi thông báo cộng tiền cho ${username}`);
    } else {
      console.log(`⚠️ Bỏ qua thông báo trùng cho ${username}`);
    }

    res.json({
      success: true,
      username,
      new_balance: user.balance,
      transactionId: txId
    });
  } catch (err) {
    console.error('🔥 Lỗi khi cộng tiền:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi cộng tiền' });
  }
});


// ========================================
// THÊM VÀO FILE: routes/authRoutes.js
// ========================================

// API: Đổi mật khẩu
router.post("/change-password", authMiddleware, async (req, res) => {
  console.log("📩 Change password request:", req.body);

  try {
    const { old_password, new_password } = req.body;

    // 🧩 Validate input
    if (!old_password || !new_password) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng nhập đầy đủ thông tin." 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Mật khẩu mới phải có ít nhất 6 ký tự." 
      });
    }

    // 🔍 Lấy thông tin user từ token
    const userId = req.user.userId || req.user._id;
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy người dùng." 
      });
    }

    // 🔒 Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(old_password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Mật khẩu cũ không đúng." 
      });
    }

    // 🔐 Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // 💾 Cập nhật mật khẩu
    user.password = hashedPassword;
    user.updated_at = new Date();
    await user.save();

    // ✅ Trả về kết quả thành công
    res.json({
      success: true,
      message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."
    });

  } catch (err) {
    console.error("❌ Change Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đổi mật khẩu.",
      error: err.message
    });
  }
});

// ========================================
// HOẶC THÊM TRỰC TIẾP VÀO FILE: server.js
// ========================================

app.post('/api/user/change-password', authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    // Validate
    if (!old_password || !new_password) {
      return res.status(400).json({ 
        success: false, 
        error: "Vui lòng nhập đầy đủ thông tin." 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: "Mật khẩu mới phải có ít nhất 6 ký tự." 
      });
    }

    // Lấy user
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "Không tìm thấy người dùng." 
      });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(old_password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: "Mật khẩu cũ không đúng." 
      });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    user.updated_at = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công!"
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server khi đổi mật khẩu."
    });
  }
});


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_SEND_ONE = 'https://pnguyenroblox.onrender.com/api/admin/send-notification';
const API_SEND_ALL = 'https://pnguyenroblox.onrender.com/api/admin/send-notification-all';
const API_ADD_CASH = 'https://pnguyenroblox.onrender.com/api/admin/add-cash';

// ✅ Map lưu ID của message đã xử lý để tránh duplicate
const processedMessages = new Set();

client.once('ready', () => {
  console.log(`🤖 Bot đã đăng nhập: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🔒 Kiểm tra duplicate message
  if (processedMessages.has(message.id)) return;
  processedMessages.add(message.id);

  // ------------------- LỆNH GỬI THÔNG BÁO -------------------
  if (message.content.startsWith('send!')) {
    const match = message.content.match(/send!\s*"(.*?)"\s*@(\S+)/);
    if (!match) return message.reply('❌ Sai cú pháp!\nVí dụ: send! "xin chào" @tenuser hoặc send! "chào cả nhà" @all');

    const content = match[1];
    const username = match[2];

    try {
      if (username === 'all') {
        const res = await fetch(API_SEND_ALL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content })
        });
        const data = await res.json();
        if (res.ok && data.success)
          message.reply(`✅ Đã gửi thông báo đến **${data.count}** người dùng.`);
        else
          message.reply(`⚠️ Lỗi: ${data.error || 'Không thể gửi cho tất cả user.'}`);
      } else {
        const res = await fetch(API_SEND_ONE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, message: content })
        });
        const data = await res.json();
        if (res.ok && data.success)
          message.reply(`✅ Đã gửi thông báo đến **${username}**.`);
        else
          message.reply(`⚠️ ${data.error || 'Không tìm thấy user.'}`);
      }
    } catch (e) {
      console.error(e);
      message.reply('🔥 Lỗi khi gửi thông báo.');
    }
  }

  // ------------------- LỆNH CỘNG TIỀN -------------------
  if (message.content.startsWith('addcash!')) {
    const match = message.content.match(/addcash!\s*"(.*?)"\s*@(\S+)/);
    if (!match) return message.reply('❌ Sai cú pháp!\nVí dụ: addcash! "1000" @tenuser');

    const amount = match[1];
    const username = match[2];

    try {
      // Tạo transactionId duy nhất theo message.id để tránh duplicate
      const transactionId = message.id;

      const res = await fetch(API_ADD_CASH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, amount, transactionId })
      });

      const data = await res.json();
      if (res.ok && data.success)
        message.reply(`💰 Đã cộng **${amount}** vào tài khoản **${username}** (Số dư mới: ${data.new_balance}).`);
      else
        message.reply(`⚠️ Lỗi: ${data.error || 'Không rõ nguyên nhân.'}`);
    } catch (e) {
      console.error(e);
      message.reply('🔥 Lỗi khi cộng tiền.');
    }
  }

  // ✅ Xóa message đã xử lý sau 5 phút để tránh memory leak
  setTimeout(() => processedMessages.delete(message.id), 5 * 60 * 1000);
});

client.login(TOKEN);


// 👑 API ROUTES ADMIN (Yêu cầu isAdmin Middleware)





// Admin: Lấy danh sách tất cả sản phẩm
app.get('/api/admin/products', authMiddleware, isAdmin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ created_at: -1 }).lean();
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách sản phẩm.' });
    }
});

// Admin: Tạo hoặc Cập nhật Sản phẩm
app.post('/api/admin/product/upsert', isAdmin, async (req, res) => {
    try {
        const { _id, name, category, price, is_active, inventory_count, image_url } = req.body;
        
        if (!name || !category || isNaN(price) || price <= 0 || isNaN(inventory_count) || inventory_count < 0) {
            return res.status(400).json({ error: 'Thông tin sản phẩm không hợp lệ.' });
        }

        const productData = { name, category, price, is_active: !!is_active, inventory_count, image_url, updated_at: Date.now() };
        
        let product;
        if (_id) {
            product = await Product.findByIdAndUpdate(_id, { $set: productData }, { new: true });
            if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
            res.json({ success: true, message: `Sản phẩm ${name} đã được cập nhật.`, product });
        } else {
            product = await Product.create(productData);
            res.json({ success: true, message: `Sản phẩm ${name} đã được tạo mới.`, product });
        }

    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi tạo/cập nhật sản phẩm.' });
    }
});

// Admin: Xóa sản phẩm
app.delete('/api/admin/product/delete/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Product.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: 'Sản phẩm không tìm thấy.' });
        }
        res.json({ success: true, message: `Sản phẩm "${result.name}" đã được xóa.` });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa sản phẩm.' });
    }
});

// Admin: Lấy danh sách Đơn hàng
app.get('/api/admin/orders', isAdmin, async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        let filter = status !== 'all' ? { status } : {};

        const orders = await Order.find(filter)
            .populate('user_id', 'display_name encrypted_yw_id')
            .populate('product_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng.' });
    }
});

// Admin/ request nạp thẻ
app.get('/api/admin/recharges', isAdmin, async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        let filter = status !== 'all' ? { status } : {};

        const recharges = await RechargeRequest.find(filter)
            .populate('user_id', 'display_name encrypted_yw_id')
            .sort({ created_at: -1 })
            .lean();

        res.json({ success: true, recharges });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách yêu cầu nạp thẻ.' });
    }
});

// Admin thay đổi trạng thái order thủ công
app.post('/api/admin/order/process', isAdmin, async (req, res) => {
    try {
        const { id, status, admin_note } = req.body;
        if (!id || !['completed', 'failed', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Thiếu ID hoặc trạng thái không hợp lệ.' });
        }

        const adminYwId = req.adminYwId;
        const result = await processOrderInternal(id, status, adminYwId, admin_note || 'Admin Manual Panel');
        
        const detail = result.order;
        const user = await User.findById(detail.user_id).select('display_name encrypted_yw_id').lean();
        sendAdminNotification(
            `order_${status}`,
            `Đơn hàng ID ${id.substring(0, 8)} đã được Admin duyệt/hủy thủ công.`,
            detail,
            user
        );

        res.json({ success: true, message: `Đơn hàng #${id.substring(0, 8)} đã được xử lý thành ${status}.` });

    } catch (error) {
        res.status(500).json({ error: error.message || 'Lỗi xử lý đơn hàng.' });
    }
});
// Admin order thủ công
app.post('/api/admin/recharge/process', isAdmin, async (req, res) => {
    try {
        const { id, status, admin_note } = req.body;
        if (!id || !['completed', 'failed', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Thiếu ID hoặc trạng thái không hợp lệ.' });
        }

        const adminYwId = req.adminYwId;
        const result = await processRechargeInternal(id, status, adminYwId, admin_note || 'Admin Manual Panel');

        const detail = result.rechargeRequest;
        const user = await User.findById(detail.user_id).select('display_name encrypted_yw_id').lean();
        sendAdminNotification(
            `recharge_${status}`,
            `Yêu cầu nạp thẻ ID ${id.substring(0, 8)} đã được Admin duyệt/từ chối thủ công.`,
            detail,
            user
        );

        res.json({ success: true, message: `Yêu cầu nạp thẻ #${id.substring(0, 8)} đã được xử lý thành ${status}.` });

    } catch (error) {
        res.status(500).json({ error: error.message || 'Lỗi xử lý yêu cầu nạp thẻ.' });
    }
});






// ⚙️ CẤU HÌNH PHỤC VỤ FRONTEND (STATIC FILES)


// Cho phép truy cập toàn bộ file trong /public
app.use(express.static(staticPath));

// Cho phép truy cập hình ảnh
app.use('/images', express.static(path.join(staticPath, 'images')));

// Cho phép truy cập các file sản phẩm (Box)
app.use('/product', express.static(path.join(staticPath, 'product')));

app.use('/header', express.static(path.join(staticPath, 'header')));

app.use('/productshop', express.static(path.join(staticPath, 'productshop')));

app.use('/shop', express.static(path.join(staticPath, 'shop')));


app.use('/history', express.static(path.join(staticPath, 'history')));









// ❌ XỬ LÝ LỖI CUỐI CÙNG (404)

app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
});


// 🏁 KHỞI ĐỘNG SERVER

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
