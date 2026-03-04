module.exports = {
  apps: [
    {
      name: 'aramabul',
      script: 'backend/server.js',
      cwd: '/var/www/aramabul',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        API_HOST: '127.0.0.1',
        API_PORT: '8787',
      },
      max_memory_restart: '350M',
      listen_timeout: 10000,
      kill_timeout: 5000,
      autorestart: true,
      time: true,
    },
  ],
};
