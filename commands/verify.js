// Enhanced Verify Command with Logging and Security
const codes = require('../variables/codes.json');
const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'verify',
  description: 'Verifikasi member dengan kode untuk mendapatkan role',
  usage: '!verify <kode>',
  
  async execute(message, args, client) {
    const ALLOWED_VERIFY_CHANNEL = process.env.VERIFY_CHANNEL_ID;
    const SECURITY_ALERT_CHANNEL = process.env.SECURITY_ALERT_CHANNEL_ID;
    
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

    const rateLimitResult = await this.checkRateLimit(message.author.id);
    if (!rateLimitResult.allowed) {
      const reply = await message.reply(`❌ Terlalu banyak percobaan verifikasi. Coba lagi dalam ${rateLimitResult.timeLeft} detik.`);
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    const roleId = codes[inputCode];
    if (!roleId) {
      await this.logFailedAttempt(message.author, inputCode, message.guild);
      await this.sendSecurityAlert(client, SECURITY_ALERT_CHANNEL, {
        type: 'FAILED_VERIFICATION',
        user: message.author,
        code: inputCode,
        guild: message.guild,
        timestamp: new Date()
      });

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

    if (message.member.roles.cache.has(roleId)) {
      const reply = await message.reply(`❌ Anda sudah memiliki role "${role.name}".`);
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

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
      await this.logSuccessfulVerification(message.author, inputCode, role, message.guild);
      await this.sendSecurityAlert(client, SECURITY_ALERT_CHANNEL, {
        type: 'SUCCESSFUL_VERIFICATION',
        user: message.author,
        code: inputCode,
        role: role,
        guild: message.guild,
        timestamp: new Date()
      });

      const reply = await message.reply(`✅ Verifikasi berhasil! Role \`${role.name}\` telah diberikan.`);
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    } catch (err) {
      console.error('Error in verify command:', err);
      
      await this.logError(message.author, inputCode, err.message, message.guild);
      
      const reply = await message.reply('❌ Gagal memberikan role. Pastikan bot memiliki izin yang cukup.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
    }
  },

  async checkRateLimit(userId) {
    const rateLimitFile = path.join(__dirname, '../logs/rate_limits.json');
    const maxAttempts = 5;
    const timeWindow = 300000;
    
    try {
      let rateLimits = {};
      try {
        const data = await fs.readFile(rateLimitFile, 'utf8');
        rateLimits = JSON.parse(data);
      } catch (err) {
        await fs.mkdir(path.dirname(rateLimitFile), { recursive: true });
      }

      const now = Date.now();
      const userLimit = rateLimits[userId];

      if (!userLimit) {
        rateLimits[userId] = { attempts: 1, firstAttempt: now };
        await fs.writeFile(rateLimitFile, JSON.stringify(rateLimits, null, 2));
        return { allowed: true };
      }

      if (now - userLimit.firstAttempt > timeWindow) {
        rateLimits[userId] = { attempts: 1, firstAttempt: now };
        await fs.writeFile(rateLimitFile, JSON.stringify(rateLimits, null, 2));
        return { allowed: true };
      }

      if (userLimit.attempts >= maxAttempts) {
        const timeLeft = Math.ceil((timeWindow - (now - userLimit.firstAttempt)) / 1000);
        return { allowed: false, timeLeft };
      }

      rateLimits[userId].attempts++;
      await fs.writeFile(rateLimitFile, JSON.stringify(rateLimits, null, 2));
      return { allowed: true };
    } catch (err) {
      console.error('Error checking rate limit:', err);
      return { allowed: true };
    }
  },

  async logSuccessfulVerification(user, code, role, guild) {
    const logData = {
      timestamp: new Date().toISOString(),
      type: 'SUCCESSFUL_VERIFICATION',
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        displayName: user.displayName
      },
      code: code,
      role: {
        id: role.id,
        name: role.name
      },
      guild: {
        id: guild.id,
        name: guild.name
      }
    };

    await this.writeLog('verification_success.json', logData);
  },

  async logFailedAttempt(user, code, guild) {
    const logData = {
      timestamp: new Date().toISOString(),
      type: 'FAILED_VERIFICATION',
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        displayName: user.displayName
      },
      code: code,
      guild: {
        id: guild.id,
        name: guild.name
      }
    };

    await this.writeLog('verification_failed.json', logData);
  },

  async logError(user, code, error, guild) {
    const logData = {
      timestamp: new Date().toISOString(),
      type: 'VERIFICATION_ERROR',
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        displayName: user.displayName
      },
      code: code,
      error: error,
      guild: {
        id: guild.id,
        name: guild.name
      }
    };

    await this.writeLog('verification_errors.json', logData);
  },

  async writeLog(filename, logData) {
    try {
      const logDir = path.join(__dirname, '../logs');
      const logFile = path.join(logDir, filename);
      
      await fs.mkdir(logDir, { recursive: true });
      
      let logs = [];
      try {
        const existingData = await fs.readFile(logFile, 'utf8');
        logs = JSON.parse(existingData);
      } catch (err) {
      }
      
      logs.push(logData);
      
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (err) {
      console.error('Error writing log:', err);
    }
  },

  async sendSecurityAlert(client, channelId, alertData) {
    if (!channelId) return;
    
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle('🔐 Security Alert - Verification Activity')
        .setTimestamp(alertData.timestamp);

      if (alertData.type === 'SUCCESSFUL_VERIFICATION') {
        embed
          .setColor('#00FF00')
          .setDescription('✅ **Successful Verification**')
          .addFields(
            { name: '👤 User', value: `${alertData.user.username} (${alertData.user.id})`, inline: true },
            { name: '🔑 Code Used', value: `\`${alertData.code}\``, inline: true },
            { name: '🏷️ Role Granted', value: `${alertData.role.name}`, inline: true },
            { name: '🏠 Server', value: `${alertData.guild.name}`, inline: false }
          );
      } else if (alertData.type === 'FAILED_VERIFICATION') {
        embed
          .setColor('#FF0000')
          .setDescription('❌ **Failed Verification Attempt**')
          .addFields(
            { name: '👤 User', value: `${alertData.user.username} (${alertData.user.id})`, inline: true },
            { name: '🔑 Invalid Code', value: `\`${alertData.code}\``, inline: true },
            { name: '🏠 Server', value: `${alertData.guild.name}`, inline: false }
          );
      }

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Error sending security alert:', err);
    }
  }
};