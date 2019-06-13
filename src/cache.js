const chalk = require('chalk')
const gateway = require('./gateway')
const log = console.log
const info = chalk.keyword('cyan')

function help () {
  log(chalk.white('Usage: airlocal auth [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help       output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(chalk.white('  clear            ') + info('Clears WP-CLI, NPM, and AIRSnapshots caches'))
  log(chalk.white('  info             ') + info('Show AIR authentication status'))
}

const clear = async function () {
  await gateway.removeCacheVolume()
  await gateway.ensureCacheExists()

  console.log('Cache Cleared')
}

const printInfo = async function () {
  console.log('Cache Volume Information')
}

module.exports = { help, clear, printInfo }
