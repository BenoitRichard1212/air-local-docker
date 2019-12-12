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
const envUtil = require('./util/utilities')
const utils = require('./util/utilities')
const helpers = require('./util/helpers')
const { rootPath } = require('./util/variables')

const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const log = console.log

function startHelp () {
  log(chalk.white('Command: airlocal start'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(
    chalk.white('  start              ') +
      info('Use without params to automatically detect current environment')
  )
  log(
    chalk.white('  start [env]        ') +
      info('Use passing environment as param to start that environment')
  )
  log(
    chalk.white('  start all          ') +
      info('Use passing all to start all environments')
  )
}

function stopHelp () {
  log(chalk.white('Command: airlocal stop'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(
    chalk.white('  stop               ') +
      info('Use without params to automatically detect current environment')
  )
  log(
    chalk.white('  stop [env]         ') +
      info('Use passing environment as param to stop that environment')
  )
  log(
    chalk.white('  stop all           ') +
      info('Use passing all to stop all environments')
  )
}

function deleteHelp () {
  log(chalk.white('Command: airlocal delete'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(
    chalk.white('  delete             ') +
      info('Use without params to automatically detect current environment')
  )
  log(
    chalk.white('  delete [env]       ') +
      info('Use passing environment as param to delete that environment')
  )
  log(
    chalk.white('  delete all         ') +
      info('Use passing all to delete all environments')
  )
}

function restartHelp () {
  log(chalk.white('Command: airlocal restart'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Usage:'))
  log(
    chalk.white('  restart            ') +
      info('Use without params to automatically detect current environment')
  )
  log(
    chalk.white('  restart [env]      ') +
      info('Use passing environment as param to restart that environment')
  )
  log(
    chalk.white('  restart all        ') +
      info('Use passing all to restart all environments')
  )
}

const start = async function (env) {
  if (env === 'all') {
    await startAll()
    process.exit(0)
  }

  if (undefined === env || env.trim().length === 0) {
    env = await envUtil.parseOrPromptEnv()
  }

  // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
  if (env === false || undefined === env || env.trim().length === 0) {
    env = await envUtil.promptEnv()
  }

  const envPath = await envUtil.getPathOrError(env)

  // If we got the path from the cwd, we don't have a slug yet, so get it
  const envSlug = utils.envSlug(env)

  await gateway.startGlobal()

  log(info(`Starting docker containers for ${envSlug}`))
  try {
    execSync('docker-compose up -d', { stdio: 'inherit', cwd: envPath })
  } catch (err) {
    logger.log('error', err)
  }

  const envHosts = await envUtil.getEnvHosts(envPath)
  if (envHosts.length > 0) {
    log(info('Environment configured for the following domains:'))
    for (let i = 0, len = envHosts.length; i < len; i++) {
      log(envHosts[i])
    }
  }
}

const stop = async function (env) {
  if (env === 'all') {
    await stopAll()
    process.exit(0)
  }

  if (undefined === env || env.trim().length === 0) {
    env = await envUtil.parseEnvFromCWD()
  }

  // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
  if (env === false || undefined === env || env.trim().length === 0) {
    env = await envUtil.promptEnv()
  }

  const envPath = await envUtil.getPathOrError(env)

  // If we got the path from the cwd, we don't have a slug yet, so get it
  const envSlug = utils.envSlug(env)

  log(success(`Stopping docker containers for ${envSlug}`))
  try {
    execSync('docker-compose down', { stdio: 'inherit', cwd: envPath })
  } catch (err) {
    logger.log('error', err)
  }
}

const restart = async function (env) {
  if (env === 'all') {
    await restartAll()
    process.exit(0)
  }

  if (undefined === env || env.trim().length === 0) {
    env = await envUtil.parseEnvFromCWD()
  }

  // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
  if (env === false || undefined === env || env.trim().length === 0) {
    env = await envUtil.promptEnv()
  }

  const envPath = await envUtil.getPathOrError(env)

  // If we got the path from the cwd, we don't have a slug yet, so get it
  const envSlug = utils.envSlug(env)

  await gateway.startGlobal()

  log(success(`Restarting docker containers for ${envSlug}`))
  try {
    execSync('docker-compose restart', { stdio: 'inherit', cwd: envPath })
  } catch (err) {
    logger.log('error', err)
    process.exit(1)
  }
}

const deleteEnv = async function (env) {
  if (env === 'all') {
    await deleteAll()
    process.exit(0)
  }

  // Need to call this outside of envUtils.getPathOrError since we need the slug itself for some functions
  if (env === false || undefined === env || env.trim().length === 0) {
    env = await envUtil.promptEnv()
  }

  const envPath = await envUtil.getPathOrError(env)
  const envSlug = utils.envSlug(env)

  const answers = await inquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    message: `Are you sure you want to delete the ${envSlug} environment`,
    validate: helpers.validateNotEmpty,
    default: false
  })

  if (answers.confirm === false) {
    return
  }

  await gateway.stopGlobal()
  await gateway.startGlobal()

  // Stop the environment, and ensure volumes are deleted with it
  log(info('Deleting containers'))
  try {
    execSync('docker-compose down -v', { stdio: 'inherit', cwd: envPath })
  } catch (err) {
    // If the docker-compose file is already gone, this happens
    logger.log('error', err)
  }

  if ((await config.get('manageHosts')) === true) {
    try {
      log(info('Removing host file entries'))

      const sudoOptions = {
        name: 'AIRLOCAL'
      }

      const envHosts = await envUtil.getEnvHosts(envPath)
      for (let i = 0, len = envHosts.length; i < len; i++) {
        await new Promise(resolve => {
          log(` - Removing ${envHosts}`)
          const hostsCmd = path.join(rootPath, 'hosts.js')
          sudo.exec(
            hostsCmd + ` remove ${envHosts}`,
            sudoOptions,
            function (error, stdout, stderr) {
              if (error) {
                log(error('Something went wrong deleting host file entries. There may still be remnants in /etc/hosts'))
                resolve()
                return
              }
              log(success(stdout))
              resolve()
            }
          )
        })
      }
    } catch (err) {
      // Unfound config, etc
      log(error('Something went wrong deleting host file entries. There may still be remnants in /etc/hosts'))
    }
  }

  log(info('Deleting Files'))
  try {
    await fs.remove(envPath)
  } catch (err) {
    // Most likely we got a permissions error here
    logger.log('error', err)
    log(error('Error deleting some of the site files, trying with elevated permissions'))

    const options = {
      name: 'AIRLOCAL'
    }

    sudo.exec('rm -rf ' + envPath, options, function (error, stdout, stderr) {
      if (error) {
        log(error('You will need to manually delete the folder'))
      }
    })
  }

  log(info('Deleting Database'))
  try {
    await database.deleteDatabase(envSlug)
  } catch (err) {
    logger.log('error', err)
    log(error('Error deleting the database'))
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

  const envPath = await envUtil.getPathOrError(env)

  // If we got the path from the cwd, we don't have a slug yet, so get it
  const envSlug = utils.envSlug(env)

  const yaml = readYaml.sync(path.join(envPath, 'docker-compose.yml'))

  const services = ['nginx', 'phpfpm', 'elasticsearch']

  // Update defined services to have all cached volumes
  for (const service of services) {
    if (!yaml.services[service]) {
      continue
    }
    for (const key in yaml.services[service].volumes) {
      const volume = yaml.services[service].volumes[key]
      const parts = volume.split(':')
      if (parts.length !== 3) {
        parts.push('cached')
      }

      yaml.services[service].volumes[key] = parts.join(':')
    }
  }

  await new Promise(resolve => {
    writeYaml(
      path.join(envPath, 'docker-compose.yml'),
      yaml,
      { lineWidth: 500 },
      function (err) {
        if (err) {
          logger.log('error', err)
          log(error(err))
        }
        log(success(`Finished updating ${envSlug}`))
        resolve()
      }
    )
  })

  start(envSlug)
}

const startAll = async function () {
  const envs = await envUtil.getAllEnvironments()

  await gateway.startGlobal()

  for (let i = 0, len = envs.length; i < len; i++) {
    await start(envs[i])
  }
}

const stopAll = async function () {
  const envs = await envUtil.getAllEnvironments()

  for (let i = 0, len = envs.length; i < len; i++) {
    await stop(envs[i])
  }

  gateway.stopGlobal()
}

const restartAll = async function () {
  const envs = await envUtil.getAllEnvironments()

  for (let i = 0, len = envs.length; i < len; i++) {
    await restart(envs[i])
  }

  gateway.restartGlobal()
}

const deleteAll = async function () {
  const envs = await envUtil.getAllEnvironments()

  for (let i = 0, len = envs.length; i < len; i++) {
    await deleteEnv(envs[i])
  }
}

module.exports = {
  start,
  stop,
  restart,
  upgradeEnv,
  deleteEnv,
  startHelp,
  stopHelp,
  restartHelp,
  deleteHelp
}
