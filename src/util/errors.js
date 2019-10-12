const chalk = require('chalk')
const path = require('path')
const utils = require('./utilities')
const { logger } = require('./logger')
const log = console.log

const error = chalk.bold.red
const info = chalk.keyword('cyan')

function handleErrors () {
  // Unhandled promise rejection
  process.on('unhandledRejection', async reason => {
    log()
    log(error('ERROR: Something unfortunate happened'))
    log(
      'You can check the error log at ' +
        info(path.join(utils.getConfigDirectory(), 'error.log'))
    )
    log()
    logger.log('error', 'unhandledRejection: ', reason)
  })

  // Uncaught error handling
  process.on('uncaughtException', async err => {
    log()
    log(error('ERROR: Something unfortunate happened'))
    log(
      'You can check the error log at ' +
        info(path.join(utils.getConfigDirectory(), 'error.log'))
    )
    log()
    logger.log('error', 'uncaughtException: ', err)
  })
}

module.exports = { handleErrors }
