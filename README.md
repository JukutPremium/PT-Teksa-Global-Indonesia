<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=200&section=header&text=Teksa%20Global%20Indonesia&fontSize=70&fontAlignY=35" width="100%"/>
</div>

## Overview
A multifunctional Discord bot that provides automatic role verification system, host/server information monitoring, and bot activity management. Built using Discord.js v14 with focus on security and efficiency.

## Features
- **Role Verification System**: Automatic verification system using unique codes
- **Host Information Monitor**: Detailed system and hosting server monitoring
- **Activity Management**: Bot status and activity configuration
- **Auto-cleanup Messages**: Automatic message deletion to maintain channel cleanliness
- **Permission-based Commands**: Administrator role-based permission system

## Prerequisites
- Node.js (v16.9.0 or higher)
- Discord.js v14
- Discord Bot Token
- Server with appropriate permissions

## Installation

### 1. Clone or Download Project
```bash
git clone https://github.com/JukutPremium/PT-Teksa-Global-Indonesia.git
cd PT-Teksa-Global-Indonesia
```

### 2. Install Dependencies
```bash
npm install discord.js dotenv
```

### 3. Environment Setup
Create `.env` file in root directory:
```env
BOT_TOKEN=your_discord_bot_token_here
BOT_PREFIX=!
GUILD_ID=your_guild_id_here
VERIFY_CHANNEL_ID=your_verification_channel_id_here
```

### 4. Configuration Files
Create `codes.json` file for verification system:
```json
{
  "Awkcs": "123123123123123",
}
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BOT_TOKEN` | Discord Bot Token from Developer Portal | ✅ | - |
| `BOT_PREFIX` | Prefix for commands | ❌ | `!` |
| `GUILD_ID` | Target Discord Server ID | ✅ | - |
| `VERIFY_CHANNEL_ID` | Dedicated verification channel ID | ✅ | - |

## Commands

### 1. `!verify <code>`
**Purpose**: Grants role based on valid verification code

**Usage**: 
```
!verify Awkcs
```

**Features**:
- Can only be used in designated verification channel
- Auto-delete message after 5 seconds
- Code validation from `codes.json`
- Bot permission check for role assignment

**Requirements**:
- User must be in correct channel
- Code must be valid and registered in `codes.json`
- Bot must have "Manage Roles" permission
- Target role must be below bot's role in hierarchy

### 2. `!hostinfo`
**Purpose**: Displays comprehensive system and hosting information

**Usage**:
```
!hostinfo
```

**Information Displayed**:
- **Bot Information**: Uptime, ping, Node.js/Discord.js version, guild count
- **Host Detection**: Hosting provider, server type, location, timezone
- **Network & Identity**: Hostname, username, internal IP (censored), process ID
- **System Information**: OS, system uptime, working directory
- **CPU Information**: Model, cores, load average
- **Memory Usage**: Total, used, bot memory with progress bar

**Requirements**:
- User must have Administrator permission
- Auto-delete after 2 minutes

### 3. `!activity <text>`
**Purpose**: Changes bot activity status

**Usage**:
```
!activity Watching the server
```

**Features**:
- Real-time bot activity modification
- Default activity type: Playing
- Auto-delete message after 5 seconds

**Requirements**:
- User must have Administrator permission

## File Structure
```
project/
├── index.js              # Main entry point to run the bot
├── commands/             # Folder containing modular bot commands
│   ├── verify.js         # Command to verify users (e.g. using a code)
│   ├── activity.js       # Command to set or display the bot's activity
│   └── hostinfo.js       # Command to show host/server information
│   └── security.js       # Command to show statistic security for verification
├── variables/
│   └── codes.json        # JSON file to store verification codes and related data
├── utils/
│   └── logger.js         # Custom logging utility
│   └── security.js       # Custom security utility
├── .env                  # Environment variables file (e.g. for storing the bot token)
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

## Security Features

### Permission Control
- Admin-only commands for `!hostinfo`, `!activity`, `!security`
- Channel restriction for `!verify`
- Automatic message cleanup to prevent spam

### Information Protection
- Internal IP address censoring in output
- Sensitive system information only available to admins
- Auto-delete to prevent information leakage

### Error Handling
- Graceful shutdown with SIGINT/SIGTERM handlers
- Unhandled rejection and exception handling
- Comprehensive error logging

## Technical Details

### Bot Intents
```javascript
intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers
]
```

### Memory Monitoring
- Memory usage logging every 5 minutes
- Memory usage bar visualization
- Process memory tracking (RSS, Heap, External)

### Host Detection Algorithm
Bot can detect various hosting providers:
- DigitalOcean, AWS, Google Cloud, Azure
- Vultr, Linode, OVH, Contabo, Hetzner
- Docker containers, WSL environments
- Local Windows/macOS/Linux systems

### Auto-cleanup Timers
- Verification messages: 5 seconds
- Error messages: 5 seconds
- Host info display: 2 minutes

## System Information Features

### Hosting Provider Detection
The bot automatically detects hosting providers based on:
- **Hostname patterns**: Identifies DigitalOcean, AWS, GCP, Azure, etc.
- **Environment detection**: Docker containers, WSL, native systems
- **Geographic location**: Based on system timezone
- **Server type identification**: VPS, dedicated, local machine

### Memory Usage Visualization
- Real-time memory monitoring with progress bars
- System vs. process memory differentiation
- Heap usage tracking for performance optimization

### CPU Monitoring
- CPU model and core count detection
- Load average monitoring for performance insights
- Cross-platform compatibility (Windows, macOS, Linux)

## Troubleshooting

### Common Issues

#### 1. Bot not responding to commands
- Check BOT_TOKEN in `.env`
- Ensure bot is online and has correct permissions
- Verify prefix matches configuration

#### 2. Verification fails
- Ensure `codes.json` has correct format
- Check if role_id in `codes.json` is valid
- Verify bot has "Manage Roles" permission
- Ensure bot role is above target role in hierarchy

#### 3. Host info command error
- User must have Administrator permission
- Check for errors in system detection

#### 4. High memory usage
- Monitor memory usage logs
- Restart bot if necessary
- Check for memory leaks

### Debug Commands
For debugging, add logging:
```javascript
console.log('Command executed:', command);
console.log('User permissions:', message.member.permissions.toArray());
console.log('Channel ID:', message.channel.id);
```

## Performance Optimization

### Memory Management
- Automatic memory usage logging
- Efficient data structures
- Proper event handler cleanup

### Message Cleanup
- Timed message deletion to prevent channel spam
- Error message auto-removal
- Efficient embed usage

### System Resources
- Load average monitoring
- CPU usage tracking
- Memory usage visualization

## Deployment

### Development
```bash
node index.js
```

### Production (PM2)
```bash
npm install -g pm2
pm2 start index.js --name "discord-bot"
pm2 save
pm2 startup
```

## Configuration Examples

### Basic Configuration
```json
// codes.json
{
  "STUDENT": "123456789012345678",
  "TEACHER": "987654321098765432",
  "ADMIN": "111111111111111111"
}
```

### Advanced Configuration
```json
// codes.json with multiple roles
{
  "NEW2025": "123456789012345678",
  "VIP2025": "987654321098765432",
  "MOD2025": "111111111111111111",
  "BETA": "222222222222222222",
  "PREMIUM": "333333333333333333"
}
```

## Monitoring and Logging

### Built-in Monitoring
- Memory usage logging every 5 minutes
- Error tracking with stack traces
- Performance metrics collection
- System resource monitoring

### Log Levels
- **Info**: General bot operations
- **Error**: Command failures and exceptions
- **Debug**: Detailed system information

## Security Best Practices

### Token Security
- Never commit BOT_TOKEN to version control
- Use environment variables for all sensitive data
- Rotate tokens regularly
- Limit bot permissions to minimum required

### Permission Management
- Implement role-based access control
- Validate user permissions before command execution
- Use channel restrictions for sensitive commands
- Regular permission audits

## Contributing

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use ES6+ features
- Implement proper error handling
- Add comprehensive comments
- Follow Discord.js best practices

## Changelog
### ADD
> - Verification Logs & Security
> - New Command : !security [stats|report|clean]

### Version 1.0.0
- Initial release
- Role verification system
- Verification Logs
- Host information monitoring
- Activity management
- Auto-cleanup functionality

## Support and Resources

- **Discord.js Documentation**: https://discord.js.org/
- **Discord Developer Portal**: https://discord.com/developers/applications
- **Node.js Documentation**: https://nodejs.org/docs/

## License
MIT License - see LICENSE file for details

## Acknowledgments
- Discord.js community for excellent documentation
- Node.js team for robust runtime environment
- Contributors and testers

---

**Important**: Keep your BOT_TOKEN confidential and never share it with anyone. Use environment variables for all sensitive data and follow security best practices.
