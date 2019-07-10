const chalk = require('chalk')
const exec = require('child_process').exec
const utils = require('./util/utilities')
const { cacheVolume } = require('./util/variables')
const log = console.log
const info = chalk.keyword('cyan')

async function download (env) {
  let envPath = await utils.envPath(env)

  log(info('Downloading WordPress'))
  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core download --force"`, { cwd: envPath })
}

async function downloadDevelop (env) {
  let envPath = await utils.envPath(env)

  log(info('Downloading WordPress Develop'))
  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "git clone git://develop.git.wordpress.org/ ."`, { cwd: envPath })
  exec(`docker run -t --rm -v ${envPath}/wordpress:/usr/src/app -v ${cacheVolume}:/var/www/.npm 45air/wpcorebuild:latest npm install`, { cwd: envPath })
  exec(`docker run -t --rm -v ${envPath}/wordpress:/usr/src/app 45air/wpcorebuild:latest grunt`, { cwd: envPath })
}

async function configure (env) {
  let envSlug = utils.envSlug(env)
  let envPath = await utils.envPath(env)

  log(info('Configuring WordPress'))
  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp config create --force --dbname=${envSlug}"`, { cwd: envPath })
}

async function install (env, envHost, answers) {
  let envPath = await utils.envPath(env)
  let command = ''
  let flags = ''

  switch (answers.wordpressType) {
    case 'single':
    case 'dev':
      command = 'install'
      break
    case 'subdirectory':
      command = 'multisite-install'
      break
    case 'subdomain':
      command = 'multisite-install'
      flags = '--subdomains'
      break
    default:
      throw Error('Invalid Installation Type')
  }

  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core ${command} ${flags} --url=http://${envHost} --title=\\"${answers.title}\\" --admin_user=\\"${answers.username}\\" --admin_password=\\"${answers.password}\\" --admin_email=\\"${answers.email}\\""`, { cwd: envPath })
}

async function setRewrites (env) {
  let envPath = await utils.envPath(env)

  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp rewrite structure /%postname%/"`, { cwd: envPath })
}

async function emptyContent (env) {
  let envPath = await utils.envPath(env)

  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp site empty --yes"`, { cwd: envPath })
  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp plugin delete hello akismet"`, { cwd: envPath })
  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp theme delete twentyfifteen twentysixteen"`, { cwd: envPath })
  exec(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2"`, { cwd: envPath })
}

module.exports = { download, downloadDevelop, configure, install, setRewrites, emptyContent }
