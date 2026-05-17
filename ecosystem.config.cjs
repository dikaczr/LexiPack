module.exports = {
  apps: [
    {
      name: "lexipack-api",
      script: "server/server.js",
      cwd: "C:/Users/rober/LexiPack",
      interpreter: "node",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
    {
      name: "lexipack-web",
      script: "npx",
      args: "serve -s client/dist -l 4001",
      cwd: "C:/Users/rober/LexiPack",
      watch: false,
    },
  ],
};
