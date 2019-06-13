const path = require('path')
const chalk = require('chalk')
const checkForUpdate = require('update-check')
const { rootPath } = require('./variables')

async function checkForUpdates () {
  let pkg = require(path.join(rootPath, 'package'))
  let update = null

  try {
    update = await checkForUpdate(pkg)
  } catch (err) {
    console.error(chalk.yellow(`Failed to automatically check for updates. Please ensure Air Local Docker is up to date.`))
  }

  if (update) {
    console.warn(chalk.yellow(`Air Local Docker version ${update.latest} is now available. Please run \`npm update -g air-local-docker\` to update!`))
  }
}

module.exports = { checkForUpdates }
