// Logger utility for Discord bot with enhanced features
const fs = require('fs');
const path = require('path');

// Colors for console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.createLogDir();
  }

  createLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  // Write to log file
  writeToFile(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logFile = path.join(this.logDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
    
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (data) {
      logEntry += `\nData: ${JSON.stringify(data, null, 2)}`;
    }
    logEntry += '\n';

    fs.appendFileSync(logFile, logEntry);
  }

  // Enhanced logging methods
  info(message, data = null) {
    console.log(`${colors.cyan}ℹ️ [INFO] ${message}${colors.reset}`);
    this.writeToFile('info', message, data);
  }

  success(message, data = null) {
    console.log(`${colors.green}✅ [SUCCESS] ${message}${colors.reset}`);
    this.writeToFile('success', message, data);
  }

  warning(message, data = null) {
    console.log(`${colors.yellow}⚠️ [WARNING] ${message}${colors.reset}`);
    this.writeToFile('warning', message, data);
  }

  error(message, error = null) {
    console.log(`${colors.red}❌ [ERROR] ${message}${colors.reset}`);
    if (error) {
      console.error(error);
    }
    this.writeToFile('error', message, error ? error.stack : null);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}🐛 [DEBUG] ${message}${colors.reset}`);
      this.writeToFile('debug', message, data);
    }
  }

  command(commandName, user, guild, success = true) {
    const message = `Command "${commandName}" executed by ${user} in ${guild}`;
    if (success) {
      console.log(`${colors.blue}📝 [COMMAND] ${message} - ${colors.green}SUCCESS${colors.reset}`);
    } else {
      console.log(`${colors.blue}📝 [COMMAND] ${message} - ${colors.red}FAILED${colors.reset}`);
    }
    this.writeToFile('command', message, { commandName, user, guild, success });
  }

  // Enhanced test result logging
  testResult(testName, status, details = null, error = null) {
    const timestamp = this.getTimestamp();
    let message = `Test: ${testName}`;
    
    if (status === 'PASSED' || status === 'SUCCESS') {
      console.log(`${colors.green}✅ [TEST] ${message} - PASSED${colors.reset}`);
      this.writeToFile('test', `${message} - PASSED`, details);
    } else if (status === 'FAILED' || status === 'FAIL') {
      console.log(`${colors.red}❌ [TEST] ${message} - FAILED${colors.reset}`);
      if (error) {
        console.log(`${colors.red}   Error: ${error}${colors.reset}`);
      }
      this.writeToFile('test', `${message} - FAILED`, { details, error: error?.toString() });
    } else if (status === 'SKIPPED') {
      console.log(`${colors.yellow}⏭️ [TEST] ${message} - SKIPPED${colors.reset}`);
      this.writeToFile('test', `${message} - SKIPPED`, details);
    }
  }

  // Test suite summary with failed tests still shown
  testSummary(results) {
    const passed = results.filter(r => r.status === 'PASSED' || r.status === 'SUCCESS').length;
    const failed = results.filter(r => r.status === 'FAILED' || r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const total = results.length;

    console.log(`\n${colors.bright}${colors.blue}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}⏭️ Skipped: ${skipped}${colors.reset}`);
    console.log(`${colors.cyan}📋 Total: ${total}${colors.reset}`);

    // Always show detailed results table, including failed tests
    if (results.length > 0) {
      const headers = ['Test Name', 'Status', 'Duration', 'Details'];
      const rows = results.map(result => [
        result.name,
        this.formatStatus(result.status),
        result.duration ? `${result.duration}ms` : 'N/A',
        result.error ? `Error: ${result.error}` : (result.details || 'No details')
      ]);

      this.table(headers, rows, 'Detailed Test Results', 'blue');
    }

    this.writeToFile('test_summary', 'Test Summary', { passed, failed, skipped, total, results });
  }

  // Format status with appropriate icons and colors
  formatStatus(status) {
    switch (status?.toUpperCase()) {
      case 'PASSED':
      case 'SUCCESS':
        return '✅ PASSED';
      case 'FAILED':
      case 'FAIL':
        return '❌ FAILED';
      case 'SKIPPED':
        return '⏭️ SKIPPED';
      case 'PARTIAL':
        return '⚠️ PARTIAL';
      default:
        return `❓ ${status || 'UNKNOWN'}`;
    }
  }

  // Enhanced command result logging with failure handling
  commandResult(commandName, user, guild, status, details = null, error = null) {
    const message = `Command "${commandName}" by ${user} in ${guild}`;
    
    if (status === 'SUCCESS' || status === 'PASSED') {
      console.log(`${colors.blue}📝 [COMMAND] ${message} - ${colors.green}SUCCESS${colors.reset}`);
    } else if (status === 'FAILED' || status === 'FAIL') {
      console.log(`${colors.blue}📝 [COMMAND] ${message} - ${colors.red}FAILED${colors.reset}`);
      if (error) {
        console.log(`${colors.red}   Error: ${error}${colors.reset}`);
      }
    } else if (status === 'PARTIAL') {
      console.log(`${colors.blue}📝 [COMMAND] ${message} - ${colors.yellow}PARTIAL${colors.reset}`);
    }

    this.writeToFile('command_result', message, { 
      commandName, 
      user, 
      guild, 
      status, 
      details, 
      error: error?.toString() 
    });
  }

  // Advanced table logging with enhanced error handling
  table(headers, rows, title = '', color = 'cyan', showFailuresOnly = false) {
    // Filter rows if only showing failures
    let displayRows = rows;
    if (showFailuresOnly) {
      displayRows = rows.filter(row => 
        row.some(cell => 
          String(cell).includes('FAILED') || 
          String(cell).includes('❌') || 
          String(cell).includes('ERROR')
        )
      );
    }

    if (title) {
      console.log(`${colors[color]}${colors.bright}\n📊 ${title}${colors.reset}`);
      if (showFailuresOnly && displayRows.length === 0) {
        console.log(`${colors.green}✅ No failures to display${colors.reset}`);
        return;
      }
    }
    
    // Calculate column widths
    const widths = headers.map((header, i) => 
      Math.max(header.length, ...displayRows.map(row => String(row[i] || '').length))
    );
    
    let tableStr = '';
    
    // Top border
    const topBorder = '┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
    console.log(topBorder);
    tableStr += topBorder + '\n';
    
    // Headers
    const headerRow = '│ ' + headers.map((header, i) => 
      `${colors.bright}${colors.white}${header.padEnd(widths[i])}${colors.reset}`
    ).join(' │ ') + ' │';
    console.log(headerRow);
    tableStr += '│ ' + headers.map((header, i) => header.padEnd(widths[i])).join(' │ ') + ' │\n';
    
    // Separator
    const separator = '├' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
    console.log(separator);
    tableStr += separator + '\n';
    
    // Rows
    displayRows.forEach(row => {
      const coloredRow = '│ ' + row.map((cell, i) => {
        const cellStr = String(cell || '');
        let coloredCell = cellStr;
        
        // Enhanced color coding based on content
        if (cellStr.includes('✅') || cellStr.includes('SUCCESS') || cellStr.includes('PASSED') || cellStr.includes('LOADED')) {
          coloredCell = `${colors.green}${cellStr}${colors.reset}`;
        } else if (cellStr.includes('❌') || cellStr.includes('FAILED') || cellStr.includes('FAIL') || cellStr.includes('ERROR')) {
          coloredCell = `${colors.red}${cellStr}${colors.reset}`;
        } else if (cellStr.includes('⚠️') || cellStr.includes('WARNING') || cellStr.includes('PARTIAL') || cellStr.includes('⏭️') || cellStr.includes('SKIPPED')) {
          coloredCell = `${colors.yellow}${cellStr}${colors.reset}`;
        } else if (cellStr.includes('🔧') || cellStr.includes('ADMIN')) {
          coloredCell = `${colors.magenta}${cellStr}${colors.reset}`;
        } else if (cellStr.includes('ℹ️') || cellStr.includes('INFO')) {
          coloredCell = `${colors.cyan}${cellStr}${colors.reset}`;
        }
        
        return coloredCell.padEnd(widths[i] + (coloredCell.length - cellStr.length));
      }).join(' │ ') + ' │';
      
      console.log(coloredRow);
      tableStr += '│ ' + row.map((cell, i) => String(cell || '').padEnd(widths[i])).join(' │ ') + ' │\n';
    });
    
    // Bottom border
    const bottomBorder = '└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
    console.log(bottomBorder);
    tableStr += bottomBorder;
    
    // Save table to file
    this.writeToFile('table', `Table: ${title}`, { 
      headers, 
      totalRows: rows.length, 
      displayedRows: displayRows.length, 
      showFailuresOnly,
      tableStr 
    });
  }

  // Show only failed results table
  failuresTable(headers, rows, title = 'Failed Results') {
    this.table(headers, rows, title, 'red', true);
  }

  // Header with borders
  header(title, color = 'cyan') {
    const line = '═'.repeat(60);
    const header = `╔${line}╗\n║${title.padStart((60 + title.length) / 2).padEnd(60)}║\n╚${line}╝`;
    
    console.log(`${colors[color]}${colors.bright}${header}${colors.reset}`);
    this.writeToFile('header', title);
  }

  // Performance monitoring
  performance(operation, duration, details = null) {
    const message = `${operation} completed in ${duration}ms`;
    console.log(`${colors.magenta}⚡ [PERFORMANCE] ${message}${colors.reset}`);
    this.writeToFile('performance', message, details);
  }

  // Bot statistics with failure tracking
  stats(stats, includeFailures = true) {
    console.log(`${colors.bright}📈 BOT STATISTICS:${colors.reset}`);
    Object.entries(stats).forEach(([key, value]) => {
      let displayValue = value;
      let color = colors.cyan;
      
      // Color code based on key names and values
      if (key.toLowerCase().includes('error') || key.toLowerCase().includes('fail')) {
        color = colors.red;
      } else if (key.toLowerCase().includes('success') || key.toLowerCase().includes('pass')) {
        color = colors.green;
      } else if (key.toLowerCase().includes('warning') || key.toLowerCase().includes('skip')) {
        color = colors.yellow;
      }
      
      console.log(`${color}  ${key}: ${colors.bright}${displayValue}${colors.reset}`);
    });
    
    this.writeToFile('stats', 'Bot Statistics', stats);
  }

  // Clear console (useful for development)
  clear() {
    console.clear();
  }

  // Separator line
  separator(char = '─', length = 60) {
    console.log(`${colors.dim}${char.repeat(length)}${colors.reset}`);
  }

  // Enhanced batch operation logging
  batchResult(operationName, results, showAllResults = true) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    console.log(`\n${colors.bright}${colors.blue}📦 BATCH OPERATION: ${operationName}${colors.reset}`);
    console.log(`${colors.green}✅ Successful: ${successful}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`${colors.cyan}📋 Total: ${total}${colors.reset}`);

    if (showAllResults && results.length > 0) {
      const headers = ['Item', 'Status', 'Details'];
      const rows = results.map(result => [
        result.name || result.id || 'Unknown',
        result.success ? '✅ SUCCESS' : '❌ FAILED',
        result.error || result.message || 'No details'
      ]);

      this.table(headers, rows, `${operationName} - Detailed Results`, 'blue');
    } else if (failed > 0) {
      // Show only failures if not showing all results
      const failedResults = results.filter(r => !r.success);
      const headers = ['Item', 'Status', 'Error Details'];
      const rows = failedResults.map(result => [
        result.name || result.id || 'Unknown',
        '❌ FAILED',
        result.error || result.message || 'Unknown error'
      ]);

      this.failuresTable(headers, rows, `${operationName} - Failures Only`);
    }

    this.writeToFile('batch_result', `Batch Operation: ${operationName}`, {
      operationName,
      successful,
      failed,
      total,
      results
    });
  }

  // ====== BOT-SPECIFIC LOGGING METHODS ======

  // Bot initialization logging
  botInitialization(botTag, guildCount = 0, userCount = 0) {
    this.header('BOT INITIALIZATION', 'green');
    this.success(`Bot is online as ${botTag}`);
    this.info(`Logged in at: ${new Date().toISOString()}`);
    this.info(`Serving ${guildCount} guilds`);
    this.info(`Total users: ${userCount}`);
  }

  // Bot ready logging
  botReady() {
    this.header('BOT READY', 'green');
    this.success('Bot is fully initialized and ready to serve!');
  }

  // Command loading with table
  commandLoadingResults(commandData, stats) {
    this.header('LOADING COMMANDS', 'blue');
    this.info(`Scanning commands folder: ${stats.total} files found`);
    
    this.table(
      ['Command', 'Description', 'Usage', 'File', 'Status'],
      commandData,
      'Command Loading Results'
    );
    
    this.stats({
      'Successfully loaded': stats.loaded,
      'Failed to load': stats.failed,
      'Total commands': stats.total
    });
    
    if (stats.loaded > 0) {
      this.success('All commands ready for use!');
    }
  }

  // Command testing with comprehensive results
  commandTestingResults(testResults) {
    this.header('COMMAND TESTING', 'magenta');
    
    if (testResults.length === 0) {
      this.warning('No commands to test!');
      return;
    }
    
    this.info(`Testing ${testResults.length} commands...`);
    
    // Log individual test results
    testResults.forEach(result => {
      this.testResult(result.name, result.status, result.details, result.error);
    });
    
    // Display test summary
    this.testSummary(testResults);
  }

  // Memory monitoring
  memoryUsage(memoryUsage, heapUsed, heapTotal, commandCount = 0) {
    console.log(`${colors.dim}💾 Memory - RSS: ${memoryUsage}MB | Heap: ${heapUsed}/${heapTotal}MB | Commands: ${commandCount}${colors.reset}`);
    
    this.writeToFile('memory', 'Memory Usage', {
      rss: memoryUsage,
      heapUsed,
      heapTotal,
      commandCount,
      timestamp: this.getTimestamp()
    });
  }

  // Activity update
  activityUpdate(activityType, activityName) {
    this.info(`Activity updated: ${activityType} ${activityName}`);
  }

  // Shutdown logging
  shutdown(reason = 'Unknown') {
    this.warning(`Received ${reason}, shutting down gracefully...`);
  }

  // Unhandled errors
  unhandledRejection(reason, promise) {
    this.error('Unhandled Rejection', { reason, promise });
  }

  uncaughtException(error) {
    this.error('Uncaught Exception', error);
  }
}

// Export singleton instance
module.exports = new Logger();