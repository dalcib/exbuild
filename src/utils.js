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
function getExtensions(platform) {
  const platfExts = [`.${platform}.tsx`, `.${platform}.ts`, `.${platform}.jsx`, `.${platform}.js`]
  const baseExts = ['.tsx', '.ts', '.jsx', '.js', '.json', '.wasm']
  if (platform === 'web') {
    return [...platfExts, ...baseExts]
  } else {
    return [...platfExts, '.native.tsx', '.native.ts', '.native.jsx', '.native.js', ...baseExts]
  }
}

function getPlugins(config) {
  return config.plugins.map((plugin) => {
    if (plugin.name === 'removeFlowPlugin') return plugin(config.removeFlowOptions)
    if (plugin.name === 'aliasPlugin') return plugin(config.aliasOptions)
    return plugin
  })
}

/** @param {string[]} assetExts */
function getAssetLoaders(assetExts) {
  return assetExts.reduce((loaders, ext) => {
    loaders['.' + ext] = 'file'
    return loaders
  }, {})
}

/** @param {string[]} polyfills */
function getPolyfills(polyfills) {
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

module.exports = { getIp, getExtensions, getAssetLoaders, getPolyfills, getPlugins, mkdir }
