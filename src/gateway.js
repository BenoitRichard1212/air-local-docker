const chalk = require('chalk')
const execSync = require('child_process').execSync
const exec = require('child_process').exec
const { globalPath } = require('./util/variables')
const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const log = console.log

// Tracks if we've started global inside of this session
let started = false

const ensureNetworkExists = function () {
  try {
    log(info('Ensuring global network exists'))
    const networks = execSync(
      'docker network ls --filter name=^airlocaldocker$'
    ).toString()
    if (networks.indexOf('airlocaldocker') !== -1) {
      log(info(' - Network exists'))
      return
    }

    log(info(' - Creating network'))
    // --ip-range is only half of the subnet, so that we have a bunch of addresses in front to assign manually
    execSync(
      'docker network create airlocaldocker --subnet=10.0.0.0/16 --gateway 10.0.0.1 --ip-range 10.0.128.0/17'
    )
  } catch (ex) {}
}

const removeNetwork = function () {
  try {
    log(info('Removing Global Network'))
    execSync('docker network rm airlocaldocker')
  } catch (ex) {}
}

const occurrences = function (string, subString, allowOverlapping) {
  string += ''
  subString += ''
  if (subString.length <= 0) return string.length + 1

  var n = 0
  var pos = 0
  var step = allowOverlapping ? 1 : subString.length

  while (true) {
    pos = string.indexOf(subString, pos)
    if (pos >= 0) {
      ++n
      pos += step
    } else break
  }
  return n
}

/**
 * Wait for mysql to come up and finish initializing.
 *
 * The first the time the container starts, it will restart, so wait for 2 occurrences of the "ready for connections" string
 * Otherwise, we just wait for one occurrence.
 */
const waitForDB = function () {
  const firstTimeMatch = 'Initializing database'
  const readyMatch = 'ready for connections'
  return new Promise(resolve => {
    const interval = setInterval(() => {
      log(warning('Waiting for mysql...'))
      const mysql = execSync('docker-compose logs mysql', {
        cwd: globalPath
      }).toString()

      if (mysql.indexOf(readyMatch) !== -1) {
        if (occurrences(mysql, firstTimeMatch, false) !== 0) {
          // this is the first time the DB is starting, so it will restart.. Wait for TWO occurrences of connection string
          if (occurrences(mysql, readyMatch, false) < 2) {
            return
          }
        } else {
          if (occurrences(mysql, readyMatch, false) < 1) {
            return
          }
        }

        clearInterval(interval)
        resolve()
      }
    }, 3000)
  })
}

const startGateway = async function () {
  log(info('Ensuring global services are running'))

  try {
    execSync('docker-compose up -d', { stdio: 'inherit', cwd: globalPath })
  } catch (err) {
    logger.log('error', err)
    log(error('Error running ') + warning('docker-compose up -d'))
  }

  await waitForDB()
}

const stopGateway = function () {
  log(info('Stopping global services'))
  try {
    execSync('docker-compose down', { stdio: 'inherit', cwd: globalPath })
  } catch (err) {
    logger.log('error', err)
    log(error('Error running ') + warning('docker-compose down'))
    log(info('Stopping all docker containers instead'))
    execSync('docker stop $(docker ps -a -q)', { stdio: 'inherit' })
  }
}

const restartGateway = function () {
  log(info('Restarting global services'))
  try {
    execSync('docker-compose restart', { stdio: 'inherit', cwd: globalPath })
  } catch (err) {
    logger.log('error', err)
    log(error('Error running ') + warning('docker-compose restart'))
  }
}

const startGlobal = async function () {
  if (started === true) {
    return
  }

  ensureNetworkExists()
  await startGateway()

  started = true
}

const stopGlobal = function () {
  stopGateway()
  removeNetwork()

  started = false
}

const restartGlobal = function () {
  ensureNetworkExists()
  restartGateway()

  started = true
}

module.exports = {
  startGlobal,
  stopGlobal,
  restartGlobal
}
