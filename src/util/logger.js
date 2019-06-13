const path = require('path')
const { utilPath } = require('./variables')
const winston = require('winston')
const { LoggingWinston } = require('@google-cloud/logging-winston')
const utils = require('./utilities')
const configDir = utils.getConfigDirectory()

const loggingWinston = new LoggingWinston({
  projectId: 'forty-five-air',
  keyFilename: path.join(utilPath, 'logger.json')
})

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join(configDir, 'error.log'),
      maxsize: '40m',
      maxFiles: 5
    })
  ]
})

logger.add(loggingWinston)

module.exports = { logger }
