const chalk = require('chalk')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const helpers = require('./util/helpers')
const utils = require('./util/utilities')
const pkg = require('../package.json')

const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const log = console.log

// Tracks current config
let config = null

async function command () {
  const answers = await prompt()
  await configure(answers)
}

async function configure (configuration) {
  const sitesPath = await path.resolve(configuration.sitesPath)
  const snapshotsPath = await path.resolve(configuration.snapshotsPath)

  // Attempt to create the sites directory
  try {
    await fs.ensureDir(sitesPath)
  } catch (err) {
    logger.log('error', err)
    log(error('Could not create sites directory'))
    process.exit(1)
  }

  // Make sure we can write to the sites directory
  try {
    const testfile = path.join(sitesPath, 'testfile')
    await fs.ensureFile(testfile)
    await fs.remove(testfile)
  } catch (err) {
    logger.log('error', err)
    log(error('The environment directory is not writable'))
    process.exit(1)
  }

  // Make sure we can write to the snapshots
  try {
    const testfile = path.join(snapshotsPath, 'testfile')
    await fs.ensureFile(testfile)
    await fs.remove(testfile)
  } catch (err) {
    logger.log('error', err)
    log(error('The snapshots directory is not writable'))
    process.exit(1)
  }

  await set('sitesPath', sitesPath)
  await set('snapshotsPath', snapshotsPath)
  await set('manageHosts', configuration.manageHosts)
  await set('shareErrors', configuration.shareErrors)
  await set('version', pkg.version)

  log(success('Successfully Configured'))
  log('   Sites Path: ' + info(sitesPath))
  log('   Snapshots Path: ' + info(snapshotsPath))
  log('   Manage Hosts: ' + info(configuration.manageHosts))
  log('   Share Errors: ' + info(configuration.shareErrors))
  log('   Version: ' + info(pkg.version))
}

async function getDefaults () {
  const sitesDir = await path.join(os.homedir(), 'air-local-docker-sites')
  const ssDir = await path.join(os.homedir(), '.airsnapshots')

  const defaults = {
    sitesPath: sitesDir,
    snapshotsPath: ssDir,
    manageHosts: true,
    shareErrors: true,
    version: pkg.version
  }

  return defaults
}

function getConfigDirectory () {
  return path.join(os.homedir(), '.airlocal')
}

function getConfigFilePath () {
  return path.join(getConfigDirectory(), 'config.json')
}

async function checkIfConfigured () {
  const configPath = await fs.exists(getConfigFilePath())
  return configPath
}

function resolveHome (input) {
  return input.replace('~', os.homedir())
}

async function write () {
  // Make sure we have our config directory present
  await fs.ensureDir(getConfigDirectory())
  await fs.writeJson(getConfigFilePath(), config)
}

async function read () {
  let readConfig = {}

  if (await fs.exists(getConfigFilePath())) {
    readConfig = await fs.readJson(getConfigFilePath())
  }

  config = Object.assign({}, readConfig)
}

async function get (key) {
  const defaults = await getDefaults()

  if (config === null) {
    await read()
  }

  return typeof config[key] === 'undefined' ? defaults[key] : config[key]
}

async function set (key, value) {
  if (config === null) {
    await read()
  }

  config[key] = value

  await write()
}

async function prompt () {
  const defaults = await getDefaults()

  const currentDir = await get('sitesPath')
  const currentHosts = await get('manageHosts')
  const currentSnapshots = await get('snapshotsPath')
  const currentErrors = await get('shareErrors')
  const existingVer = await get('version')

  if (!existingVer) {
    log(
      warning(
        'You are updating from a pre 1.x.x version of AirLocal, we need to run some update tasks on your environment...'
      )
    )
    await set('version', pkg.version)
    await utils.runUpdateTasks(existingVer, pkg.version)
  }

  const questions = [
    {
      name: 'sitesPath',
      type: 'input',
      message:
        'What directory would you like AIRLocal to create environments/sites within?',
      default: currentDir || defaults.sitesPath,
      validate: helpers.validateNotEmpty,
      filter: resolveHome,
      transformer: resolveHome
    },
    {
      name: 'snapshotsPath',
      type: 'input',
      message:
        'What directory would you like to store AIRSnapshots data within?',
      default: currentSnapshots || defaults.snapshotsPath,
      validate: helpers.validateNotEmpty,
      filter: resolveHome,
      transformer: resolveHome
    },
    {
      name: 'manageHosts',
      type: 'confirm',
      message: 'Would you like AIRLocal to manage your hosts file?',
      default: currentHosts !== undefined ? currentHosts : defaults.manageHosts
    },
    {
      name: 'shareErrors',
      type: 'confirm',
      message:
        'Would you like to anonymously help us improve by sharing any errors with us automatically? (no identifiable information is collected)',
      default:
        currentErrors !== undefined ? currentErrors : defaults.shareErrors
    }
  ]

  const answers = await inquirer.prompt(questions)
  return answers
}

async function promptUnconfigured () {
  const questions = [
    {
      name: 'useDefaults',
      type: 'confirm',
      message:
        'AIRLocal is not configured. Would you like to configure using default settings?',
      default: '',
      validate: helpers.validateNotEmpty
    }
  ]

  const answers = await inquirer.prompt(questions)

  if (answers.useDefaults === true) {
    await configureDefaults()
  } else {
    await command()
  }
}

async function configureDefaults () {
  const defaults = await getDefaults()
  await configure(defaults)
}

module.exports = {
  command,
  promptUnconfigured,
  configureDefaults,
  checkIfConfigured,
  get,
  set,
  getConfigDirectory,
  getDefaults
}
