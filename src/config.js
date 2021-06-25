const { getConfig } = require('@expo/config')
const merge = require('deepmerge')
const removeFlowPlugin = require('./plugins/removeFlowPlugin')
const assetsPlugin = require('./plugins/assetsPlugin')
const aliasPlugin = require('./plugins/aliasPlugin')
const hacksPlugin = require('./plugins/hacksPlugin')
const { getIp, setExtensions, setAssetLoaders, setPolyfills, setPlugins } = require('./utils')

/** @typedef {import('esbuild').BuildOptions} BuildOptions  */
/** @typedef {import('esbuild').Plugin} Plugin  */
/** @typedef {'web' | 'android' | 'ios'} Platform  */
/** @typedef {Platform | 'native'} PlatformPlus  */

/**
 * @typedef ExbuildOptions
 * @property {boolean} [cleanCache]
 * @property {string[]} [removeFlowOptions]
 * @property {{[alias: string]: string}} [importMap]
 * @property {(Plugin | (()=>Plugin))[]} [plugins]
 * @property {string[]} [polyfills]
 * @property {string[]} [jsBanner]
 * @property {BuildOptions} [esbuildOptions]
 */

/**
 * @typedef Config
 * @property {string} port
 * @property {boolean} minify
 * @property {boolean} cleanCache
 * @property {boolean} liveReload
 * @property {string} configFile
 *
 * @param {Platform} platform
 * @param {Config} config
 */
function getConfigs(platform, { port, minify, cleanCache, liveReload, configFile }) {
  /** @type {{[key in Platform | 'native']?: ExbuildOptions}} */
  const config = {
    web: {
      cleanCache,
      removeFlowOptions: [],
      importMap: {
        'react-native': './node_modules/react-native-web/dist/index.js',
        'react-native-vector-icons/': './node_modules/@expo/vector-icons/',
        'react-native-vector-icons/MaterialCommunityIcons':
          './node_modules/@expo/vector-icons/MaterialCommunityIcons.js',
        'react-native/Libraries/Components/View/ViewStylePropTypes/':
          './node_modules/react-native-web/dist/exports/View/ViewStylePropTypes/',
        'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter/':
          './node_modules/react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter/',
        'react-native/Libraries/vendor/emitter/EventEmitter/':
          './node_modules/react-native-web/dist/vendor/react-native/emitter/EventEmitter/',
        'react-native/Libraries/vendor/emitter/EventSubscriptionVendor/':
          './node_modules/react-native-web/dist/vendor/react-native/emitter/EventSubscriptionVendor/',
        'react-native/Libraries/EventEmitter/NativeEventEmitter/':
          './node_modules/react-native-web/dist/vendor/react-native/NativeEventEmitter/',
        'react-native/Libraries/Image/AssetSourceResolver/':
          './node_modules/expo-asset/build/AssetSourceResolver/',
        'react-native/Libraries/Image/assetPathUtils/': 'expo-asset/build/Image/assetPathUtils/',
        'react-native/Libraries/Image/resolveAssetSource/': 'expo-asset/build/resolveAssetSource/',
      },
      plugins: [aliasPlugin],
      polyfills: ['setimmediate'],
      jsBanner: [
        `${
          minify === false
            ? ' (() => new EventSource("/esbuild").onmessage = () => location.reload())();'
            : ''
        }`,
      ],
      esbuildOptions: {
        target: 'es2020',
        format: 'esm',
      },
    },
    native: {
      cleanCache,
      removeFlowOptions: [
        'react-native',
        '@react-native-community/masked-view',
        //'expo-asset-utils',
        '@react-native-picker/picker',
        '@react-native-segmented-control/segmented-control',
        '@react-native-community/datetimepicker',
        '@react-native-async-storage/async-storage',
        'react-native-view-shot',
        'react-native-gesture-handler',
        '@react-native-community/toolbar-android',
      ],
      importMap: {
        'react-native-vector-icons/': './node_modules/@expo/vector-icons/',
        'react-native-screens': './node_modules/react-native-screens/lib/module/index.native.js',
        /*         'react-native-map-clustering':
          './node_modules/react-native-map-clustering/lib/ClusteredMapView.js',
        '@nex/data/hooks': './data/src/index-hooks.ts',
        '@nex/data': './data/src/index.ts', */
      },
      plugins: [hacksPlugin, removeFlowPlugin, assetsPlugin, aliasPlugin],
      polyfills: [
        './node_modules/react-native/Libraries/polyfills/console.js',
        './node_modules/react-native/Libraries/polyfills/error-guard.js',
        './node_modules/react-native/Libraries/polyfills/Object.es7.js',
        './node_modules/react-native/Libraries/Core/InitializeCore',
      ],
      jsBanner: [
        `var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now()`,
        `var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;`,
      ],
      esbuildOptions: {
        target: 'es2016',
        format: 'iife',
      },
    },
  }

  config.android = config.native
  config.ios = config.native

  const projectRoot = process.cwd().replace(/\\/g, '/')
  const ip = getIp()
  const expoConfig = getConfig(process.cwd())
  const assetExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'aac', 'aiff', 'caf', 'm4a', 'mp3',  'wav', 'html', 'pdf', 'yaml', 'yml', 'otf', 'ttf', 'zip', 'db'] //prettier-ignore
  const host = `${ip}:${port}`

  /** @type { ExbuildOptions} */
  let platformConfig
  if (configFile) {
    try {
      const customConfig = require(require.resolve(projectRoot + '/' + configFile))
      platformConfig = customConfig[platform]
        ? merge(config[platform], customConfig[platform])
        : config[platform]
    } catch (e) {
      console.log(e, 'error: The path for the config file is invalid')
    }
  } else {
    platformConfig = config[platform]
  }

  /** @type {BuildOptions} */
  const buildConfig = merge(
    {
      stdin: {
        contents: `${setPolyfills(platformConfig.polyfills)}\nrequire('./${expoConfig.pkg.main}');`,
        resolveDir: '.',
        sourcefile: `index.${platform}.js`,
        loader: 'js',
      },
      outfile: `dist/index.${platform}.js`,
      assetNames: 'assets/[name]',
      publicPath: '/',
      minify,
      write: true,
      bundle: true,
      sourcemap: true,
      incremental: true,
      //tsconfig: 'tsconfig.json',
      mainFields: ['react-native', 'browser', 'module', 'main'],
      define: {
        'process.env.JEST_WORKER_ID': 'false',
        'process.env.NODE_DEV': minify ? '"production"' : '"development"',
        __DEV__: minify ? 'false' : 'true',
        global: 'window',
      },
      loader: { ...setAssetLoaders(assetExts), '.js': 'jsx', '.lazy': 'json' },
      plugins: setPlugins(platformConfig, platform, assetExts),
      resolveExtensions: setExtensions(platform),
      banner: { js: '' },
    },
    platformConfig.esbuildOptions
  )

  buildConfig.banner.js += config[platform].jsBanner.join('\n')

  const initialPage = {
    ...expoConfig.exp,
    appOwnership: 'expo',
    packagerOpts: {
      hostType: 'lan',
      lanType: 'ip',
      devClient: false,
      https: false,
      dev: !minify,
      minify,
    },
    developer: {
      tool: 'esbuild-expo',
      projectRoot,
    },
    mainModuleName: expoConfig.pkg.main,
    bundleUrl: `http://${host}/index.${platform}.js?platform=${platform}&dev=${!minify}&hot=false&minify=${minify}`,
    debuggerHost: `${host}`,
    hostUri: `${host}`,
    iconUrl: `http://1${host}/assets/assets/images/icon.png`,
    isVerified: true,
  }

  return {
    platform,
    buildConfig,
    initialPage,
    ip,
    port,
    liveReload,
    platformConfig,
    assetExts,
  }
}

module.exports = getConfigs
