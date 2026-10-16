module.exports = {
  apps: [
    {
      name: 'nexus-backend',
      script: 'server.js',
      instances: 'max', // Utilizes all available DGX worker cores allocated (or set to 4 / 8)
      exec_mode: 'cluster',
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=4096',
        UV_THREADPOOL_SIZE: '64',
        MAX_COMPILER_CONCURRENCY: '32',
        ENABLE_SOCKET_REDIS: 'false'
      },
      env_production: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=4096',
        UV_THREADPOOL_SIZE: '64',
        MAX_COMPILER_CONCURRENCY: '32',
        ENABLE_SOCKET_REDIS: 'true'
      }
    }
  ]
};
