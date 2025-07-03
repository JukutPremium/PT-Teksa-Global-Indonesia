// Activity command
const { ActivityType } = require('discord.js');

module.exports = {
  name: 'activity',
  description: 'Mengubah activity status bot (hanya untuk administrator)',
  usage: '!activity <text>',
  
  async execute(message, args, client) {
    // Cek permission administrator
    if (!message.member.permissions.has('Administrator')) {
      const reply = await message.reply('❌ Anda tidak memiliki izin untuk menggunakan command ini.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    const activityText = args.join(' ');
    if (!activityText) {
      const reply = await message.reply('❌ Harap masukkan text untuk activity. Contoh: `!activity Watching the server`');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    try {
      client.user.setActivity(activityText, { type: ActivityType.Playing });
      const reply = await message.reply(`✅ Activity berhasil diubah ke: "${activityText}"`);
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    } catch (err) {
      console.error('Error in activity command:', err);
      const reply = await message.reply('❌ Gagal mengubah activity.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    }
  }
};