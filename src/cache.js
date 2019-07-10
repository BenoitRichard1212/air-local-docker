const chalk = require('chalk')
const gateway = require('./gateway')
const execSync = require('child_process').execSync
const log = console.log
const info = chalk.keyword('cyan')
const warning = chalk.keyword('orange')

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

  log(warning('Cache Cleared'))
}

const printInfo = async function () {
  log(chalk.white('Cache Volume Information'))
  let networks = execSync('docker volume ls --filter name=^airlocalCache$').toString()
  log(networks)
}

module.exports = { help, clear, printInfo }
