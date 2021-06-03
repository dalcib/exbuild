const { networkInterfaces } = require('os')
const { getConfig } = require('@expo/config')

/** @return {string} ip */
function getIp() {
  const net = networkInterfaces()
  return Object.keys(net)
    .map((intfs) => net[intfs].find((intf) => intf.family === 'IPv4' && !intf.internal))
    .filter((intf) => !!intf)
    .map((intf) => intf.address)[0]
}

function getExtensions(platform) {
  return [
    `.${platform}.tsx`,
    `.${platform}.ts`,
    `.${platform}.jsx`,
    `.${platform}.js`,
    '.native.tsx',
    '.native.ts',
    '.native.jsx',
    '.native.js',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
  ]
}

/** @param {string[]} assetExtensions */
function getAssetLoaders(assetExtensions) {
  return assetExtensions.reduce((loaders, ext) => {
    loaders[ext] = 'file'
    return loaders
  }, {})
}

const config = getConfig(process.cwd())

module.exports = { config, getIp, getExtensions, getAssetLoaders }
