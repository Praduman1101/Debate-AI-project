const winston = require('winston');
const path    = require('path');

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console(),
    // Uncomment in production to write to log files:
    // new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'),   level: 'error' }),
    // new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
  ],
  exitOnError: false,
});

// Morgan stream for HTTP request logging
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
