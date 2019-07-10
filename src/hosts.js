const chalk = require('chalk')
const log = console.log
const info = chalk.keyword('cyan')
const hostile = require('hostile')

function help () {
  log(chalk.white('Usage: airlocal hosts [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help      output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(chalk.white('  add [host]      ') + info('Add an entry to the hosts file'))
  log(chalk.white('  remove [host]   ') + info('Remove an entry from the hosts file'))
  log(chalk.white('  list            ') + info('List all entries in hosts file'))
}

const add = function (hosts) {
  hostile.set('127.0.0.1', hosts, function (err) {
    if (err) {
      console.error(err)
    } else {
      console.log('Added to hosts file successfully!')
    }
  })
}

const remove = function (hosts) {
  hostile.remove('127.0.0.1', hosts, function (err) {
    if (err) {
      console.error(err)
    } else {
      console.log('Removed from hosts file successfully!')
    }
  })
}

const list = function () {
  hostile.get(false, function (err, lines) {
    if (err) {
      console.error(err.message)
    }
    lines.forEach(function (line) {
      console.log(line)
    })
  })
}

module.exports = { add, remove, list, help }
