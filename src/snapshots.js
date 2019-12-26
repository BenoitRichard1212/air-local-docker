const chalk = require('chalk')
const configure = require('./configure')
const auth = require('./auth')
const log = console.log
const error = chalk.bold.red
const envUtils = require('./util/utilities')
const utils = require('./util/utilities')
const execSync = require('child_process').execSync
const inquirer = require('inquirer')
const helpers = require('./util/helpers')
const axios = require('axios')
const warning = chalk.keyword('orange')
const info = chalk.keyword('cyan')
const success = chalk.keyword('green')
const logger = require('./util/logger')
const fs = require('fs')

function help () {
  log(chalk.white('Usage: airlocal snapshots [command]'))
  log()
  log(chalk.white('Options:'))
  log(chalk.white('  -h, --help       output usage information'))
  log()
  log(chalk.white('Commands:'))
  log(
    chalk.white('  list           ') + info('List all DB snapshots available')
  )
  log(
    chalk.white('  pull           ') +
      info('Pull DB snapshot from one of your AirCloud environments')
  )
  log(
    chalk.white('  load [file]    ') +
      info('Import a DB snapshot into one of your AirLocal environments')
  )
}

async function getSnapshotsDir () {
  const snapshotsPath = await configure.get('snapshotsPath')
  return snapshotsPath
}

async function checkIfConfigured () {
  const authConfigured = await auth.checkIfAuthConfigured()

  if (authConfigured === false) {
    return false
  }

  return true
}

async function list () {
  const ssDir = await getSnapshotsDir()
  log(ssDir)
  fs.readdir(ssDir, function (err, files) {
    if (err) {
      log(error('Unable to scan directory: ' + err))
      logger.log('error', err)
      process.exit(1)
    }

    files.forEach(function (file) {
      log(file)
    })
  })
}

async function load (file) {
  const ssDir = await getSnapshotsDir()
  fs.readdir(ssDir, async function (err, files) {
    if (err) {
      logger.log('error', err)
      log(error('Unable to scan directory: ' + err))
      process.exit(1)
    }

    const listArray = []
    files.forEach(function (file) {
      listArray.push(file)
    })

    const found = listArray.includes(file)

    if (!found) {
      log(error('Snapshot does not exist at ' + ssDir + '/' + file))
      process.exit(1)
    }

    log(info('Snapshot found at ' + ssDir + '/' + file))

    const envSlug = await envUtils.parseOrPromptEnv()
    const envPath = await utils.envPath(envSlug)

    // Check if the container is running, otherwise, start up the stacks
    try {
      execSync('airlocal start', { cwd: envPath })
    } catch (err) {
      logger.log('error', err)
      log(error('Error starting site'))
      process.exit(1)
    }

    try {
      execSync(`airlocal wp "db import .snapshots/${file}"`, {
        stdio: 'inherit',
        cwd: envPath
      })
    } catch (err) {
      logger.log('error', err)
      log(error('Error importing database'))
      process.exit(1)
    }

    log(success('Database imported'))
    process.exit(0)
  })
}

async function pull () {
  const authConfigured = await auth.checkIfAuthConfigured()

  if (authConfigured === false) {
    console.log(
      chalk.yellow(
        'Authentication not configured run "airlocal auth configure" then try again.'
      )
    )
    process.exit(1)
  }

  const questions = [
    {
      name: 'site',
      type: 'input',
      message:
        'Enter the site name (use the short 2-3 letter abbreviation from the Gitlab project)',
      validate: helpers.validateNotEmpty
    },
    {
      name: 'environment',
      type: 'list',
      message: 'Which environment to pull?',
      choices: ['stage', 'develop'],
      default: 'stage'
    },
    {
      name: 'force',
      type: 'list',
      message:
        'Should we force the snapshot even if it is less than 24 hours old?',
      choices: ['false', 'true'],
      default: 'false'
    }
  ]

  const answers = await inquirer.prompt(questions)

  const variables = {
    SNAPSHOT_ENV: answers.environment,
    SNAPSHOT_FORCE: answers.force,
    SNAPSHOT_SITE: answers.site
  }

  let response

  try {
    response = await axios.post(
      'https://devops.45air.co/api/v4/projects/899/trigger/pipeline',
      {
        token: '88033918d058794c3ced01033802a6',
        ref: 'master',
        variables
      }
    )
  } catch (err) {
    logger.log('error', err)

    if (err.response) {
      // Server responded with a non 2xx response
      console.log(
        chalk.red('Error: ') + chalk.yellow(err.response.data.message)
      )
    } else if (err.request) {
      // No response received from server
      console.log(
        chalk.red(
          'Error: No response from the server. Logging the error request and exiting.'
        )
      )
    } else {
      // Something happened in setting up the request
      console.log(chalk.red('Error: ') + err.message)
    }
    process.exit(1)
  }

  const webUrlChunked = response.data.web_url.split('/')
  const length = webUrlChunked.length - 1
  const pipeline = webUrlChunked[length]
  const token = await auth.get('token')

  let pipelineResp
  const options = {
    headers: { 'Private-Token': token }
  }

  const wait = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))

  do {
    // Wait for 5 seconds inbetween tries
    await wait(5000)

    try {
      pipelineResp = await axios.get(
        'https://devops.45air.co/api/v4/projects/899/pipelines/' + pipeline,
        options
      )
    } catch (err) {
      logger.log('error', err)

      if (err.response) {
        // Server responded with a non 2xx response
        log(chalk.red('Error: ') + chalk.yellow(err.response.data.message))
      } else if (err.request) {
        // No response received from server
        log(
          chalk.red(
            'Error: No response from the server. Logging the error request and exiting.'
          )
        )
      } else {
        // Something happened in setting up the request
        log(chalk.red('Error: ') + err.message)
      }
      process.exit(1)
    }

    log(info('Database export pipeline is ' + pipelineResp.data.status))
  } while (
    pipelineResp.data.status === 'pending' ||
    pipelineResp.data.status === 'running'
  )

  if (pipelineResp.data.status !== 'success') {
    log(
      error(
        'Pipeline failed, you can check the error @ ' + pipelineResp.web_url
      )
    )
    process.exit(1)
  }

  let jobResp

  try {
    jobResp = await axios.get(
      'https://devops.45air.co/api/v4/projects/899/pipelines/' +
        pipeline +
        '/jobs',
      options
    )
  } catch (err) {
    logger.log('error', err)

    if (err.response) {
      // Server responded with a non 2xx response
      log(chalk.red('Error: ') + chalk.yellow(err.response.data.message))
    } else if (err.request) {
      // No response received from server
      log(
        chalk.red(
          'Error: No response from the server. Logging the error request and exiting.'
        )
      )
    } else {
      // Something happened in setting up the request
      log(chalk.red('Error: ') + err.message)
    }
    process.exit(1)
  }

  const jobId = jobResp.data[0].id

  let artifactResp

  try {
    artifactResp = await axios.get(
      'https://devops.45air.co/api/v4/projects/899/jobs/' +
        jobId +
        '/artifacts/export-local-' +
        answers.environment +
        '.txt',
      options
    )
  } catch (err) {
    logger.log('error', err)

    if (err.response) {
      // Server responded with a non 2xx response
      log(chalk.red('Error: ') + chalk.yellow(err.response.data.message))
    } else if (err.request) {
      // No response received from server
      log(
        chalk.red(
          'Error: No response from the server. Logging the error request and exiting.'
        )
      )
    } else {
      // Something happened in setting up the request
      log(chalk.red('Error: ') + err.message)
    }
    process.exit(1)
  }

  let artifactSplit = artifactResp.data.split('\n')
  artifactSplit = artifactSplit[1].split('\t')

  const signedUrl = artifactSplit[3]

  log(success('Database file can be downloaded for 3 hours from:'))
  log(signedUrl)

  const ssDir = await getSnapshotsDir()

  log(
    info(
      'Automatically downloading snapshot to ' +
        ssDir +
        '/' +
        answers.site +
        '_' +
        answers.environment +
        '.sql'
    )
  )

  try {
    execSync(
      'curl -o ' +
        ssDir +
        '/' +
        answers.site +
        '_' +
        answers.environment +
        '.sql "' +
        signedUrl +
        '"',
      { stdio: 'inherit' }
    )
  } catch (err) {
    logger.log('error', err)
    log(
      error(
        'Error downloading snapshot, you should manually download it to your air snapshots directory: ' +
          ssDir
      )
    )
  }

  log(success('Snapshot export completed!'))
  process.exit(0)
}

module.exports = { help, checkIfConfigured, getSnapshotsDir, list, load, pull }
