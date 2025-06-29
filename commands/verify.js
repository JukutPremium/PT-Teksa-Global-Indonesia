// Verify Command
const codes = require('../variables/codes.json');

module.exports = {
  name: 'verify',
  description: 'Verifikasi member dengan kode untuk mendapatkan role',
  usage: '!verify <kode>',
  
  async execute(message, args, client) {
    const ALLOWED_VERIFY_CHANNEL = process.env.VERIFY_CHANNEL_ID;
    
    // Cek apakah command digunakan di channel yang benar
    if (message.channel.id !== ALLOWED_VERIFY_CHANNEL) {
      const reply = await message.reply('❌ Command `!verify` hanya dapat digunakan di channel yang telah ditentukan.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    const inputCode = args[0];

    if (!inputCode) {
      const reply = await message.reply('❌ Harap masukkan kode verifikasi. Contoh: `!verify Admin123`');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    const roleId = codes[inputCode];
    if (!roleId) {
      const reply = await message.reply('❌ Kode tidak valid.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    const role = message.guild.roles.cache.get(roleId);
    if (!role) {
      const reply = await message.reply('❌ Role tidak ditemukan. Periksa kembali role_id dalam `codes.json`.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    // Cek apakah bot bisa memberikan role
    if (!role.editable) {
      const reply = await message.reply(`❌ Bot tidak bisa memberikan role "${role.name}". Pastikan role bot berada di atas role ini.`);
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    try {
      await message.member.roles.add(role);
      const reply = await message.reply(`✅ Verifikasi berhasil! Role \`${role.name}\` telah diberikan.`);
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    } catch (err) {
      console.error('Error in verify command:', err);
      const reply = await message.reply('❌ Gagal memberikan role. Pastikan bot memiliki izin yang cukup.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    }
  }
};