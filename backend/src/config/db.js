'use strict';

const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retryCount = 0;
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    logger.info('Using cached MongoDB connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    logger.info("Mongo URI: " + process.env.MONGODB_URI);
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 100, // Good default for concurrent users
      bufferCommands: false // Fail fast in serverless environments
    }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;

    logger.info(`MongoDB Connected: ${cached.conn.connection.host}`);
    logger.info(`Database: ${cached.conn.connection.name}`);
    retryCount = 0;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    logger.error(`MongoDB connection error: ${err.message}`);

    if (process.env.VERCEL) {
      throw err; // In serverless, fail immediately so the API returns a 500 response instead of hanging
    }

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.warn(`Retrying connection (${retryCount}/${MAX_RETRIES}) in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(connectDB, RETRY_DELAY_MS);
    } else {
      logger.error('Max retries reached. Exiting process.');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected.');
});

module.exports = connectDB;
