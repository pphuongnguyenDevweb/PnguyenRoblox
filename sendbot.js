const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

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

client.once('clientReady', () => {
  console.log(`🤖 Bot đã đăng nhập: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ------------------- LỆNH GỬI THÔNG BÁO RIÊNG -------------------
  if (message.content.startsWith('send!')) {
    const match = message.content.match(/send!\s*"(.*?)"\s*@(\S+)/);
    if (!match) return message.reply('❌ Sai cú pháp!\nVí dụ: send! "xin chào" @tenuser hoặc send! "chào cả nhà" @all');

    const content = match[1];
    const username = match[2];

    try {
      // 📨 Nếu là @all → gọi API gửi toàn bộ
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
        // 📨 Gửi cho 1 user cụ thể
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
      const res = await fetch(API_ADD_CASH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, amount })
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
});

client.login(TOKEN);
