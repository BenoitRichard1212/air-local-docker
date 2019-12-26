const chalk = require('chalk')
const execSync = require('child_process').execSync
const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const log = console.log

// These have to exist, so we don't bother checking if they exist on the system first
const globalImages = [
  'jwilder/nginx-proxy',
  'mysql:5.7',
  'schickling/mailcatcher'
]
const images = [
  'quay.io/45air/wordpress:7.3-nginx-fpm',
  'quay.io/45air/wordpress:7.2-nginx-fpm',
  'quay.io/45air/wordpress:7.1-nginx-fpm',
  'quay.io/45air/wordpress:7.0-nginx-fpm',
  'redis'
]

function help () {
  log(chalk.white('Usage: airlocal image [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(
    chalk.white('  update all         ') +
      info('Updates all images used to their latest tagged version')
  )
  log(
    chalk.white('  update [img]       ') +
      info('Updates image passed to the latest tagged version')
  )
}

function update (image) {
  try {
    execSync(`docker image rm -f ${image}`, { stdio: 'inherit' })
  } catch (err) {
    logger.log('error', err)
    log(error('Error removing ' + image))
  }

  try {
    execSync(`docker pull ${image}`, { stdio: 'inherit' })
  } catch (err) {
    logger.log('error', err)
    log(error('Error pulling ' + image))
  }
}

function updateIfUsed (image) {
  log(info(`Testing ${image}`))
  const result = execSync(`docker image ls ${image}`).toString()
  // All images say how long "ago" they were created.. Use this to determine if the image exists, since `wc -l` doesn't work on windows
  if (result.indexOf('ago') === -1) {
    log(info(`${image} doesn't exist on this system. Skipping update.`))
    return
  }

  update(image)
}

function updateAll () {
  log(info('Stopping all Docker images before forcing image updates'))

  try {
    execSync('docker stop $(docker ps -a -q)', { stdio: 'inherit' })
  } catch (err) {
    logger.log('error', err)
    log(error('Error stopping AirLocal containers'))
  }

  log(info('Updating global AirLocal Docker images'))
  globalImages.map(update)
  log(info('Updating other AirLocal Docker images that exist on the system'))
  images.map(updateIfUsed)
}

module.exports = { updateAll, help }
