'use strict';

const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, align, json } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
});

const transports = [
  // Console transport
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      align(),
      consoleFormat
    )
  })
];

const exceptionHandlers = [];
const rejectionHandlers = [];

// Only add file logging if NOT running on Vercel (Vercel is a read-only filesystem)
if (!process.env.VERCEL) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  );
  exceptionHandlers.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log')
    })
  );
  rejectionHandlers.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log')
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports,
  exceptionHandlers,
  rejectionHandlers
});

module.exports = logger;
