/*
 * Variables:
 *  rootPath     Path to the root of AIRLocal. Every other path is based on this path currently
 *  srcPath      Path to the source code of AIRLocal generator scripts as well as the config files copied to each project
 *  cacheVolume  Named volume that we mount to containers for cache (wp-cli and npm cache)
 *  globalPath   Path to the global container installation. Contains the global docker-compose files
 */

const path = require('path')
const rootPath = path.dirname(require.main.filename)
const srcPath = path.join(rootPath, 'src')
const utilPath = path.join(rootPath, 'src/util')
const globalPath = path.join(rootPath, 'global')
const cacheVolume = 'airlocalCache'

module.exports = { rootPath, srcPath, utilPath, cacheVolume, globalPath }
