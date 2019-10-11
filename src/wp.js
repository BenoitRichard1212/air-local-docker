const chalk = require('chalk')
const execSync = require('child_process').execSync
const gateway = require('./gateway')
const environment = require('./environment')
const envUtils = require('./util/env')
const utils = require('./util/utilities')
const log = console.log
const error = chalk.bold.red

function help () {
  log(chalk.white('Usage: airlocal wp "[command]"'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help       output usage information'))
}

const command = async function (wpCmd) {
  const envSlug = await envUtils.parseOrPromptEnv()
  if (envSlug === false) {
    log(
      error(
        "Error: Unable to determine which environment to use WP CLI with. Please run this command from within your environment's directory."
      )
    )
  } else {
    const envPath = await utils.envPath(envSlug)

    // Check if the container is running, otherwise, start up the stacks
    try {
      const output = execSync('docker-compose ps', { cwd: envPath }).toString()
      if (output.indexOf('phpfpm') === -1) {
        await gateway.startGlobal()
        await environment.start(envSlug)
      }
    } catch (ex) {}

    // Check for TTY
    const ttyFlag = process.stdin.isTTY ? '' : '-T'

    log(wpCmd)

    // Run the command
    try {
      execSync(
        `docker-compose exec ${ttyFlag} --user www-data phpfpm wp ${wpCmd}`,
        { stdio: 'inherit', cwd: envPath }
      )
    } catch (ex) {}
  }
}

module.exports = { help, command }
