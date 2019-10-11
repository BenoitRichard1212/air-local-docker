const chalk = require('chalk')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const helpers = require('./util/helpers')
const axios = require('axios')
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
  log(chalk.white('  status             ') + info('Show AIR authentication status'))
  log(chalk.white('  run                ') + info('Run the AIR authentication flow'))
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

const checkIfConfigured = async function () {
  const authConfigured = await checkIfAuthConfigured()

  if (authConfigured === false) {
    return false
  }

  return true
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

  return (typeof authConfig[key] === 'undefined') ? defaults[key] : authConfig[key]
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

const checkAuth = async function () {
  if (await checkIfConfigured() === false) {
    console.error(chalk.red('Error: ') + "Auth not configured. Please run 'airlocal auth config' before continuing.")
    console.log()
    process.exit()
  }

  const token = await get('token')

  const options = {
    headers: { 'Private-Token': token }
  }

  axios.get('https://devops.45air.co/api/v4/groups?min_access_level=30', options)
    .then(function (response) {
      console.log(response.data)
    })
    .catch(function (error) {
      if (error.response) {
        const errData = error.response.data
        console.error(chalk.red('Error: ') + chalk.yellow(errData.error_description))
      } else {
        console.error(chalk.red('Error: ') + chalk.yellow(error.message))
      }
    })
  console.log()
}

const runAuth = async function () {
  if (await checkIfConfigured() === false) {
    console.error(chalk.red('Error: ') + "Auth not configured. Please run 'airlocal auth config' before continuing.")
    console.log()
    process.exit()
  }

  console.log(chalk.yellow('Run auth is WIP'))
  console.log()
}

const prompt = async function () {
  const currentUser = await get('user')

  const questions = [
    {
      name: 'customer',
      type: 'confirm',
      message: 'Are you a 45AIR Cloud customer?'
    },
    {
      name: 'user',
      type: 'input',
      message: 'Enter your devops.45air.co username:',
      default: currentUser || '',
      validate: helpers.validateNotEmpty,
      when: function (answers) {
        return answers.customer === true
      }
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
    await set('user', answers.user)
    await set('token', answers.token)
  }

  console.log(chalk.green('AIR Cloud Auth Configured!'))
  console.log()
}

module.exports = { help, configure, checkIfAuthConfigured, get, set, getAuthConfigDirectory, checkAuth, runAuth }
