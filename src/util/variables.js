const path = require('path')
const rootPath = path.dirname(require.main.filename)
const srcPath = path.join(rootPath, 'src')
const utilPath = path.join(rootPath, 'src/util')
const globalPath = path.join(rootPath, 'global')
const cacheVolume = 'airlocalCache'

module.exports = { rootPath, srcPath, utilPath, cacheVolume, globalPath }
