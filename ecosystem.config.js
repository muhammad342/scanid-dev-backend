module.exports = {
  apps: [
    {
      name: "riders-emergency-backend",
      script: "dist/core/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 8000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
};
  