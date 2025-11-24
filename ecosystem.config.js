module.exports = {
  apps: [{
    name: 'dark-city-server',
    script: 'server.js',
    cwd: './server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017/darkcity',
      JWT_SECRET: 'your-secret-key-change-in-production',
      BCRYPT_ROUNDS: 12,
      DISCORD_WEBHOOK_URL: ''
    },
    error_file: './server/logs/error.log',
    out_file: './server/logs/out.log',
    log_file: './server/logs/combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};
