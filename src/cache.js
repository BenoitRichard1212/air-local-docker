const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const config = require('./configure')
const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const log = console.log

function help () {
  log(chalk.white('Usage: airlocal cache [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help       output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(
    chalk.white('  clear            ') +
      info('Clears WP-CLI, NPM, and Composer caches')
  )
}

const clear = async function () {
  try {
    await fs.ensureDir(path.join(config.getConfigDirectory(), 'cache'))
    await fs.emptyDir(path.join(config.getConfigDirectory(), 'cache'))
  } catch (err) {
    logger.log('error', err)
    log(error('Failed to delete AirLocal cache'))
    process.exit(1)
  }
  log(success('AirLocal cache cleared'))
}

const printInfo = async function () {
  await fs.ensureDir(path.join(config.getConfigDirectory(), 'cache'))
  const cacheDir = path.join(config.getConfigDirectory(), 'cache')
  log(info('Cache directory: ' + cacheDir))
}

module.exports = { help, clear, printInfo }
