import winston from "winston";

const { combine, timestamp, printf, colorize, align} = winston.format;

const logFormat = printf((info) => `[${info.timestamp
}] ${info.level}: ${info.message}`);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format : combine(
    timestamp({ format : 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.json()
  ),
  transports : [
    new winston.transports.Console({
      format: combine(
        colorize({ all : true}),
        align(),
        logFormat
      )
    })
  ]
})