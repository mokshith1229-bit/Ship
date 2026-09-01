'use strict';

const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retryCount = 0;
let memoryServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    // Try to connect to the real database first
    logger.info(`Attempting MongoDB connection to: ${uri}`);
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000, // Reduced timeout so we fallback faster if it's not running
        socketTimeoutMS: 45000
      });
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      logger.info(`Database: ${conn.connection.name}`);
      retryCount = 0;
      return;
    } catch (realErr) {
      // If it's a connection refused or timeout (typical of no local DB), fallback to memory server
      if (realErr.message.includes('ECONNREFUSED') || realErr.message.includes('ECONNRESET') || realErr.message.includes('timeout')) {
        logger.warn(`Failed to connect to real MongoDB (${realErr.message}). Falling back to In-Memory MongoDB for development...`);
        
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri();
        
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000,
        });
        logger.info(`In-Memory MongoDB Connected: ${conn.connection.host}`);
        logger.info(`In-Memory URI: ${uri}`);
        retryCount = 0;
        return;
      } else {
        throw realErr; // rethrow other types of errors
      }
    }
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);

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

// Optionally gracefully stop memory server on exit
process.on('SIGINT', async () => {
  if (memoryServer) await memoryServer.stop();
  process.exit(0);
});

module.exports = connectDB;
