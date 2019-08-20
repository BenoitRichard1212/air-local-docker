const chalk = require('chalk')
const execSync = require('child_process').execSync
const utils = require('./util/utilities')
const { cacheVolume } = require('./util/variables')
const log = console.log
const info = chalk.keyword('cyan')

async function download (env) {
  const envPath = await utils.envPath(env)

  log(info('Downloading WordPress'))
  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core download --force"`, { stdio: 'inherit', cwd: envPath })
}

async function downloadDevelop (env) {
  const envPath = await utils.envPath(env)

  log(info('Downloading WordPress Develop'))
  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "git clone git://develop.git.wordpress.org/ ."`, { stdio: 'inherit', cwd: envPath })
  execSync(`docker run -t --rm -v ${envPath}/wordpress:/usr/src/app -v ${cacheVolume}:/var/www/.npm 45air/wpcorebuild:latest npm install`, { stdio: 'inherit', cwd: envPath })
  execSync(`docker run -t --rm -v ${envPath}/wordpress:/usr/src/app 45air/wpcorebuild:latest grunt`, { stdio: 'inherit', cwd: envPath })
}

async function configure (env) {
  const envSlug = utils.envSlug(env)
  const envPath = await utils.envPath(env)

  log(info('Configuring WordPress'))
  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp config create --force --dbname=${envSlug}"`, { stdio: 'inherit', cwd: envPath })
}

async function install (env, envHost, answers) {
  const envPath = await utils.envPath(env)
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

  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp core ${command} ${flags} --url=http://${envHost} --title=\\"${answers.title}\\" --admin_user=\\"${answers.username}\\" --admin_password=\\"${answers.password}\\" --admin_email=\\"${answers.email}\\""`, { stdio: 'inherit', cwd: envPath })
}

async function setRewrites (env) {
  const envPath = await utils.envPath(env)

  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp rewrite structure /%postname%/"`, { stdio: 'inherit', cwd: envPath })
}

async function emptyContent (env) {
  const envPath = await utils.envPath(env)

  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp site empty --yes"`, { stdio: 'inherit', cwd: envPath })
  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp plugin delete hello akismet"`, { stdio: 'inherit', cwd: envPath })
  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp theme delete twentyfifteen twentysixteen"`, { stdio: 'inherit', cwd: envPath })
  execSync(`docker-compose exec phpfpm su -s /bin/bash www-data -c "wp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2"`, { stdio: 'inherit', cwd: envPath })
}

module.exports = { download, downloadDevelop, configure, install, setRewrites, emptyContent }
