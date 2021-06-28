const { networkInterfaces } = require('os')
const fs = require('fs')
const path = require('path')
const removeFlowPlugin = require('./plugins/removeFlowPlugin')
const assetsPlugin = require('./plugins/assetsPlugin')
const aliasPlugin = require('./plugins/aliasPlugin')
const patchsPlugin = require('./plugins/patchsPlugin')

/** @return {string} ip */
function getIp() {
  const net = networkInterfaces()
  return Object.keys(net)
    .map((intfs) => net[intfs].find((intf) => intf.family === 'IPv4' && !intf.internal))
    .filter((intf) => !!intf)
    .map((intf) => intf.address)[0]
}

/** @param {'android'|'ios'|'web'} platform */
function setExtensions(platform) {
  const platfExts = [`.${platform}.tsx`, `.${platform}.ts`, `.${platform}.jsx`, `.${platform}.js`]
  const baseExts = ['.tsx', '.ts', '.jsx', '.js', '.json', '.wasm']
  if (platform === 'web') {
    return [...platfExts, ...baseExts]
  } else {
    return [...platfExts, '.native.tsx', '.native.ts', '.native.jsx', '.native.js', ...baseExts]
  }
}

function setPlugins(config, platform, assetExts, cleanCache) {
  return config.plugins.map((plugin) => {
    if (plugin.name === 'removeFlowPlugin') {
      return plugin(config.removeFlowOptions, cleanCache)
    }
    if (plugin.name === 'aliasPlugin') return plugin(config.importMap)
    if (plugin.name === 'assetsPlugin') return plugin(platform, assetExts)
    return plugin
  })
}

function parsePlugins(plugins, platform, assetExts, cleanCache) {
  return plugins.map((plugin) => {
    if (plugin.name === 'exbuildRemoveFlow') return removeFlowPlugin(plugin.params, cleanCache)
    if (plugin.name === 'exbuildAlias') return aliasPlugin(plugin.params)
    if (plugin.name === 'exbuildAssets') return assetsPlugin(platform, assetExts)
    if (plugin.name === 'exbuildPatchs') return patchsPlugin
    return plugin
  })
}

/** @param {string[]} assetExts */
function setAssetLoaders(assetExts) {
  return assetExts.reduce((loaders, ext) => {
    loaders['.' + ext] = 'file'
    return loaders
  }, {})
}

/** @param {string[]} polyfills */
function setPolyfills(polyfills) {
  return polyfills.map((polyfill) => 'require("' + polyfill + '");').join('\n')
}

/** @param {string} dir */
function mkdir(dir) {
  try {
    fs.mkdirSync(dir, '0755')
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e
    }
  }
}

function formatConfig(config) {
  const { cleanCache, plugins, ...conf } = config.platformConfig
  return {
    ...conf,
    esbuildOptions: {
      ...config.buildConfig,
      plugins: config.buildConfig.plugins.map(({ name }) => name + 'Internal'),
    },
  }
}

function readJSON(file) {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.cwd().replace(/\\/g, '/'), file), { encoding: 'utf8' })
  )
}

module.exports = {
  getIp,
  setExtensions,
  setAssetLoaders,
  setPolyfills,
  setPlugins,
  parsePlugins,
  mkdir,
  formatConfig,
  readJSON,
}
