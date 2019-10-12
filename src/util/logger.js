const path = require('path')
const { createLogger, format, transports } = require('winston')
const utils = require('./utilities')

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

module.exports = { logger }
