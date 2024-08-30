const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

// custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}] : ${stack || message}`;
})

const logger = createLogger({
    level: 'info',
    format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/error.log', level: 'error' }), // Error logs
        new transports.File({ filename: 'logs/combined.log' }), // All logs
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' }), // Uncaught exceptions
    ],
    rejectionHandlers: [
        new transports.File({ filename: 'logs/rejections.log' }), // Unhandled promise rejections
    ],
});

module.exports = logger;