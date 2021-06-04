const { networkInterfaces } = require('os')

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
    '.json',
  ]
}

/** @param {string[]} assetExts */
function getAssetLoaders(assetExts) {
  return assetExts.reduce((loaders, ext) => {
    loaders['.' + ext] = 'file'
    return loaders
  }, {})
}

function getPolyfills(polyfills) {
  return polyfills.map((polyfill) => 'require("' + polyfill + '");').join('\n')
}

module.exports = { getIp, getExtensions, getAssetLoaders, getPolyfills }
