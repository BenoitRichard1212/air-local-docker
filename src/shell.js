const execSync = require('child_process').execSync
const gateway = require('./gateway')
const environment = require('./environment')
const env = require('./util/env')
const utils = require('./util/utilities')

const command = async function () {
  const envSlug = await env.parseOrPromptEnv()
  if (envSlug === false) {
    console.error('Error: Unable to determine which environment to open a shell for. Please run this command from within your environment.')
    process.exit(1)
  }

  const envPath = await utils.envPath(envSlug)
  const container = commandUtils.subcommand() || 'phpfpm'

  // Check if the container is running, otherwise, start up the stacks
  try {
    const output = execSync(`docker-compose ps`, { cwd: envPath }).toString()
    if (output.indexOf(container) === -1) {
      await gateway.startGlobal()
      await environment.start(envSlug)
    }
  } catch (ex) {}

  try {
    execSync(`docker-compose exec ${container} bash`, { stdio: 'inherit', cwd: envPath })
  } catch (ex) {}

  process.exit()
}

module.exports = { command }
