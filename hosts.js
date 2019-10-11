#!/usr/bin/env node

const commander = require('commander')
const hostile = require('hostile')

const log = console.log

// Init the CLI
const program = new commander.Command()

program.command('add <host>').action(function (host) {
  hostile.set('127.0.0.1', host, function (err) {
    if (err) {
      console.error(err)
    } else {
      log('Added to hosts file successfully!')
    }
  })
})

program.command('remove <host>').action(function (host) {
  hostile.remove('127.0.0.1', host, function (err) {
    if (err) {
      console.error(err)
    } else {
      log('Removed from hosts file successfully!')
    }
  })
})

program.parse(process.argv)
