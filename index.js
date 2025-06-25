const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const codes = require('./codes.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_PREFIX = process.env.BOT_PREFIX || '!';
const GUILD_ID = process.env.GUILD_ID;
const ALLOWED_VERIFY_CHANNEL = process.env.VERIFY_CHANNEL_ID || '1386648426955018290';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN tidak ditemukan dalam environment variables!');
  process.exit(1);
}

if (!GUILD_ID) {
  console.error('❌ GUILD_ID tidak ditemukan dalam environment variables!');
  process.exit(1);
}

client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
  console.log(`Logged in at: ${new Date().toISOString()}`);
  console.log(`Serving ${client.guilds.cache.size} guilds`);

  setCustomActivity();
  
  if (process.send) {
    process.send('ready');
  }
});

function setCustomActivity() {
  const activities = [
    { name: 'PT Teksa DIgital Indoneisa', type: ActivityType.Watching },
  ];

  const activity = activities[Math.floor(Math.random() * activities.length)];
  
  client.user.setActivity(activity.name, { 
    type: activity.type,
    // url: 'https://twitch.tv/your_channel'
  });

  client.user.setStatus('online');
  
  console.log(`Activity updated: ${ActivityType[activity.type]} ${activity.name}`);
}

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  if (!message.content.startsWith(BOT_PREFIX)) return;

  const args = message.content.slice(BOT_PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Command !verify
  if (command === 'verify') {
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
      const reply = await message.reply('❌ Harap masukkan kode verifikasi. Contoh: `!verify TxW2025`');
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

    // Cek apakah bot bisa ngasi role
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
      console.error(err);
      const reply = await message.reply('❌ Gagal memberikan role. Pastikan bot memiliki izin yang cukup.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    }
  }

  // Command !activity - untuk mengubah activity bot (opsional, hanya untuk admin)
  if (command === 'activity') {
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
      console.error(err);
      const reply = await message.reply('❌ Gagal mengubah activity.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    }
  }
});

client.login(BOT_TOKEN);

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

setInterval(() => {
  const used = process.memoryUsage();
  const memoryUsage = Math.round(used.rss / 1024 / 1024 * 100) / 100;
  console.log(`Memory Usage: ${memoryUsage} MB`);
}, 300000);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});