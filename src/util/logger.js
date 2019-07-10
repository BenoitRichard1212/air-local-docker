const path = require('path')
const { createLogger, format, transports } = require('winston')
const { LoggingWinston } = require('@google-cloud/logging-winston')
const { utilPath } = require('./variables')
const utils = require('./utilities')

const loggingWinston = new LoggingWinston({
  projectId: 'forty-five-air',
  keyFilename: path.join(utilPath, 'logger.json')
})

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'air-local-docker' },
  transports: [
    new transports.File({
      filename: path.join(utils.getConfigDirectory(), 'error.log'),
      maxsize: '40m',
      maxFiles: 5
    })
  ]
})

module.exports = { logger, loggingWinston }
