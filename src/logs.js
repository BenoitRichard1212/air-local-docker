const chalk = require('chalk')
const execSync = require('child_process').execSync
const gateway = require('./gateway')
const envUtils = require('./util/env')
const utils = require('./util/utilities')
const environment = require('./environment')
const log = console.log
const error = chalk.bold.red
const info = chalk.keyword('cyan')

function help () {
  log(chalk.white('Command: airlocal logs'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(
    chalk.white('  logs               ') +
      info('Show all logs for all running containers')
  )
  log(
    chalk.white('  logs [container]   ') +
      info('Show logs for a specific container')
  )
}

const command = async function (container) {
  const envSlug = await envUtils.parseOrPromptEnv()
  if (envSlug === false) {
    log(
      error(
        'Error: Unable to determine which environment to show logs from. Please run this command from within your environment.'
      )
    )
  } else {
    const envPath = await utils.envPath(envSlug)

    // Check if the container is running, otherwise, start up the stacks
    // If we're listening for output on all containers (subcommand is '') don't start, just attach
    try {
      const output = execSync('docker-compose ps', { cwd: envPath }).toString()
      if (container && output.indexOf(container) === -1) {
        await gateway.startGlobal()
        await environment.start(envSlug)
      }
    } catch (ex) {}

    try {
      execSync(`docker-compose logs -f ${container}`, {
        stdio: 'inherit',
        cwd: envPath
      })
    } catch (ex) {}
  }
}

module.exports = { command, help }
