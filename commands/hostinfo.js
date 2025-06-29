// Host Information Command
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const os = require('os');

module.exports = {
  name: 'hostinfo',
  description: 'Menampilkan informasi hosting dan sistem (hanya untuk administrator)',
  usage: '!hostinfo',
  
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
};

function getSystemInfo() {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
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