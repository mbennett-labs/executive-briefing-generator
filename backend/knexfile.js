require('dotenv').config();
const path = require('path');

const basePath = __dirname;

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(basePath, 'data', 'qsl_briefing.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(basePath, 'migrations')
    },
    seeds: {
      directory: path.join(basePath, 'seeds')
    }
  },
  production: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || path.join(basePath, 'data', 'qsl_briefing.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(basePath, 'migrations')
    },
    seeds: {
      directory: path.join(basePath, 'seeds')
    }
  }
};
