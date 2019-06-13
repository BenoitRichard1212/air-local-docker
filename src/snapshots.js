const chalk = require('chalk')
const configure = require('./configure')
const auth = require('./auth')
const log = console.log
const info = chalk.keyword('cyan')

function help () {
  log(chalk.white('Usage: airlocal snapshots [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help       output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(chalk.white('  create           ') + info('Create a DB snapshot for the current env'))
}

const getSnapshotsDir = async function () {
  return await configure.get('snapshotsPath')
}

const checkIfConfigured = async function () {
  const authConfigured = await auth.checkIfAuthConfigured()

  if (authConfigured === false) {
    return false
  }

  return true
}

const createSnapshot = function () {
  console.log(chalk.yellow('Snapshots still WIP'))
}

module.exports = { help, checkIfConfigured, configure }
