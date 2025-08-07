module.exports = {
  apps: [{
    name: 'temp-mail-system',
    script: 'server-public.js',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      DOMAIN: 'localhost'
    },
    
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DOMAIN: 'yourdomain.com', // Thay bằng domain thật của bạn
      SMTP_PORT: 25,
      SMTP_HOST: '0.0.0.0'
    },
    
    // Logs
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 5,
    min_uptime: '10s',
    
    // Memory
    max_memory_restart: '500M'
  }]
};
