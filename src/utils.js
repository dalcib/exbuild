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

function getExtensions(platform) {
  if (platform === 'web') {
    return [
      `.${platform}.tsx`,
      `.${platform}.ts`,
      `.${platform}.jsx`,
      `.${platform}.js`,
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ]
  }
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

function getPolyfills(polyfills, platform) {
  if (platform === 'web') return ''
  return polyfills.map((polyfill) => 'require("' + polyfill + '");').join('\n')
}

function mkdir(dir) {
  try {
    fs.mkdirSync(dir, '0755')
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e
    }
  }
}

module.exports = { getIp, getExtensions, getAssetLoaders, getPolyfills, mkdir }
