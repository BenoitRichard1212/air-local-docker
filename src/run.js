const path = require('path')
const os = require('os')
const chalk = require('chalk')
const execSync = require('child_process').execSync
const { rootPath, cacheVolume } = require('./util/variables')

const error = chalk.bold.red
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const log = console.log

function help () {
  log(chalk.white('Usage: airlocal run <service> [command...]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(chalk.white('  composer [cmd...]  ') + info('Runs a composer command'))
  log(chalk.white('  npm [cmd...]       ') + info('Runs a npm command'))
  log(chalk.white('  gulp [cmd...]      ') + info('Runs a gulp command'))
}

const composer = async function (command) {
  await buildRunImg()

  const userInfo = os.userInfo()

  try {
    execSync(
      `docker run --rm --interactive --tty --volume $PWD:/app --volume ${cacheVolume}/composer/cache:/home/docker/.composer/cache --entrypoint="" --user=${userInfo.uid}:${userInfo.gid} airlocal-run:phplatest-node10 composer ${command}`,
      { stdio: 'inherit' }
    )
  } catch (err) {
    logger.log('error', err)
  }
}

const npm = async function (command) {
  await buildRunImg()

  const userInfo = os.userInfo()

  try {
    execSync(
      `docker run --rm --interactive --tty --volume $PWD:/app --entrypoint="" --user=${userInfo.uid}:${userInfo.gid} airlocal-run:phplatest-node10 npm ${command}`,
      { stdio: 'inherit' }
    )
  } catch (err) {
    logger.log('error', err)
  }
}

const gulp = async function (command) {
  await buildRunImg()

  const userInfo = os.userInfo()

  try {
    execSync(
      `docker run --rm --interactive --tty --volume $PWD:/app --entrypoint="" --user=${userInfo.uid}:${userInfo.gid} airlocal-run:phplatest-node10 gulp ${command}`,
      { stdio: 'inherit' }
    )
  } catch (err) {
    logger.log('error', err)
  }
}

const buildRunImg = async function () {
  const buildDir = path.join(rootPath, 'build', 'run')

  try {
    execSync(
      'cd ' +
        buildDir +
        ' && docker build --build-arg NODE_VERSION="10" -t airlocal-run:phplatest-node10 .',
      { stdio: 'inherit' }
    )
    log(success('Built airlocal-run:phplatest-node10'))
  } catch (err) {
    logger.log('error', err)
    log(error('Problem building airlocal-run:phplatest-node10'))
    process.exit(1)
  }
}

module.exports = { help, composer, npm, gulp }
