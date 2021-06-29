const { networkInterfaces } = require('os')
const fs = require('fs')
const path = require('path')
const merge = require('deepmerge')
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

/**
 * @typedef {{name: string, params?: object | string[], setup?: any}[]} Plugins
 * @param {Plugins} configPlatformPlugins
 * @param {Plugins} customConfigPlugins
 * @return {Plugins}  */
function mergePlugins(configPlatformPlugins, customConfigPlugins = []) {
  const mergedInternalPlugins = [
    'exbuildAlias',
    'exbuildRemoveFlow',
    'exbuildAssets',
    'exbuildPatchs',
  ]
    .map((name) => {
      const platformConfigPlugin = configPlatformPlugins.find((plugin) => plugin.name === name)
      const customConfigPlugin = customConfigPlugins.find((plugin) => plugin.name === name)
      return merge(platformConfigPlugin || {}, customConfigPlugin || {})
    })
    .filter((plugin) => plugin.name)
  const externalPlugins = customConfigPlugins.filter((plugin) => !plugin.name.startsWith('exbuild'))
  //console.log(mergedInternalPlugins, externalPlugins)
  return [...mergedInternalPlugins, ...externalPlugins]
}
/**
 * @param {Plugins} plugins
 * @param {'web' | 'android' | 'ios'} platform
 * @param {boolean} cleanCache
 */
function setPlugins(plugins, platform, cleanCache) {
  return plugins.map((plugin) => {
    if (plugin.name === 'exbuildRemoveFlow') return removeFlowPlugin(plugin.params, cleanCache)
    if (plugin.name === 'exbuildAlias') return aliasPlugin(plugin.params)
    if (plugin.name === 'exbuildAssets') return assetsPlugin(platform, plugin.params)
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

/** @param {string} file */
function readJSON(file) {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.cwd().replace(/\\/g, '/'), file), { encoding: 'utf8' })
  )
}

module.exports = {
  getIp,
  setExtensions,
  setAssetLoaders,
  setPlugins,
  mergePlugins,
  mkdir,
  readJSON,
}
