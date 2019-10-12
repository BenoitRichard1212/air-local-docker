const chalk = require('chalk')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const has = require('lodash.has')
const helpers = require('./util/helpers')
const axios = require('axios')
const logger = require('./util/logger')
const log = console.log
const info = chalk.keyword('cyan')

// Tracks current auth config
let authConfig = null

function help () {
  log(chalk.white('Usage: airlocal auth [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(chalk.white('  configure          ') + info('Setup AIR authentication'))
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
    token: ''
  }
}

const prompt = async function () {
  const questions = [
    {
      name: 'customer',
      type: 'confirm',
      message: 'Are you a 45AIR Cloud customer?'
    },
    {
      name: 'token',
      type: 'password',
      message: 'Enter your devops.45air.co PAT (Personal Access Token):',
      default: '',
      validate: helpers.validateNotEmpty,
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

  if (answers.customer === true) {
    let response
    const options = {
      headers: { 'Private-Token': answers.token }
    }

    try {
      response = await axios.get('https://devops.45air.co/api/v4/user', options)
    } catch (err) {
      console.log()
      if (err.response) {
        // Server responded with a non 2xx response
        console.log(chalk.red('Error: ') + chalk.yellow(err.response.data.message))
        console.log(chalk.yellow('Try another PAT with the proper scope!'))
      } else if (err.request) {
        // No response received from server
        logger.log(err.request)
        console.log(chalk.red('Error: No response from the server. Logging the error request and exiting.'))
      } else {
        // Something happened in setting up the request
        logger.log(err)
        console.log(chalk.red('Error: ') + err.message)
      }
      console.log()
      process.exit()
    }

    if (has(response, 'data.username')) {
      await set('user', response.data.username)
      await set('token', answers.token)

      console.log()
      console.log(chalk.green('Authenticated as username ') + response.data.username)
      console.log(chalk.green('AIRCloud Auth Configured'))
      console.log()
    }

    process.exit()
  }

  console.log()
  console.log(chalk.green('Sign up for 45AIR Cloud if you want to get the benefits customers have with AIRLocal'))
  console.log()
}

module.exports = {
  help,
  configure,
  checkIfAuthConfigured,
  get,
  set,
  getAuthConfigDirectory
}
