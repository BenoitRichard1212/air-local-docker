#!/usr/bin/env node

const chalk = require('chalk')
const commander = require('commander')
const inquirer = require('inquirer')
const sudo = require('sudo-prompt')
const { promisify } = require('util')

const configure = require('./src/configure')
const create = require('./src/create')
const auth = require('./src/auth')
const cache = require('./src/cache')
const snapshots = require('./src/snapshots')
const image = require('./src/image')
const hosts = require('./src/hosts')
const environment = require('./src/environment')
const logs = require('./src/logs')

const { handleErrors } = require('./src/util/errors')
const updates = require('./src/util/updates')
const log = console.log

const pjson = require('./package.json')
const { version } = pjson

const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')

// Setup our error handler
handleErrors()

// Init the CLI
const program = new commander.Command()

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
    const valid = ['configure', 'status', 'run']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      auth.help()
    }

    // Configure subcommand
    if (cmd === 'configure') {
      auth.configure()
    } else {
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
        const answers = await inquirer.prompt(questions)

        log(answers.configNow)

        if (!answers.configNow) {
        // User doesn't want to configure now, exit
          log(error('Not configuring authentication!'))
        } else {
          // Start the auth configuration flow
          auth.configure()
        }
      } else if (cmd === 'status') {
        auth.checkAuth()
      } else if (cmd === 'run') {
        // Run subcommand
        auth.runAuth()
      }
    }
  }).on('--help', function () {
    // When help flag is called for auth command
    auth.help()
  })

/**
 * AIRLOCAL CACHE <CMD>
 *
 * Subcommands:
 *   - clear
 *   - info
 */
program
  .command('cache [cmd]')
  .description(info('Manage the build cache volume'))
  .action(function (cmd) {
    // Valid subcommands
    const valid = ['clear', 'info']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      cache.help()
    }

    if (cmd === 'info') {
      // Show cache volume information
      cache.printInfo()
    }

    if (cmd === 'clear') {
      // Clear the build cache volume
      cache.clear()
    }
  }).on('--help', function () {
    // When help flag is called for auth command
    cache.help()
  })

/**
 * AIRLOCAL CONFIGURE
 * Alias: config
*/
program
  .command('configure')
  .alias('config')
  .description(info('Set up your AIRLocal environment'))
  .action(function () {
    configure.command()
  })

/**
 * AIRLOCAL CREATE
 * Alias: new
*/
program
  .command('create')
  .alias('new')
  .description(info('Create a new web local environment'))
  .action(function () {
    create.command()
  })

/**
 * AIRLOCAL DELETE [env]
 *
 * Subcommands:
 *   - all
 */
program
  .command('delete [env]')
  .description(info('Deletes a specific docker environment'))
  .action(function (env) {
    environment.deleteEnv(env)
  }).on('--help', function () {
    environment.deleteHelp()
  })

program
  .command('hosts [cmd] [host]')
  .description(info('Manage the hosts file'))
  .action(function (cmd, host) {
    // Valid subcommands
    const valid = ['add', 'remove', 'list']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      hosts.help()
    }

    if (cmd === 'add') {
      if (host === undefined) {
        log(error('ERROR: You need to pass a host url to add!'))
      } else {
        const addHost = promisify(sudo.exec)
        addHost(`airlocal-hosts add ${host}`).then(resp => {
          log(resp)
          hosts.list()
        })
      }
    }

    if (cmd === 'remove') {
      if (host === undefined) {
        log(error('ERROR: You need to pass a host url to remove!'))
      } else {
        const addHost = promisify(sudo.exec)
        addHost(`airlocal-hosts remove ${host}`).then(resp => {
          log(resp)
          hosts.list()
        })
      }
    }

    if (cmd === 'list') {
      hosts.list()
    }
  }).on('--help', function () {
    hosts.help()
  })

/**
 * AIRLOCAL IMAGE <CMD>
 *
 * Subcommands:
 *   - update
 */
program
  .command('image [cmd] [img]')
  .description(info('Manages docker images used by this environment'))
  .action(function (cmd, img) {
    // Valid subcommands
    const valid = ['update']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      image.help()
    }

    if (cmd === 'update') {
      if (!img) {
        log(error('ERROR: You must pass an image name or all!'))
      } else if (img === 'all') {
        image.updateAll()
      } else {
        image.update(img)
      }
    }
  }).on('--help', function () {
    image.help()
  })

/**
 * AIRLOCAL LOGS [container]
 */
program
  .command('logs [container]')
  .description(info('Streams docker logs') + chalk.gray(' (default: all containers)'))
  .action(function (container) {
    if (!container) {
      logs.command('')
    } else {
      logs.command(container)
    }
  }).on('--help', function () {
    logs.help()
  })

/**
 * AIRLOCAL RESTART [env]
 *
 * Subcommands:
 *   - all
 */
program
  .command('restart [env]')
  .description(info('Restarts a specific docker environment'))
  .action(function (env, cmd) {
    environment.restart(env)
  }).on('--help', function () {
    environment.restartHelp()
  })

program
  .command('shell')
  .description(info('Opens a shell in a container') + chalk.gray(' (default: phpfpm)'))
  .action(function (env, cmd) {
    log('shell', env, cmd)
  })

/**
 * AIRLOCAL SNAPSHOTS <CMD>
 *
 * WIP
 */
program
  .command('snapshots')
  .alias('ss')
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
      const answers = await inquirer.prompt(questions)

      if (!answers.configNow) {
        // User doesn't want to configure now, exit
        process.exit(1)
      }

      // Start the auth configuration flow
      auth.configure()
      process.exit(1)
    }

    log('WIP')
  }).on('--help', function () {
    snapshots.help()
  })

/**
 * AIRLOCAL START [env]
 *
 * Subcommands:
 *   - all
 */
program
  .command('start [env]')
  .description(info('Starts a specific web local environment'))
  .action(function (env) {
    environment.start(env)
  }).on('--help', function () {
    environment.startHelp()
  })

/**
 * AIRLOCAL STOP [env]
 *
 * Subcommands:
 *   - all
 */
program
  .command('stop [env]')
  .description(info('Stops a specific docker environment'))
  .action(function (env) {
    environment.stop(env)
  }).on('--help', function () {
    environment.stopHelp()
  })

/**
 * AIRLOCAL VERSION
 */
program
  .command('version')
  .description(info('Show AIRLocal CLI version'))
  .action(function () {
    log()
    log(info('AIRLocal v%s'), version)
    log()
  })

program
  .command('wp')
  .description(info('Runs a wp-cli command in your current environment'))
  .action(function (wpCmd) {
    log('wp', wpCmd)
  })

configure.checkIfConfigured().then(resp => {
  if (resp) {
    updates.updatesCheck().then(() => {
      program.parse(process.argv)

      if (!process.argv.slice(2).length) {
        log()
        log(warning('WARNING: You need to enter a command'))
        log()
        program.outputHelp(txt => {
          return chalk.white(txt)
        })
      }
    })
  } else {
    configure.promptUnconfigured()
  }
})
