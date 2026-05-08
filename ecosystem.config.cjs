module.exports = {
  apps: [
    {
      name: 'certmaster-backend',
      script: './server.js',
      interpreter: '/home/ubuntu/.nvm/versions/node/v20.19.6/bin/node',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};

