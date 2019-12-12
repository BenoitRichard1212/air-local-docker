const path = require('path')
const { createLogger, format, transports } = require('winston')
const utils = require('./utilities')

const configDir = utils.getConfigDirectory()

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
      filename: path.join(configDir, 'error.log'),
      maxsize: '40m',
      maxFiles: 5
    })
  ]
})

function log (level, message) {
  logger.log(level, message)
}

function error (message) {
  logger.log('error', message)
}

function info (message) {
  logger.log('info', message)
}

module.exports = { logger, log, error, info }
