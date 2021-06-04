const { resolve } = require('path')
const { getConfig } = require('@expo/config')
const { getIp, getExtensions, getAssetLoaders, getPolyfills } = require('./utils')
const removeFlowPlugin = require('./removeFlowPlugin')
const assetsPlugin = require('./assetsPlugin')

const options = {
  platform: 'web',
  port: 19000,
  minify: false,
  removeFlow: [],
}

const banner = `
var __DEV__=${options.minify};
var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
var global = window, require = function() {};
${
  options.platform === 'web' && options.minify === false
    ? ' (() => new EventSource("/esbuild").onmessage = () => location.reload())();'
    : ''
}
`
const polyfills = [
  './node_modules/react-native/Libraries/polyfills/console.js',
  './node_modules/react-native/Libraries/polyfills/error-guard.js',
  './node_modules/react-native/Libraries/polyfills/Object.es7.js',
  './node_modules/react-native/Libraries/Core/InitializeCore',
]
const projectRoot = process.cwd().replace(/\\/g, '/')
const ip = getIp()
const expoConfig = getConfig(process.cwd())
const assetExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'aac', 'aiff', 'caf', 'm4a', 'mp3',  'wav', 'html', 'pdf', 'yaml', 'yml', 'otf', 'ttf', 'zip'] //prettier-ignore

/** @typedef {import('esbuild').BuildOptions} BuildOptions  */
/** @type {BuildOptions} */
const buildconfig = {
  stdin: {
    contents: `${getPolyfills(polyfills)}\nrequire('./${expoConfig.pkg.main}');`,
    resolveDir: '.',
    sourcefile: 'index.bundle',
    loader: 'js',
  },
  tsconfig: resolve(projectRoot, 'tsconfig.web.json'),
  outfile: `dist/index.bundle`,
  assetNames: 'assets/[name]',
  publicPath: '/',
  target: 'es2016',
  write: true,
  bundle: true,
  sourcemap: true,
  incremental: true,
  loader: { ...getAssetLoaders(assetExts), '.js': 'jsx' },
  banner: {
    js: banner,
  },
  plugins: [removeFlowPlugin, assetsPlugin],
  resolveExtensions: getExtensions(options.platform),
}

const manifest = {
  //sdkVersion: '41.0.0',
  packagerOpts: {
    hostType: 'lan',
    lanType: 'ip',
    devClient: false,
    https: false,
    dev: options.minify,
    minify: options.minify,
  },
  developer: {
    tool: 'esbuild-expo',
    projectRoot,
  },
  mainModuleName: expoConfig.pkg.main,
  bundleUrl: `http://${ip}:${options.port}/index.bundle?platform=${options.platform}&dev=${options.minify}&hot=false&minify=${options.minify}`,
  debuggerHost: `${ip}:${options.port}`,
  hostUri: `${ip}:${options.port}`,
  iconUrl: `http://1${ip}:${options.port}/assets/assets/images/icon.png`,
  isVerified: true,
}

module.exports = {
  buildconfig,
  projectRoot,
  ip,
  assetExts,
  polyfills,
  expoConfig,
  manifest,
  options,
}
