const chalk = require('chalk')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const helpers = require('./util/helpers')
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
    airCustomer: true,
    authType: 'github',
    twoFactor: true,
    user: ''
  }
}

const checkAuth = async function () {
  if (await checkIfConfigured() === false) {
    console.error(chalk.red('Error: ') + "Auth not configured. Please run 'airlocal auth config' before continuing.")
    console.log()
    process.exit()
  }

  console.log(chalk.yellow('Check auth is WIP'))
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
      name: 'airCustomer',
      type: 'confirm',
      message: 'Are you a 45AIR cloud customer?'
    },
    {
      name: 'authType',
      type: 'list',
      message: 'Choose the auth type provisioned for your account:',
      choices: [
        { name: 'Github', value: 'github' }
      ],
      default: 'github',
      when: function (answers) {
        return answers.airCustomer === true
      }
    },
    {
      name: 'twoFactor',
      type: 'confirm',
      message: 'Does your account or org require two-factor auth?',
      when: function (answers) {
        return answers.airCustomer === true
      }
    },
    {
      name: 'user',
      type: 'input',
      message: 'Enter your auth provider login username or email:',
      default: currentUser || '',
      validate: helpers.validateNotEmpty,
      when: function (answers) {
        return answers.airCustomer === true
      }
    }
  ]

  const answers = await inquirer.prompt(questions)

  return answers
}

const configure = async function () {
  const answers = await prompt()

  await set('airCustomer', answers.airCustomer)
  if (answers.airCustomer === true) {
    await set('authType', answers.authType)
    await set('twoFactor', answers.twoFactor)
    await set('user', answers.user)
  }

  console.log(chalk.green('AIR Cloud Auth Configured!'))
  console.log()
}

module.exports = { help, configure, checkIfAuthConfigured, get, set, getAuthConfigDirectory, checkAuth, runAuth }
