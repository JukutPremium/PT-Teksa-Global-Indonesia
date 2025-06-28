const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const os = require('os');
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
const ALLOWED_VERIFY_CHANNEL = process.env.VERIFY_CHANNEL_ID;

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


function getSystemInfo() {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {

    botUptime: formatUptime(uptime),
    nodeVersion: process.version,
    discordJsVersion: require('discord.js').version || 'Unknown',
    

    platform: os.platform(),
    architecture: os.arch(),
    hostname: os.hostname(),
    systemUptime: formatUptime(os.uptime()),
    
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    cpuCores: os.cpus().length,
    loadAverage: os.loadavg(),
    
    totalMemory: Math.round(os.totalmem() / 1024 / 1024),
    freeMemory: Math.round(os.freemem() / 1024 / 1024),
    usedMemory: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
    
    processMemory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    }
  };
}

function detectHostingInfo() {
  const platform = os.platform();
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const homedir = os.homedir();
  const networkInterfaces = os.networkInterfaces();
  
  let provider = 'Unknown';
  let location = 'Unknown';
  let serverType = 'Unknown';
  
  if (hostname.includes('digitalocean') || hostname.includes('droplet')) {
    provider = 'DigitalOcean';
  } else if (hostname.includes('aws') || hostname.includes('ec2') || hostname.includes('amazon')) {
    provider = 'Amazon AWS';
  } else if (hostname.includes('gcp') || hostname.includes('google')) {
    provider = 'Google Cloud Platform';
  } else if (hostname.includes('azure') || hostname.includes('microsoft')) {
    provider = 'Microsoft Azure';
  } else if (hostname.includes('vultr')) {
    provider = 'Vultr';
  } else if (hostname.includes('linode')) {
    provider = 'Linode';
  } else if (hostname.includes('ovh')) {
    provider = 'OVH';
  } else if (hostname.includes('contabo')) {
    provider = 'Contabo';
  } else if (hostname.includes('hetzner')) {
    provider = 'Hetzner';
  } else if (hostname.includes('vps') || hostname.includes('server')) {
    provider = 'VPS Provider';
  } else if (platform === 'win32') {
    provider = 'Windows PC/Server';
  } else if (platform === 'darwin') {
    provider = 'macOS';
  } else {
    provider = 'Linux Server/PC';
  }
  
  if (process.env.DOCKER_CONTAINER) {
    serverType = 'Docker Container';
  } else if (fs.existsSync('/.dockerenv')) {
    serverType = 'Docker Container';
  } else if (platform === 'linux' && fs.existsSync('/proc/version')) {
    try {
      const version = fs.readFileSync('/proc/version', 'utf8');
      if (version.includes('Microsoft') || version.includes('WSL')) {
        serverType = 'Windows Subsystem for Linux (WSL)';
        provider = 'Windows PC (WSL)';
      } else {
        serverType = 'Native Linux';
      }
    } catch (e) {
      serverType = 'Linux System';
    }
  } else if (platform === 'win32') {
    serverType = 'Windows System';
  } else if (platform === 'darwin') {
    serverType = 'macOS System';
  }
  
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Jakarta') || timezone.includes('Asia/Jakarta')) {
      location = 'Jakarta, Indonesia';
    } else if (timezone.includes('Singapore')) {
      location = 'Singapore';
    } else if (timezone.includes('Tokyo')) {
      location = 'Tokyo, Japan';
    } else if (timezone.includes('New_York')) {
      location = 'New York, USA';
    } else if (timezone.includes('London')) {
      location = 'London, UK';
    } else if (timezone.includes('Europe/')) {
      location = 'Europe';
    } else if (timezone.includes('America/')) {
      location = 'Americas';
    } else if (timezone.includes('Asia/')) {
      location = 'Asia';
    } else {
      location = timezone;
    }
  } catch (e) {
    location = 'Unknown';
  }
  
  let internalIP = 'Unknown';
  try {
    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      for (const network of networkInterface) {
        if (network.family === 'IPv4' && !network.internal) {
          internalIP = network.address;
          break;
        }
      }
      if (internalIP !== 'Unknown') break;
    }
  } catch (e) {
    internalIP = 'Unknown';
  }
  
  return {
    provider,
    location,
    serverType,
    hostname,
    username,
    internalIP,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    processId: process.pid,
    workingDirectory: process.cwd(),
    startTime: new Date(Date.now() - process.uptime() * 1000).toLocaleString('id-ID')
  };
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${secs}s`;
  
  return result.trim();
}

function getMemoryUsageBar(used, total) {
  const percentage = (used / total) * 100;
  const barLength = 10;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  const filledBar = '█'.repeat(filledLength);
  const emptyBar = '░'.repeat(emptyLength);
  
  return `${filledBar}${emptyBar} ${percentage.toFixed(1)}%`;
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

  // Command !hostinfo - menampilkan informasi hosting dan sistem
  if (command === 'hostinfo') {
    if (!message.member.permissions.has('Administrator')) {
      const reply = await message.reply('❌ Anda tidak memiliki izin untuk menggunakan command ini.');
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }
    try {
      const sysInfo = getSystemInfo();
      const hostInfo = detectHostingInfo();
      const ping = Date.now() - message.createdTimestamp;
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🖥️ Host Information')
        .setDescription(`Informasi lengkap tentang sistem yang menjalankan bot ini`)
        .addFields(
          {
            name: '🤖 Bot Information',
            value: `**Uptime:** ${sysInfo.botUptime}\n**Ping:** ${ping}ms\n**Node.js:** ${sysInfo.nodeVersion}\n**Discord.js:** ${sysInfo.discordJsVersion}\n**Guilds:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}`,
            inline: true
          },
          {
            name: '🏢 Host Detection',
            value: `**Provider:** ${hostInfo.provider}\n**Server Type:** ${hostInfo.serverType}\n**Location:** ${hostInfo.location}\n**Timezone:** ${hostInfo.timezone}`,
            inline: true
          },
          {
            name: '🌐 Network & Identity',
            // value: `**Hostname:** ${hostInfo.hostname}\n**Username:** ${hostInfo.username}\n**Internal IP:** ${hostInfo.internalIP}\n**Process ID:** ${hostInfo.processId}`,
            value: `**Hostname:** ${hostInfo.hostname}\n**Username:** ${hostInfo.username}\n**Internal IP:** ###.###.###.#\n**Process ID:** ${hostInfo.processId}`,
            inline: false
          },
          {
            name: '💻 System Information',
            value: `**OS:** ${sysInfo.platform} ${sysInfo.architecture}\n**System Uptime:** ${sysInfo.systemUptime}\n**Bot Started:** ${hostInfo.startTime}\n**Working Dir:** ${hostInfo.workingDirectory.split('/').slice(-2).join('/')}`,
            inline: true
          },
          {
            name: '🔧 CPU Information',
            value: `**Model:** ${sysInfo.cpuModel.length > 35 ? sysInfo.cpuModel.slice(0, 35) + '...' : sysInfo.cpuModel}\n**Cores:** ${sysInfo.cpuCores}\n**Load Average:** ${sysInfo.loadAverage.map(load => load.toFixed(2)).join(', ')}`,
            inline: true
          },
          {
            name: '🧠 Memory Usage',
            value: `**System Total:** ${sysInfo.totalMemory} MB\n**System Used:** ${sysInfo.usedMemory} MB (${((sysInfo.usedMemory/sysInfo.totalMemory)*100).toFixed(1)}%)\n**Bot Memory:** ${sysInfo.processMemory.rss} MB\n**Usage:** ${getMemoryUsageBar(sysInfo.usedMemory, sysInfo.totalMemory)}`,
            inline: true
          }
        )
        .setFooter({ 
          text: `Requested by ${message.author.tag} • Auto-detected`, 
          iconURL: message.author.displayAvatarURL() 
        })
        .setTimestamp();

      if (client.shard) {
        embed.addFields({
          name: '🔀 Shard Information',
          value: `**Shard ID:** ${client.shard.ids.join(', ')}\n**Total Shards:** ${client.shard.count}`,
          inline: true
        });
      }

      const hostInfoMessage = await message.reply({ embeds: [embed] });
      
      setTimeout(() => {
        hostInfoMessage.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 120000);
      
    } catch (err) {
      console.error('Error in hostinfo command:', err);
      const reply = await message.reply('❌ Gagal mengambil informasi host.');
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