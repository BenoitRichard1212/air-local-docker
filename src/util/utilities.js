const path = require('path')
const os = require('os')
const fs = require('fs-extra')
const execSync = require('child_process').execSync
const slugify = require('@sindresorhus/slugify')
const async = require('asyncro')

// Tracks current config
let config = null

function getDefaults () {
  return {
    sitesPath: path.join(os.homedir(), 'air-local-docker-sites'),
    snapshotsPath: path.join(os.homedir(), '.airsnapshots'),
    manageHosts: true
  }
}

/**
 * Resolve the path to users home directory
 *
 * @param {string} input
 * @returns {string}
 */
function resolveHome (input) {
  return input.replace('~', os.homedir())
}

/**
 * Path to the configuration directory
 *
 * @returns {string}
 */
function getConfigDirectory () {
  return path.join(os.homedir(), '.airlocal')
}

/**
 * Path to the main configuration file
 *
 * @returns {string}
 */
function getConfigFilePath () {
  return path.join(getConfigDirectory(), 'config.json')
}

/**
 * Check if the main configuration file exists
 *
 * @returns {string}
 */
function configFileExists () {
  return path.join(getConfigDirectory(), 'config.json')
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
  let defaults = getDefaults()

  if (config === null) {
    await read()
  }

  return (typeof config[ key ] === 'undefined') ? defaults[ key ] : config[ key ]
}

async function set (key, value) {
  if (config === null) {
    await read()
  }

  config[ key ] = value

  await write()
}

async function sitesPath () {
  const path = await get('sitesPath')
  return path
}

function envSlug (env) {
  return slugify(env)
}

async function envPath (env) {
  let envPath = path.join(await sitesPath(), envSlug(env))

  return envPath
}

function checkIfDockerRunning () {
  var output

  try {
    output = execSync('docker system info')
  } catch (er) {
    return false
  }

  if (output.toString().toLowerCase().indexOf('version') === -1) {
    return false
  }

  return true
}

module.exports = { getDefaults, checkIfDockerRunning, envPath, sitesPath, envSlug, get, set, read, write, configFileExists, getConfigFilePath, getConfigDirectory, resolveHome, async }
