module.exports = {
  apps: [
    {
      name: 'hello',
      script: 'src/server.js',
      autorestart: true,
      max_restarts: 10,
      env: { NODE_ENV: 'production' }
    }
  ]
};