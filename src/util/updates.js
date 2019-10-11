const chalk = require('chalk')
const checkForUpdate = require('update-check')
const pjson = require('../../package.json')
const log = console.log
const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')

async function checkForUpdates () {
  let update = null

  try {
    // Cache result for 24 hours
    update = await checkForUpdate(pjson, {
      interval: 3600000
    })
  } catch (err) {
    log(error('Warning: Failed to automatically check for updates. Please ensure AIRLocal is up to date manually'))
  }

  if (update) {
    log(warning('AIRLocal version ') + update.latest + warning('is now available. Please run ') + info('npm update -g air-local-docker') + warning(' to update'))
  }
}

function updatesCheck () {
  return checkForUpdates()
}

module.exports = { checkForUpdates, updatesCheck }
