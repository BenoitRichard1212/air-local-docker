const chalk = require('chalk')
const execSync = require('child_process').execSync
const log = console.log
const info = chalk.keyword('cyan')

// These have to exist, so we don't bother checking if they exist on the system first
const globalImages = [
  '45air/nginx-proxy:latest',
  'mysql:5.7',
  'schickling/mailcatcher'
]
const images = [
  '45air/phpfpm:latest',
  '45air/phpfpm:7.3',
  '45air/phpfpm:7.2',
  '45air/phpfpm:7.1',
  '45air/phpfpm:7.0',
  '45air/phpfpm:5.6',
  '45air/wpsnapshots:dev',
  'redis:latest',
  '45air/nginx:latest',
  'docker.elastic.co/elasticsearch/elasticsearch:5.6.5'
]

function help () {
  log(chalk.white('Usage: airlocal image [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help         output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(chalk.white('  update all         ') + info('Updates all images used to their latest tagged version'))
  log(chalk.white('  update [img]       ') + info('Updates image passed to the latest tagged version'))
}

function update (image) {
  try {
    execSync(`docker pull ${image}`, { stdio: 'inherit' })
  } catch (ex) {}

  log()
}

function updateIfUsed (image) {
  log(`Testing ${image}`)
  const result = execSync(`docker image ls ${image}`).toString()
  // All images say how long "ago" they were created.. Use this to determine if the image exists, since `wc -l` doesn't work on windows
  if (result.indexOf('ago') === -1) {
    log(`${image} doesn't exist on this system. Skipping update.`)
    return
  }

  update(image)
}

function updateAll () {
  globalImages.map(update)
  images.map(updateIfUsed)
}

module.exports = { updateAll, help }
