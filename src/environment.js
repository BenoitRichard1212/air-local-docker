const path = require('path')
const fs = require('fs-extra')
const execSync = require('child_process').execSync
const inquirer = require('inquirer')
const database = require('./database')
const gateway = require('./gateway')
const sudo = require('sudo-prompt')
const config = require('./configure')
const chalk = require('chalk')
const readYaml = require('read-yaml')
const writeYaml = require('write-yaml')
const envUtil = require('./util/env')
const utils = require('./util/utilities')
const helpers = require('./util/helpers')
const log = console.log
const info = chalk.keyword('cyan')

function startHelp () {
  log(chalk.white('Command: airlocal start'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(chalk.white('  start              ') + info('Use without params to automatically detect current environment'))
  log(chalk.white('  start [env]        ') + info('Use passing environment as param to start that environment'))
  log(chalk.white('  start all          ') + info('Use passing all to start all environments'))
}

function stopHelp () {
  log(chalk.white('Command: airlocal stop'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(chalk.white('  stop               ') + info('Use without params to automatically detect current environment'))
  log(chalk.white('  stop [env]         ') + info('Use passing environment as param to stop that environment'))
  log(chalk.white('  stop all           ') + info('Use passing all to stop all environments'))
}

function deleteHelp () {
  log(chalk.white('Command: airlocal delete'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(chalk.white('  delete             ') + info('Use without params to automatically detect current environment'))
  log(chalk.white('  delete [env]       ') + info('Use passing environment as param to delete that environment'))
  log(chalk.white('  delete all         ') + info('Use passing all to delete all environments'))
}

function restartHelp () {
  log(chalk.white('Command: airlocal restart'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(chalk.white('  restart            ') + info('Use without params to automatically detect current environment'))
  log(chalk.white('  restart [env]      ') + info('Use passing environment as param to restart that environment'))
  log(chalk.white('  restart all        ') + info('Use passing all to restart all environments'))
}

const start = async function (env) {
  if (env === 'all') {
    startAll()
  } else {
    if (undefined === env || env.trim().length === 0) {
      env = await envUtil.parseEnvFromCWD()
    }

    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if (env === false || undefined === env || env.trim().length === 0) {
      env = await envUtil.promptEnv()
    }

    let envPath = await envUtil.getPathOrError(env)

    // If we got the path from the cwd, we don't have a slug yet, so get it
    let envSlug = utils.envSlug(env)

    await gateway.startGlobal()

    console.log(`Starting docker containers for ${envSlug}`)
    try {
      execSync(`docker-compose up -d`, { stdio: 'inherit', cwd: envPath })
    } catch (ex) {}

    let envHosts = await envUtil.getEnvHosts(envPath)
    if (envHosts.length > 0) {
      console.log()
      console.log('Environment configured for the following domains:')
      for (let i = 0, len = envHosts.length; i < len; i++) {
        console.log(envHosts[ i ])
      }
    }

    console.log()
  }
}

const stop = async function (env) {
  if (env === 'all') {
    stopAll()
  } else {
    if (undefined === env || env.trim().length === 0) {
      env = await envUtil.parseEnvFromCWD()
    }

    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if (env === false || undefined === env || env.trim().length === 0) {
      env = await envUtil.promptEnv()
    }

    let envPath = await envUtil.getPathOrError(env)

    // If we got the path from the cwd, we don't have a slug yet, so get it
    let envSlug = utils.envSlug(env)

    console.log(`Stopping docker containers for ${envSlug}`)
    try {
      execSync(`docker-compose down`, { stdio: 'inherit', cwd: envPath })
    } catch (ex) {}
    console.log()
  }
}

const restart = async function (env) {
  if (env === 'all') {
    restartAll()
  } else {
    if (undefined === env || env.trim().length === 0) {
      env = await envUtil.parseEnvFromCWD()
    }

    // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if (env === false || undefined === env || env.trim().length === 0) {
      env = await envUtil.promptEnv()
    }

    let envPath = await envUtil.getPathOrError(env)

    // If we got the path from the cwd, we don't have a slug yet, so get it
    let envSlug = utils.envSlug(env)

    await gateway.startGlobal()

    console.log(`Restarting docker containers for ${envSlug}`)
    try {
      execSync(`docker-compose restart`, { stdio: 'inherit', cwd: envPath })
    } catch (ex) {
    // Usually because the environment isn't running
    }
    console.log()
  }
}

const deleteEnv = async function (env) {
  if (env === 'all') {
    deleteAll()
  } else {
  // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
    if (env === false || undefined === env || env.trim().length === 0) {
      env = await envUtil.promptEnv()
    }

    let envPath = await envUtil.getPathOrError(env)
    let envSlug = utils.envSlug(env)

    let answers = await inquirer.prompt({
      name: 'confirm',
      type: 'confirm',
      message: `Are you sure you want to delete the ${envSlug} environment`,
      validate: helpers.validateNotEmpty,
      default: false
    })

    if (answers.confirm === false) {
      return
    }

    await gateway.startGlobal()

    // Stop the environment, and ensure volumes are deleted with it
    console.log('Deleting containers')
    try {
      execSync(`docker-compose down -v`, { stdio: 'inherit', cwd: envPath })
    } catch (ex) {
    // If the docker-compose file is already gone, this happens
    }

    if (await config.get('manageHosts') === true) {
      try {
        console.log('Removing host file entries')

        let sudoOptions = {
          name: 'AIRLocal'
        }

        let envHosts = await envUtil.getEnvHosts(envPath)
        for (let i = 0, len = envHosts.length; i < len; i++) {
          await new Promise(resolve => {
            console.log(` - Removing ${envHosts}`)
            sudo.exec(`airlocal-hosts remove ${envHosts}`, sudoOptions, function (error, stdout, stderr) {
              if (error) {
                console.error(chalk.bold.yellow('Warning: ') + 'Something went wrong deleting host file entries. There may still be remnants in /etc/hosts')
                resolve()
                return
              }
              console.log(stdout)
              resolve()
            })
          })
        }
      } catch (err) {
      // Unfound config, etc
        console.error(chalk.bold.yellow('Warning: ') + 'Something went wrong deleting host file entries. There may still be remnants in /etc/hosts')
      }
    }

    console.log('Deleting Files')
    await fs.remove(envPath)

    console.log('Deleting Database')
    await database.deleteDatabase(envSlug)
  }
}

const upgradeEnv = async function (env) {
  if (undefined === env || env.trim().length === 0) {
    env = await envUtil.parseEnvFromCWD()
  }

  // Need to call this outside of envUtil.getPathOrError since we need the slug itself for some functions
  if (env === false || undefined === env || env.trim().length === 0) {
    env = await envUtil.promptEnv()
  }

  let envPath = await envUtil.getPathOrError(env)

  // If we got the path from the cwd, we don't have a slug yet, so get it
  let envSlug = utils.envSlug(env)

  let yaml = readYaml.sync(path.join(envPath, 'docker-compose.yml'))

  let services = [ 'nginx', 'phpfpm', 'elasticsearch' ]

  // Update defined services to have all cached volumes
  for (let service of services) {
    if (!yaml.services[ service ]) {
      continue
    }
    for (let key in yaml.services[ service ].volumes) {
      let volume = yaml.services[ service ].volumes[ key ]
      let parts = volume.split(':')
      if (parts.length !== 3) {
        parts.push('cached')
      }

      yaml.services[ service ].volumes[ key ] = parts.join(':')
    }
  }

  await new Promise(resolve => {
    writeYaml(path.join(envPath, 'docker-compose.yml'), yaml, { 'lineWidth': 500 }, function (err) {
      if (err) {
        console.log(err)
      }
      console.log(`Finished updating ${envSlug}`)
      resolve()
    })
  })

  start(envSlug)
}

const startAll = async function () {
  let envs = await envUtil.getAllEnvironments()

  await gateway.startGlobal()

  for (let i = 0, len = envs.length; i < len; i++) {
    await start(envs[i])
  }
}

const stopAll = async function () {
  let envs = await envUtil.getAllEnvironments()

  for (let i = 0, len = envs.length; i < len; i++) {
    await stop(envs[ i ])
  }

  gateway.stopGlobal()
}

const restartAll = async function () {
  let envs = await envUtil.getAllEnvironments()

  for (let i = 0, len = envs.length; i < len; i++) {
    await restart(envs[ i ])
  }

  gateway.restartGlobal()
}

const deleteAll = async function () {
  let envs = await envUtil.getAllEnvironments()

  for (let i = 0, len = envs.length; i < len; i++) {
    await deleteEnv(envs[ i ])
  }
}

module.exports = { start, stop, restart, upgradeEnv, deleteEnv, startHelp, stopHelp, restartHelp, deleteHelp }
