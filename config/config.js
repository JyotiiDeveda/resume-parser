require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    port: process.env.DB_PORT,
    define: {
      paranoid: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    },
    pool: {
      max: 60, // Maximum number of connections in pool
      min: 18, // Minimum number of connections in pool
      acquire: 60000, // Maximum time (ms) to wait for a connection
      idle: 10000 // Maximum time (ms) that a connection can be idle before being released
    }
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    port: process.env.DB_PORT,
    define: {
      paranoid: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    },
    pool: {
      max: 60, // Maximum number of connections in pool
      min: 18, // Minimum number of connections in pool
      acquire: 60000, // Maximum time (ms) to wait for a connection
      idle: 10000 // Maximum time (ms) that a connection can be idle before being released
    }
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    port: process.env.DB_PORT,
    define: {
      paranoid: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    },
    pool: {
      max: 60, // Maximum number of connections in pool
      min: 18, // Minimum number of connections in pool
      acquire: 60000, // Maximum time (ms) to wait for a connection
      idle: 10000 // Maximum time (ms) that a connection can be idle before being released
    }
  }
};
