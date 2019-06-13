#!/usr/bin/env node

const chalk = require('chalk')
const commander = require('commander')
const inquirer = require('inquirer')
const auth = require('./src/auth')
const cache = require('./src/cache')
const snapshots = require('./src/snapshots')
const logger = require('./src/util/logger').logger
const log = console.log

const pjson = require('./package.json')
const { version } = pjson

const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')

process.on('unhandledRejection', (reason, p) => {
  // Unhandled promise rejection, lets handle this on our fallback handler
  throw reason
})

process.on('uncaughtException', (err) => {
  // Final stop for all unhandled errors
  logger.error((new Date()).toUTCString() + ' uncaughtException:', err)
  process.exit(1)
})

const program = new commander.Command()

/**
 * AIRLOCAL CONFIGURE
 * Alias: config
*/
program
  .command('configure')
  .alias('config')
  .description(info('Set up your AIRLocal environment'))
  .action(function () {
    process.exit(1)
  })

/**
 * AIRLOCAL CREATE
*/
program
  .command('create')
  .alias('new')
  .description(info('Create a new web local environment'))
  .action(function () {
    process.exit(1)
  })

/**
 * AIRLOCAL AUTH <CMD>
 *
 * Subcommands:
 *   - config
 *   - status
 *   - run
 */
program
  .command('auth [cmd]')
  .description(info('Set up authentication for AIR customers') + chalk.gray(' (optional)'))
  .action(async function (cmd) {
    // Valid subcommands
    const valid = ['config', 'status', 'run']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      auth.help()
      process.exit(1)
    }

    // Configure subcommand
    if (cmd === 'config') {
      auth.configure()
      process.exit(1)
    }

    const authConfigured = await auth.checkIfAuthConfigured()
    // If auth not configured lets try and get that done now by prompting the user
    if (!authConfigured) {
      log(error('Error: ') + warning('You need to configure AIR authentication first'))

      const questions = [
        {
          name: 'configNow',
          type: 'confirm',
          message: 'Do you want to setup the AIR auth config now?',
          default: false
        }
      ]
      let answers = await inquirer.prompt(questions)

      if (!answers.configNow) {
        // User doesn't want to configure now, exit
        process.exit(1)
      }

      // Start the auth configuration flow
      auth.configure()
      process.exit(1)
    }

    // Check subcommand
    if (cmd === 'check') {
      auth.checkAuth()
      process.exit(1)
    }

    // Run subcommand
    auth.runAuth()
    process.exit(1)
  }).on('--help', function () {
    // When help flag is called for auth command
    auth.help()
    process.exit(1)
  })

/**
 * AIRLOCAL CACHE <CMD>
 *
 * Subcommands:
 *   - clear
 *   - info
 */
program
  .command('cache <cmd>')
  .description(info('Manage the build cache volume'))
  .action(function (cmd) {
    // Valid subcommands
    const valid = ['clear', 'info']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      cache.help()
      process.exit(1)
    }

    if (cmd === 'info') {
      // Show cache volume information
      cache.printInfo()
      process.exit(1)
    }

    // Clear the build cache volume
    cache.clear()
    process.exit(1)
  }).on('--help', function () {
    // When help flag is called for auth command
    cache.help()
    process.exit(1)
  })

/**
 * AIRLOCAL SNAPSHOTS <CMD>
 *
 * WIP
 */
program
  .command('snapshots <cmd>')
  .description(info('Runs db snapshots commands'))
  .action(async function (cmd) {
    const authConfigured = await auth.checkIfAuthConfigured()

    // If auth not configured lets try and get that done now by prompting the user
    if (!authConfigured) {
      log(error('Error: ') + warning('You need to configure AIR authentication first'))

      const questions = [
        {
          name: 'configNow',
          type: 'confirm',
          message: 'Do you want to setup the AIR auth config now?',
          default: false
        }
      ]
      let answers = await inquirer.prompt(questions)

      if (!answers.configNow) {
        // User doesn't want to configure now, exit
        process.exit(1)
      }

      // Start the auth configuration flow
      auth.configure()
      process.exit(1)
    }

    log('WIP')
    process.exit(1)
  }).on('--help', function () {
    snapshots.help()
    process.exit(1)
  })

program
  .command('images <cmd>')
  .description(info('Manages docker images used by this environment'))
  .action(function (cmd) {
    log('images', cmd)
  })

program
  .command('wp <wpCmd...>')
  .description(info('Runs a wp-cli command in your current environment'))
  .action(function (wpCmd) {
    log('wp', wpCmd)
  })

program
  .command('start [env]')
  .description(info('Starts a specific web local environment'))
  .action(function (env, cmd) {
    log('start', env, cmd)
  })

program
  .command('stop [env]')
  .description(info('Stops a specific docker environment'))
  .action(function (env, cmd) {
    log('stop', env, cmd)
  })

program
  .command('restart [env]')
  .description(info('Restarts a specific docker environment'))
  .action(function (env, cmd) {
    log('restart', env, cmd)
  })

program
  .command('delete [env]')
  .description(info('Deletes a specific docker environment'))
  .action(function (env, cmd) {
    log('delete', env, cmd)
  })

program
  .command('shell [env]')
  .description(info('Opens a shell in a container') + chalk.gray(' (default: phpfpm)'))
  .action(function (env, cmd) {
    log('shell', env, cmd)
  })

program
  .command('logs [env]')
  .description(info('Streams docker logs') + chalk.gray(' (default: all containers)'))
  .action(function (env, cmd) {
    log('logs', env, cmd)
  })

program
  .command('version')
  .description(info('Show the CLI version'))
  .action(function () {
    log()
    log(info('AIRLocal v%s'), version)
    log()
  })

program.parse(process.argv)

function makeWhite (txt) {
  return chalk.white(txt)
}

if (!process.argv.slice(2).length) {
  program.outputHelp(makeWhite)
  process.exit(1)
}
