# Air Local Docker

[![Docker Repository on Quay](https://quay.io/repository/45air/wordpress/status 'Docker Repository on Quay')](https://quay.io/repository/45air/wordpress)

Docker based local development environment that works on Mac, Windows, and Linux. Geared to WordPress development but generally any type of site should work. Uses public Docker images hosted on Docker Hub and our own public Docker images hosted on Quay for setting up the development enviroment for your sites.

Extra add ons and automation for 45AIR customers which can be configured by running `airlocal auth config`, you can check your logged in status with `airlocal auth status` as well after configuring your authentication to make sure it is still valid.

## Prerequisites

* [Docker](https://docs.docker.com/install/)
* [Docker Compose](https://docs.docker.com/compose/install/)
* [Node >= 10](https://nodejs.org/en/download/releases/) or [nvm](https://github.com/nvm-sh/nvm#installation-and-update)
* npm >= 6.4.1

## Installation

It is generally recommended to scope the install of the `airlocal` npm package to your user account.

```bash
npm install @45air/air-local-docker
```

You can also globally install the package if needed.
**NOTE: You may need to use sudo if you get an error trying the global install**

```bash
npm install -g @45air/air-local-docker
```
Confirm installation by checking the version installed.

```bash
airlocal version
```

## Configuration

The first time you run `airlocal` you will be prompted to configure it. The configuration file is located at `~/.airlocal/config.json`.

By default, AirLocal will store all environments within the `~/air-local-docker-sites` directory and try to manage your hosts file when creating and deleting environments.

If you would like to customize the environment path or opt to not have AirLocal update your hosts file, run `airlocal configure` and follow the prompts.

## Updating

To update AirLocal, run `npm update @45air/air-local-docker`

## Command Documentation

### Global Commands

#### Clearing Shared Cache

WP CLI, Composer, and npm all utilize cache to speed up operations and save on bandwidth in the future.

`airlocal cache clear` Clears the WP CLI, composer, and npm caches.

#### Updating Docker Images

`airlocal image update all` Will determine which of the docker images utilized by Air Local Docker are present on your system and update them to the latest version available.

#### Stopping global services

AirLocal relies on a set of global services to function properly. To turn off global services, run `airlocal stop all`. This will stop all environments and then the global services.

### Environments

#### Create an Environment

`airlocal create` will present you with a series of prompts to configure your environment to suit your needs.

It is recommended that you use the `.test` top level domain (TLD) for your local environments, as this TLD is reserved for the testing of software and is not intended to ever be installed into the global Domain Name System. Additionally, AirLocal is configured to send any container to container traffic for .test TLDs directly to the gateway container, so that things like WP Cron and the REST API can work between environments out of the box.

#### Delete an Environment

`airlocal delete <hostname>` will delete an environment with the given hostname. Any local files, docker volumes, and databases related to the environment will be deleted permanently.

A special hostname `all` is available that will delete all environments. You will be asked to confirm deletion of each environment.

#### Stop an Environment

`airlocal stop <hostname>` will stop an environment from running while retaining all files, docker volumes, and databases related to the environment.

A special hostname `all` is available that will stop all running environments as well as the global services.

#### Start an Environment

`airlocal start <hostname>` will start a preexisting environment.

A special hostname `all` is available that will start all environments as well as the global services.

#### Restart an Environment

`airlocal restart <hostname>` will restart all services associated with a preexisting environment.

A special hostname `all` is available that will restart all environments as well as the global services.

#### Running WP CLI Commands

Running WP CLI commands against an environment is easy. First, make sure you are somewhere within your environment directory (by default, this is somewhere within `~/air-local-docker-sites/<environment>/`). Once within the environment directory, simply run `airlocal wp <command>`. `<command>` can be any valid command you would otherwise pass directly to WP CLI.

Examples:

- `airlocal wp search-replace mysite.com mysite.test`
- `airlocal wp site list`

#### Shell

You can get a shell inside of any container in your environment using the `airlocal shell [<service>]` command. If a service is not provided, the `phpfpm` container will be used by default. Other available services can vary depending on the options selected during creation of the environment, but may include:

- `phpfpm`
- `nginx`
- `redis`

#### Logs

Real time container logs are available using the `airlocal logs [<service>]` command. If a service is not provided, logs from all containers in the current environment will be shown. To stop logs, type `ctrl+c`. Available services can vary depending on the options selected during creation of the environment, but may include:

- `phpfpm`
- `nginx`
- `redis`

### Tools

#### phpMyAdmin

[phpMyAdmin](https://www.phpmyadmin.net/) is available as part of the global services stack that is deployed to support all of the environments.

Access phpMyAdmin by navigating to [http://localhost:8092](http://localhost:8092).

- Username: `root`
- Password: `password`

#### MailCatcher

[MailCatcher](https://mailcatcher.me/) is available as part of the global services stack that is deployed to support all of the environments. It is preconfigured to catch mail sent from any of the environments created by Air Local Docker.

Access MailCatcher by navigating to [http://localhost:1080](http://localhost:1080).

#### Xdebug

Xdebug is included in the php images and is nearly ready to go out of the box. Make sure your IDE is listening for PHP debug connections and set up a path mapping to your local environment's `web/wp-content/` directory to `/var/www/web/wp-content/` in the container.

##### Visual Studio Code

1. Install the [PHP Debug](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug) extension.
2. In your project, go to the Debug view, click "Add Configuration..." and choose PHP environment. A new launch configuration will be created for you.
3. Set the `pathMappings` parameter to your local `web/wp-content/` directory. Example:

```json
"configurations": [
        {
            "name": "Listen for XDebug",
            "type": "php",
            "request": "launch",
            "port": 9000,
            "pathMappings": {
                "/var/www/web/wp-content": "${workspaceFolder}/web/wp-content",
            }
        }
]
```

## Attribution

https://github.com/10up/wp-local-docker-v2
