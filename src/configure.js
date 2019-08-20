const chalk = require('chalk')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const helpers = require('./util/helpers')
const log = console.log
const error = chalk.bold.red

// Tracks current config
let config = null

async function command () {
  const answers = await prompt()
  await configure(answers)
}

async function configure (configuration) {
  const sitesPath = path.resolve(configuration.sitesPath)
  const snapshotsPath = path.resolve(configuration.snapshotsPath)

  // Attempt to create the sites directory
  try {
    await fs.ensureDir(sitesPath)
  } catch (ex) {
    error('Error: Could not create directory for environments!')
    process.exit(1)
  }

  // Make sure we can write to the sites directory
  try {
    const testfile = path.join(sitesPath, 'testfile')
    await fs.ensureFile(testfile)
    await fs.remove(testfile)
  } catch (ex) {
    error('Error: The environment directory is not writable')
    process.exit(1)
  }

  // Make sure we can write to the snapshots
  try {
    const testfile = path.join(snapshotsPath, 'testfile')
    await fs.ensureFile(testfile)
    await fs.remove(testfile)
  } catch (ex) {
    error('Error: The snapshots directory is not writable')
    process.exit(1)
  }

  await set('sitesPath', sitesPath)
  await set('snapshotsPath', snapshotsPath)
  await set('manageHosts', configuration.manageHosts)
  await set('shareErrors', configuration.shareErrors)

  log(chalk.green('Successfully Configured AIRLocal'))
  log()
}

function getDefaults () {
  return {
    sitesPath: path.join(os.homedir(), 'air-local-docker-sites'),
    snapshotsPath: path.join(os.homedir(), '.airsnapshots'),
    manageHosts: true,
    shareErrors: true
  }
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
  const defaults = getDefaults()

  if (config === null) {
    await read()
  }

  return (typeof config[key] === 'undefined') ? defaults[key] : config[key]
}

async function set (key, value) {
  if (config === null) {
    await read()
  }

  config[key] = value

  await write()
}

async function prompt () {
  const defaults = getDefaults()

  const currentDir = await get('sitesPath')
  const currentHosts = await get('manageHosts')
  const currentSnapshots = await get('snapshotsPath')
  const currentErrors = await get('shareErrors')

  const questions = [
    {
      name: 'sitesPath',
      type: 'input',
      message: 'What directory would you like AIRLocal to create environments/sites within?',
      default: currentDir || defaults.sitesPath,
      validate: helpers.validateNotEmpty,
      filter: resolveHome,
      transformer: resolveHome
    },
    {
      name: 'snapshotsPath',
      type: 'input',
      message: 'What directory would you like to store AIRSnapshots data within?',
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
      message: 'Would you like to anonymously help us improve by sharing any errors with us automatically? (no identifiable information is collected)',
      default: currentErrors !== undefined ? currentErrors : defaults.shareErrors
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
      message: 'AIRLocal is not configured. Would you like to configure using default settings?',
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
  const defaults = getDefaults()
  await configure(defaults)
}

/**
 * Create the NGINX directive to set a media URL proxy
 *
 * @param {string} proxy The URL to set the proxy to
 * @param {string} curConfig Complete content of the existing config file
 * @return {string} New content for the config file
 */
const createProxyConfig = (proxy, curConfig) => {
  const proxyMarkup = 'location @production {' + '\r\n' +
    '        resolver 8.8.8.8;' + '\r\n' +
    '        proxy_pass ' + proxy + '/$uri;' + '\r\n' +
    '    }'

  const proxyMapObj = {
    '#{TRY_PROXY}': 'try_files $uri @production;',
    '#{PROXY_URL}': proxyMarkup
  }

  const re = new RegExp(Object.keys(proxyMapObj).join('|'), 'gi')

  const newConfig = curConfig.replace(re, function (matched) {
    return proxyMapObj[matched]
  })

  return curConfig.replace(curConfig, newConfig)
}

module.exports = { command, promptUnconfigured, configureDefaults, checkIfConfigured, get, set, getConfigDirectory, createProxyConfig, getDefaults }
