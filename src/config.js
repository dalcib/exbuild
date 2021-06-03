const { config, getIp, getExtensions, getAssetLoaders } = require('./utils')
const removeFlowPlugin = require('./removeFlowPlugin')
const assetsPlugin = require('./assetsPlugin')

/** @typedef {import('esbuild').BuildOptions} BuildOptions  */

const platform = 'android'
const port = 19000
const imageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp']
const assetExtensions = ['.ttf', ...imageExtensions]
const projectRoot = process.cwd().replace(/\\/g, '/')
const ip = getIp()

const banner = `
var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now(),__DEV__=true,process=this.process||{};process.env=process.env||{};process.env.NODE_ENV=process.env.NODE_ENV||"development";
var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
var global = window, require = function() {};
`

/**/ const polyfills = [
  './node_modules/react-native/Libraries/polyfills/console.js',
  './node_modules/react-native/Libraries/polyfills/error-guard.js',
  './node_modules/react-native/Libraries/polyfills/Object.es7.js',
  './node_modules/react-native/Libraries/Core/InitializeCore',
]

const stdinContent = `${polyfills.map((polyfill) => 'require(' + polyfills + ');').join()}
require('./${config.pkg.main}');`

/** @type {BuildOptions} */
const buildconfig = {
  stdin: {
    contents: stdinContent,
    resolveDir: '.',
    sourcefile: 'index.bundle',
    loader: 'js',
  }, ///
  outfile: `dist/index.bundle`, ///
  //target: 'es6',
  write: true, ///
  bundle: true, ///
  plugins: [removeFlowPlugin, assetsPlugin],
  loader: { ...getAssetLoaders(assetExtensions), '.js': 'jsx' },
  banner: {
    js: banner,
  },
  resolveExtensions: getExtensions(), ///
  sourcemap: true,
  assetNames: 'assets/[name]',
  publicPath: '/',
}

module.exports = {
  buildconfig,
  port,
  projectRoot,
  ip,
  platform,
  imageExtensions,
  assetExtensions,
  polyfills,
}
