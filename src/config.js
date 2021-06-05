const { getConfig } = require('@expo/config')
const removeFlowPlugin = require('./plugins/removeFlowPlugin')
const assetsPlugin = require('./plugins/assetsPlugin')
const aliasPlugin = require('./plugins/aliasPlugin')
const { getIp, getExtensions, getAssetLoaders, getPolyfills } = require('./utils')

const projectRoot = process.cwd().replace(/\\/g, '/')

const options = {
  platform: 'android',
  port: 19000,
  minify: false,
  removeFlow: ['react-native', '@react-native-community/masked-view'],
  aliasWeb: { 'react-native': projectRoot + '/node_modules/react-native-web/dist/index.js' },
}
const platform = options.platform
const minify = options.minify
const dev = minify ? 'false' : 'true'

const webPlugins = [removeFlowPlugin(options.removeFlow), aliasPlugin(options.aliasWeb)]
const nativePlugins = [removeFlowPlugin(options.removeFlow), assetsPlugin]

const banner = `${
  platform !== 'web'
    ? `var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now()
   var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;`
    : minify === false
    ? ' (() => new EventSource("/esbuild").onmessage = () => location.reload())();'
    : ''
}`
/*   `
var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now(),__DEV__=true,process=this.process||{};process.env=process.env||{};process.env.NODE_ENV=process.env.NODE_ENV||"development";
var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
var global = window, require = function() {};
` */

const polyfills = [
  './node_modules/react-native/Libraries/polyfills/console.js',
  './node_modules/react-native/Libraries/polyfills/error-guard.js',
  './node_modules/react-native/Libraries/polyfills/Object.es7.js',
  './node_modules/react-native/Libraries/Core/InitializeCore',
]
const ip = getIp()
const expoConfig = getConfig(process.cwd())
const assetExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'aac', 'aiff', 'caf', 'm4a', 'mp3',  'wav', 'html', 'pdf', 'yaml', 'yml', 'otf', 'ttf', 'zip'] //prettier-ignore
const host = `${ip}:${options.port}`

/** @typedef {import('esbuild').BuildOptions} BuildOptions  */
/** @type {BuildOptions} */
const buildconfig = {
  stdin: {
    contents: `${getPolyfills(polyfills, platform)}\nrequire('./${expoConfig.pkg.main}');`,
    resolveDir: '.',
    sourcefile: `index.${platform}.js`,
    loader: 'js',
  },
  outfile: `dist/index.${platform}.js`,
  assetNames: 'assets/[name]',
  publicPath: '/',
  target: platform === 'web' ? 'es2020' : 'es2016',
  format: platform === 'web' ? 'esm' : 'iife',
  minify,
  write: true,
  bundle: true,
  sourcemap: true,
  incremental: true,
  define: {
    'process.env.JEST_WORKER_ID': 'false',
    'process.env.NODE_DEV': minify ? '"production"' : '"development"',
    __DEV__: dev,
    global: 'window',
  },
  loader: { ...getAssetLoaders(assetExts), '.js': 'jsx' },
  plugins: platform === 'web' ? webPlugins : nativePlugins,
  resolveExtensions: getExtensions(platform),
  banner: {
    js: banner,
  },
}

const manifest = {
  packagerOpts: {
    hostType: 'lan',
    lanType: 'ip',
    devClient: false,
    https: false,
    dev,
    minify,
  },
  developer: {
    tool: 'esbuild-expo',
    projectRoot,
  },
  mainModuleName: expoConfig.pkg.main,
  bundleUrl: `http://${host}/index.${platform}.js?platform=${platform}&dev=${dev}&hot=false&minify=${minify}`,
  debuggerHost: `${host}`,
  hostUri: `${host}`,
  iconUrl: `http://1${host}/assets/assets/images/icon.png`,
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
