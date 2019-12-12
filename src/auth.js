const chalk = require('chalk')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const has = require('lodash.has')
const helpers = require('./util/helpers')
const axios = require('axios')

const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const log = console.log

// Tracks current auth config
let authConfig = null

function help () {
  log(chalk.white('Usage: airlocal auth [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(chalk.white('  configure/config   ') + info('Setup authentication'))
  log(chalk.white('  status             ') + info('Check authentication status'))
}

const getAuthConfigDirectory = function () {
  return path.join(os.homedir(), '.airlocal')
}

const getAuthConfigFilePath = function () {
  return path.join(getAuthConfigDirectory(), 'auth.json')
}

const checkIfAuthConfigured = async function () {
  const authConfigured = await fs.exists(getAuthConfigFilePath())
  return authConfigured
}

const write = async function () {
  // Make sure we have our config directory present
  await fs.ensureDir(getAuthConfigDirectory())
  await fs.writeJson(getAuthConfigFilePath(), authConfig)
}

const read = async function () {
  let readConfig = {}

  if (await fs.exists(getAuthConfigFilePath())) {
    readConfig = await fs.readJson(getAuthConfigFilePath())
  }

  authConfig = Object.assign({}, readConfig)
}

const get = async function (key) {
  const defaults = getAuthDefaults()

  if (authConfig === null) {
    await read()
  }

  return typeof authConfig[key] === 'undefined'
    ? defaults[key]
    : authConfig[key]
}

const set = async function (key, value) {
  if (authConfig === null) {
    await read()
  }

  authConfig[key] = value

  await write()
}

const getAuthDefaults = function () {
  return {
    customer: false,
    user: '',
    token: '',
    group: ''
  }
}

const prompt = async function () {
  const questions = [
    {
      name: 'customer',
      type: 'confirm',
      message: 'Do you have an AirCloud devops.45air.co account?'
    },
    {
      name: 'token',
      type: 'input',
      message: 'Enter your devops.45air.co Gitlab PAT (Personal Access Token):',
      default: '',
      validate: helpers.validateNotEmpty,
      when: function (answers) {
        return answers.customer === true
      }
    },
    {
      name: 'group',
      type: 'number',
      message: 'Enter your devops.45air.co Gitlab group ID',
      default: '',
      validate: helpers.validateNumber,
      when: function (answers) {
        return answers.customer === true
      }
    }
  ]

  const answers = await inquirer.prompt(questions)
  return answers
}

const configure = async function () {
  const answers = await prompt()

  await set('customer', answers.customer)

  if (!answers.customer) {
    log(warning('Sign up for 45AIR Cloud if you want to get the benefits customers have with AIRLocal'))
    process.exit(0)
  }

  let response
  const options = {
    headers: { 'Private-Token': answers.token }
  }

  try {
    response = await axios.get('https://devops.45air.co/api/v4/user', options)
  } catch (err) {
    logger.log('error', err)

    if (err.response) {
      // Server responded with a non 2xx response
      log(error(err.response.data.message))
      log(error('Try another PAT with the proper scope'))
      process.exit(1)
    } else if (err.request) {
      // No response received from server
      log(error('No response from the server. Logging the error request and exiting'))
      process.exit(1)
    }

    // Something happened in setting up the request
    log(error(err.message))
    process.exit(1)
  }

  if (has(response, 'data.username')) {
    await set('user', response.data.username)
    await set('token', answers.token)
    await set('group', answers.group)

    log(success('Authenticated as username ') + response.data.username)
    log(success('AirCloud authentication configured'))
    process.exit(0)
  }
}

const status = async function () {
  const configured = await checkIfAuthConfigured()

  if (!configured) {
    log(error('Authentication not configured'))
    process.exit(0)
  }

  const user = await get('user')
  const group = await get('group')
  const token = await get('token')

  let response
  const options = {
    headers: { 'Private-Token': token }
  }

  try {
    response = await axios.get('https://devops.45air.co/api/v4/groups/' + group, options)
  } catch (err) {
    logger.log('error', err)

    if (err.response) {
      // Server responded with a non 2xx response
      log(error(err.response.data.message))
      process.exit(1)
    } else if (err.request) {
      // No response received from server
      log(error('No response from the server. Logging the error request and exiting'))
      process.exit(1)
    }

    // Something happened in setting up the request
    log(error(err.message))
    process.exit(1)
  }

  log(success('Authentication configured'))
  log('Username: ' + info(user))
  if (has(response, 'data.name')) {
    log('Group: ' + info(response.data.name))
  } else {
    log('Group: ' + error('Invalid group ID'))
  }
}

module.exports = {
  help,
  configure,
  status,
  checkIfAuthConfigured,
  get,
  set,
  getAuthConfigDirectory
}
