module.exports = {
  apps: [
    {
      name: 'CODE_BREAKER_BOT',
      script: './dist/index.js',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: false,
      log_file: '/home/logs/CODE_BREAKER_BOT.log',
    },
  ],
};
