#!/usr/bin/env node

// Setup error logging early
const logProcessErrors = require('log-process-errors')
logProcessErrors()

const path = require('path')
const chalk = require('chalk')
const commander = require('commander')
const inquirer = require('inquirer')
const sudo = require('sudo-prompt')
const compareVersions = require('compare-versions')
const updateNotifier = require('update-notifier')
const configure = require('./src/configure')
const create = require('./src/create')
const auth = require('./src/auth')
const cache = require('./src/cache')
const snapshots = require('./src/snapshots')
const shell = require('./src/shell')
const image = require('./src/image')
const hosts = require('./hosts')
const environment = require('./src/environment')
const logs = require('./src/logs')
const wp = require('./src/wp')
const pkg = require('./package.json')
const utils = require('./src/util/utilities')
const { rootPath } = require('./src/util/variables')

const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./src/util/logger')
const log = console.log

const notifier = updateNotifier({ pkg })
notifier.notify()

// Init the CLI
const program = new commander.Command()

/**
 * AIRLOCAL AUTH <CMD>
 *
 * Subcommands:
 *   - config
 *   - status
 */
program
  .command('auth [cmd]')
  .description(info('Set up authentication for AIR customers'))
  .action(async cmd => {
    // Valid subcommands
    const valid = ['configure', 'config', 'status']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      auth.help()
      process.exit(1)
    }

    // Configure subcommand
    if (cmd === 'configure' || cmd === 'config') {
      await auth.configure()
      process.exit(0)
    }

    // Status subcommand
    if (cmd === 'status') {
      await auth.status()
      process.exit(0)
    }

    const authConfigured = await auth.checkIfAuthConfigured()

    if (authConfigured) {
      log(success('Authentication already configured'))
      process.exit(0)
    }

    // If auth not configured lets try and get that done now by prompting the user
    const questions = [
      {
        name: 'configNow',
        type: 'confirm',
        message: 'Do you want to setup authentication now?',
        default: true
      }
    ]
    const answers = await inquirer.prompt(questions)

    if (!answers.configNow) {
      // User doesn't want to configure now, exit
      log(warning('Not configuring authentication'))
      process.exit(0)
    }

    // Start the auth configuration flow
    auth.configure()
  })
  .on('--help', () => {
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
  .action(async cmd => {
    // Valid subcommands
    const valid = ['clear', 'info']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      await cache.help()
    }

    if (cmd === 'info') {
      // Show cache volume information
      await cache.printInfo()
    }

    if (cmd === 'clear') {
      // Clear the build cache volume
      await cache.clear()
    }
  })
  .on('--help', async () => {
    // When help flag is called for auth command
    await cache.help()
  })

/**
 * AIRLOCAL CONFIGURE
 * Alias: config
 */
program
  .command('configure')
  .alias('config')
  .description(info('Set up your AIRLocal environment'))
  .action(async () => {
    await configure.command()
  })

/**
 * AIRLOCAL CREATE
 * Alias: new
 */
program
  .command('create')
  .alias('new')
  .description(info('Create a new web local environment'))
  .action(() => {
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
  .action(async env => {
    await environment.deleteEnv(env)
  })
  .on('--help', async () => {
    await environment.deleteHelp()
  })

program
  .command('hosts [cmd] [host]')
  .description(info('Manage the hosts file'))
  .action(async (cmd, host) => {
    // Valid subcommands
    const valid = ['add', 'remove', 'list']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      await hosts.help()
      process.exit(1)
    }

    const hostsCmd = path.join(rootPath, 'hosts.js')

    const options = {
      name: 'AIRLOCAL'
    }

    if (cmd === 'add') {
      if (host === undefined) {
        log(error('You need to pass a host url to add'))
        process.exit(1)
      }

      sudo.exec(hostsCmd + ` add ${host}`, options, function (err, stdout, stderr) {
        if (err) {
          logger.log('error', err)
          log(error(stderr))
          process.exit(1)
        }

        log(success(stdout))
        process.exit(0)
      })
    }

    if (cmd === 'remove') {
      if (host === undefined) {
        log(error('You need to pass a host url to remove'))
        process.exit(1)
      }

      sudo.exec(hostsCmd + ` remove ${host}`, options, function (err, stdout, stderr) {
        if (err) {
          logger.log('error', err)
          log(error(stderr))
          process.exit(1)
        }

        log(success(stdout))
        process.exit(0)
      })
    }

    if (cmd === 'list') {
      sudo.exec(hostsCmd + ' list', options, function (err, stdout, stderr) {
        if (err) {
          logger.log('error', err)
          log(error(stderr))
          process.exit(1)
        }

        log(info(stdout))
        process.exit(0)
      })
    }
  })
  .on('--help', async () => {
    await hosts.help()
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
  .action(async (cmd, img) => {
    // Valid subcommands
    const valid = ['update']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      await image.help()
      process.exit(1)
    } else if (!img) {
      log(error('You must pass the name of the image to update or "all"'))
      process.exit(1)
    }

    if (img === 'all') {
      await image.updateAll()
      process.exit(0)
    }

    await image.update(img)
  })
  .on('--help', async () => {
    await image.help()
  })

/**
 * AIRLOCAL LOGS [container]
 */
program
  .command('logs [container]')
  .description(
    info('Streams docker logs') + chalk.gray(' (default: all containers)')
  )
  .action(async container => {
    if (!container) {
      await logs.command('')
      process.exit(0)
    }

    await logs.command(container)
  })
  .on('--help', async () => {
    await logs.help()
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
  .action(async (env) => {
    await environment.restart(env)
  })
  .on('--help', async () => {
    await environment.restartHelp()
  })

program
  .command('shell [container]')
  .description(
    info('Opens a shell in a container') + chalk.gray(' (default: phpfpm)')
  )
  .action(async container => {
    await shell.command(container)
  })
  .on('--help', async () => {
    await shell.help()
  })

/**
 * AIRLOCAL SNAPSHOTS [CMD] [env] [file]
 *
 * Subcommands:
 *   - pull
 *   - list
 *   - load
 */
program
  .command('snapshots [cmd] [file]')
  .alias('ss')
  .description(info('Runs db snapshots commands'))
  .action(async (cmd, file) => {
    // Valid subcommands
    const valid = ['pull', 'list', 'load']
    if (valid.indexOf(cmd) === -1) {
      // Show the help menu as fallback if valid subcommand not used
      await snapshots.help()
    }

    if (cmd === 'list') {
      await snapshots.list()
    }

    if (cmd === 'pull') {
      const authConfigured = await auth.checkIfAuthConfigured()

      // If auth not configured lets try and get that done now by prompting the user
      if (!authConfigured) {
        const questions = [
          {
            name: 'configNow',
            type: 'confirm',
            message: 'Do you want to setup the AIR auth config now?',
            default: false
          }
        ]
        const answers = await inquirer.prompt(questions)

        if (answers.configNow) {
          // Start the auth configuration flow
          await auth.configure()
          process.exit(0)
        }

        log(error('You need to configure authentication to pull snapshots from AirCloud environments'))
        process.exit(1)
      }

      await snapshots.pull()
    }

    if (cmd === 'load') {
      if (!file) {
        log(error('You need to specify an import file!'))
        process.exit(1)
      }

      await snapshots.load(file)
    }
  })
  .on('--help', async () => {
    await snapshots.help()
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
  .action(async env => {
    await environment.start(env)
  })
  .on('--help', async () => {
    await environment.startHelp()
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
  .action(async env => {
    await environment.stop(env)
    process.exit(0)
  })
  .on('--help', async () => {
    await environment.stopHelp()
  })

/**
 * AIRLOCAL VERSION
 */
program
  .command('version')
  .description(info('Show AIRLocal CLI version'))
  .action(() => {
    log(info('AirLocal CLI v' + info(pkg.version)))
  })

program
  .command('wp [command...]')
  .description(info('Runs a wp-cli command in your current environment'))
  .action(async command => {
    await wp.command(command)
  })
  .on('--help', async () => {
    await wp.help()
  })

configure.checkIfConfigured().then(async resp => {
  if (resp) {
    let configVer
    try {
      configVer = await configure.get('version')
    } catch (err) {
      logger.log('error', err)
      log(error('Could not get last configured version, run ') + info('"airlocal config"') + error(' before continuing'))
      process.exit(1)
    }

    let versionsEqual = false

    if (!configVer) {
      const commandInQueue = process.argv[2]
      if (commandInQueue !== 'config' && commandInQueue !== 'configure') {
        log(error('Could not get last configured version, run ') + info('airlocal config') + error(' before continuing'))
        process.exit(1)
      }
    } else {
      versionsEqual = compareVersions.compare(configVer, pkg.version, '=')
    }

    if (!versionsEqual && configVer) {
      log(info('You have just updated AirLocal... Running upgrade tasks...'))
      await configure.set('version', pkg.version)
      await utils.runUpdateTasks(configVer, pkg.version)
      log(success('Upgrade tasks complete'))
    }

    program.parse(process.argv)

    if (!process.argv.slice(2).length) {
      log(warning('You need to enter a command'))

      program.outputHelp(txt => {
        return chalk.white(txt)
      })
    }
  } else {
    configure.promptUnconfigured()
  }
})
