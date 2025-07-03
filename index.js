const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

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

// Validasi environment variables
if (!BOT_TOKEN) {
  logger.error('BOT_TOKEN tidak ditemukan dalam environment variables!');
  process.exit(1);
}

if (!GUILD_ID) {
  logger.error('GUILD_ID tidak ditemukan dalam environment variables!');
  process.exit(1);
}

// Load commands
const commands = new Map();

function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    logger.error('Folder commands tidak ditemukan!');
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  const commandStats = {
    loaded: 0,
    failed: 0,
    total: commandFiles.length
  };
  
  const commandData = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      // Clear cache to allow hot reload
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);
      
      if (command.name && command.execute) {
        commands.set(command.name, command);
        commandStats.loaded++;
        
        commandData.push([
          `✅ ${command.name}`,
          command.description || 'No description',
          command.usage || `!${command.name}`,
          file,
          'LOADED'
        ]);
      } else {
        commandStats.failed++;
        commandData.push([
          `❌ ${file.replace('.js', '')}`,
          'Missing name/execute',
          'N/A',
          file,
          'FAILED'
        ]);
      }
    } catch (error) {
      commandStats.failed++;
      commandData.push([
        `❌ ${file.replace('.js', '')}`,
        `Error: ${error.message.substring(0, 30)}...`,
        'N/A',
        file,
        'FAILED'
      ]);
      logger.error(`Error loading ${file}`, error);
    }
  }
  
  logger.commandLoadingResults(commandData, commandStats);
}

// Command testing function
async function testCommands() {
  if (commands.size === 0) {
    logger.warning('No commands to test!');
    return;
  }
  
  const testResults = [];
  for (const [commandName, command] of commands) {
    try {
      const tests = {
        hasName: !!command.name,
        hasExecute: typeof command.execute === 'function',
        hasDescription: !!command.description,
        hasUsage: !!command.usage
      };
      
      const passedTests = Object.values(tests).filter(Boolean).length;
      const totalTests = Object.keys(tests).length;
      const status = passedTests === totalTests ? 'PASSED' : 'PARTIAL';
      
      testResults.push({
        name: commandName,
        status: status,
        details: `${passedTests}/${totalTests} tests passed`,
        error: passedTests < totalTests ? 'Missing required properties' : null
      });
      
    } catch (error) {
      testResults.push({
        name: commandName,
        status: 'FAILED',
        details: 'Test execution failed',
        error: error.message
      });
    }
  }
  
  // Use logger for display
  logger.commandTestingResults(testResults);
}

function setCustomActivity() {
  const activities = [
    { name: 'PT Teksa Digital Indonesia', type: ActivityType.Watching },
    { name: 'Shaka Pratama', type: ActivityType.Watching },
    { name: 'Claude AI', type: ActivityType.Watching },
  ];

  const activity = activities[Math.floor(Math.random() * activities.length)];
  
  client.user.setActivity(activity.name, { 
    type: activity.type,
  });

  client.user.setStatus('online');
  
  logger.activityUpdate(ActivityType[activity.type], activity.name);
}

client.once('ready', async () => {
  logger.botInitialization(
    client.user.tag,
    client.guilds.cache.size,
    client.users.cache.size
  );
  
  loadCommands();
  await testCommands();
  setCustomActivity();
  
  logger.botReady();
  
  if (process.send) {
    process.send('ready');
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(BOT_PREFIX)) return;

  const args = message.content.slice(BOT_PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = commands.get(commandName);

  if (!command) return; // Command tidak ditemukan

  // Log command usage
  logger.command(commandName, message.author.tag, message.guild.name, true);

  try {
    await command.execute(message, args, client);
    logger.commandResult(commandName, message.author.tag, message.guild.name, 'SUCCESS');
  } catch (error) {
    logger.commandResult(commandName, message.author.tag, message.guild.name, 'FAILED', null, error);
    
    const reply = await message.reply('❌ Terjadi kesalahan saat menjalankan command.');
    setTimeout(() => {
      reply.delete().catch(() => {});
      message.delete().catch(() => {});
    }, 5000);
  }
});

// Error handling
process.on('SIGINT', () => {
  logger.shutdown('SIGINT');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.shutdown('SIGTERM');
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.unhandledRejection(reason, promise);
});

process.on('uncaughtException', (error) => {
  logger.uncaughtException(error);
  process.exit(1);
});

// Memory monitoring
setInterval(() => {
  const used = process.memoryUsage();
  const memoryUsage = Math.round(used.rss / 1024 / 1024 * 100) / 100;
  const heapUsed = Math.round(used.heapUsed / 1024 / 1024 * 100) / 100;
  const heapTotal = Math.round(used.heapTotal / 1024 / 1024 * 100) / 100;
  
  logger.memoryUsage(memoryUsage, heapUsed, heapTotal, commands.size);
}, 300000);

client.login(BOT_TOKEN);