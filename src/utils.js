const { networkInterfaces } = require('os')
const fs = require('fs')

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

function setPlugins(config, platform, assetExts) {
  return config.plugins.map((plugin) => {
    if (plugin.name === 'removeFlowPlugin') {
      return plugin(config.removeFlowOptions, config.cleanCache)
    }
    if (plugin.name === 'aliasPlugin') return plugin(config.importMap)
    if (plugin.name === 'assetsPlugin') return plugin(platform, assetExts)
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

module.exports = { getIp, setExtensions, setAssetLoaders, setPolyfills, setPlugins, mkdir }
