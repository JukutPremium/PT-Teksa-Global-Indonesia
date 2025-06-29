module.exports = {
  apps: [
    {
      name: "PT-Teksa-Digital-Indonesia",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      
      // Watch configuration - bot akan restart otomatis saat file berubah
      watch: true,
      watch_delay: 1000,
      ignore_watch: [
        "node_modules",
        "logs",
        ".git",
        "*.log",
        ".env"
      ],
      
      // Memory management
      max_memory_restart: "300M",
      
      // Environment
      env: {
        NODE_ENV: "development",
        watch: true  // Enable watch di production
      },
      env_production: {
        NODE_ENV: "production",
        watch: false  // Disable watch di production
      },
      
      // Logging
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
      
      // Restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      
      // Process management
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 8000,

      // Advanced options
      merge_logs: true,
      combine_logs: true,
      
      // Source map support
      source_map_support: true,
      
      // Process title
      instance_var: "INSTANCE_ID"
    }
  ],
  
  // Deploy configuration (opsional)
  deploy: {
    production: {
      user: "node",
      host: "localhost", 
      ref: "origin/master",
      repo: "git@github.com:your-username/discord-bot.git",
      path: "/var/www/discord-bot",
      "post-deploy": "npm install && pm2 reload ecosystem.config.js --env production"
    }
  }
};