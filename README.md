# Air Local Docker

Docker based local development environment for 45AIR hosted websites that works on Mac, Windows, and Linux.

## Prerequisites

Air Local Docker requires docker, docker-compose, Node, and npm. It is recommended that you use the latest versions of
docker and docker-compose. Node 10 (current LTS version) is the only version of node that is supported. While Air Local
Docker _may_ work with other versions of Node, compatibility is not guaranteed.

#### MacOS
Docker is available for download from the [Docker website](https://docs.docker.com/docker-for-mac/install/) and will
install docker-compose automatically. NodeJS and npm can be installed from the [NodeJS website](https://nodejs.org),
via a package manager, such as [Homebrew](https://brew.sh/), or using a version manager, such as
[nvm](https://github.com/creationix/nvm).

##### NodeJS EACCESS Error
If Node was installed via the download from the NodeJS website, you will likely get an `EACCESS` error when trying to install
global npm packages without using sudo. Npm has an article on [preventing permission errors](https://docs.npmjs.com/getting-started/fixing-npm-permissions#option-2-change-npms-default-directory-to-another-directory)
if you'd like to run the command without sudo. Alternatively, just run the install command with sudo.

#### Windows
Docker is available for download from the [Docker website](https://docs.docker.com/docker-for-windows/install/) and will
install docker-compose automatically. NodeJS and npm can be installed from the [NodeJS website](https://nodejs.org).

#### Linux
Docker has platform specific installation instructions available for linux on their [documentation site](https://docs.docker.com/install/#supported-platforms).
Once docker is installed, you will need to [manually install docker compose](https://docs.docker.com/compose/install/).
NodeJS can be installed via a package manager for many linux platforms [following these instructions](https://nodejs.org/en/download/package-manager/).

## Installation

Once all installation prerequisites have been met, Air Local Docker is installed as a global npm package by running
`npm install -g @45air/air-local-docker`. You can confirm it has been installed by running `airlocal --version`.

## Configuration

The first time you run a Air Local Docker command, default configuration settings will be used if you have not manually
configured Air Local Docker beforehand. By default, Air Local Docker will store all environments within the
`~/air-local-docker-sites` directory and try to manage your hosts file when creating and deleting environments. If you
would like to customize the environment path or opt to not have Air Local Docker update your hosts file, run
`airlocal configure` and follow the prompts.

## Updating

To update Air Local Docker, run `npm update -g @45air/air-local-docker`

## Documentation

### Global Commands

#### Clearing Shared Cache
WP CLI, Air DB Snapshots, and npm (when building the development version of WordPress) all utilize cache to speed up
operations and save on bandwidth in the future.

`airlocal cache clear` Clears the WP CLI, Air DB Snapshots, and npm (for WordPress core development) caches.

#### Updating Docker Images
`airlocal image update` Will determine which of the docker images utilized by Air Local Docker are present on your
system and update them to the latest version available.

#### Stopping global services
Air Local Docker relies on a set of global services to function properly. To turn off global services, run
`airlocal stop all`. This will stop all environments and then the global services.

### Environments

#### Create an Environment

`airlocal create` will present you with a series of prompts to configure your environment to suit your needs.

It is recommended that you use the `.test` top level domain (TLD) for your local environments, as this TLD is reserved
for the testing of software and is not intended to ever be installed into the global Domain Name System. Additionally,
Air Local Docker is configured to send any container to container traffic for .test TLDs directly to the gateway
container, so that things like WP Cron and the REST API can work between environments out of the box.

#### Delete an Environment

`airlocal delete <hostname>` will delete an environment with the given hostname. Any local files, docker volumes, and
databases related to the environment will be deleted permanently.

A special hostname `all` is available that will delete all environments. You will be asked to confirm deletion of each
environment.

#### Stop an Environment

`airlocal stop <hostname>` will stop an environment from running while retaining all files, docker volumes, and
databases related to the environment.

A special hostname `all` is available that will stop all running environments as well as the global services.

#### Start an Environment

`airlocal start <hostname>` will start a preexisting environment.

A special hostname `all` is available that will start all environments as well as the global services.

#### Restart an Environment

`airlocal restart <hostname>` will restart all services associated with a preexisting environment.

A special hostname `all` is available that will restart all environments as well as the global services.

#### Elasticsearch

If you have enabled Elasticsearch for a particular environment, you can send requests from the host machine to the
Elasticsearch server by prefixing the url path with `/__elasticsearch/`. For example, if you wanted to hit the
`/_all/_search/` endpoint of Elasticsearch, the URL would look like: `http://<hostname>/__elasticsearch/_all/_search`

#### Air DB Snapshots

WIP

#### Running WP CLI Commands

Running WP CLI commands against an environment is easy. First, make sure you are somewhere within your environment
directory (by default, this is somewhere within `~/air-local-docker-sites/<environment>/`). Once within the environment
directory, simply run `airlocal wp <command>`. `<command>` can be any valid command you would otherwise pass directly
to WP CLI.

Examples:
* `airlocal wp search-replace 'mysite.com' 'mysite.test'`
* `airlocal wp site list`

#### Shell

You can get a shell inside of any container in your environment using the `airlocal shell [<service>]` command. If a
service is not provided, the `phpfpm` container will be used by default. Other available services can vary depending
on the options selected during creation of the environment, but may include:
* `phpfpm`
* `nginx`
* `elasticsearch`
* `memcached`

#### Logs

Real time container logs are available using the `airlocal logs [<service>]` command. If a service is not provided,
logs from all containers in the current environment will be shown. To stop logs, type `ctrl+c`. Available services can
vary depending on the options selected during creation of the environment, but may include:
* `phpfpm`
* `nginx`
* `elasticsearch`
* `memcached`

### Tools

#### phpMyAdmin

[phpMyAdmin](https://www.phpmyadmin.net/) is available as part of the global services stack that is deployed to support all of the environments.

Access phpMyAdmin by navigating to [http://localhost:8092](http://localhost:8092).
* Username: `wordpress`
* Password: `password`

#### MailCatcher

[MailCatcher](https://mailcatcher.me/) is available as part of the global services stack that is deployed to support all of the environments. It
is preconfigured to catch mail sent from any of the environments created by Air Local Docker.

Access MailCatcher by navigating to [http://localhost:1080](http://localhost:1080).

#### PHPMemcachedAdmin

[PHPMemcachedAdmin](https://github.com/elijaa/phpmemcachedadmin) is available within each environment. It enables you
to view basic memcache stats as well as execute based memcache commands.

Access PHPMemcachedAdmin by appending `/__memcacheadmin/` to your environment's hostname. For example, if your hostname
is `docker.test`, you can access PHPMemcachedAdmin at `docker.test/__memcacheadmin/`

#### Xdebug

Xdebug is included in the php images and is nearly ready to go out of the box. Make sure your IDE is listening for
PHP debug connections and set up a path mapping to your local environment's `wordpress/` directory to `/var/www/web/`
in the container.

##### Visual Studio Code
1. Install the [PHP Debug](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug) extension.
2. In your project, go to the Debug view, click "Add Configuration..." and choose PHP environment. A new launch configuration will be created for you.
3. Set the `pathMappings` parameter to your local `wordpress` directory. Example:
```json
"configurations": [
        {
            "name": "Listen for XDebug",
            "type": "php",
            "request": "launch",
            "port": 9000,
            "pathMappings": {
                "/var/www/web": "${workspaceFolder}/wordpress",
            }
        }
]
```

## Attribution

https://github.com/10up/wp-local-docker-v2
