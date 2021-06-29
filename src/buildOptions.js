const merge = require('deepmerge')
const { setExtensions, setAssetLoaders, mergePlugins, setPlugins } = require('./utils')

const assetExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'aac', 'aiff', 'caf', 'm4a', 'mp3',  'wav', 'html', 'pdf', 'yaml', 'yml', 'otf', 'ttf', 'zip', 'db'] //prettier-ignore

/** @typedef {import('esbuild').BuildOptions} BuildOptions  */
/** @typedef {import('esbuild').Plugin} Plugin  */
/** @typedef {{name: string, params?: object | string[]}} ExbPlugin*/
/** @typedef {'web' | 'android' | 'ios'} Platform  */
/** @typedef {BuildOptions | {plugins: ExbPlugin[]}} ExbBuildOptions */

/** @type {{[key in Platform | 'native']?: ExbBuildOptions}} */
const config = {
  web: {
    target: 'es2020',
    format: 'esm',
    inject: ['./node_modules/setimmediate/setImmediate.js'],
    plugins: [
      {
        name: 'exbuildAlias',
        params: {
          'react-native': './node_modules/react-native-web/dist/index.js',
          'react-native-vector-icons/': './node_modules/@expo/vector-icons/',
          'react-native-vector-icons/MaterialCommunityIcons':
            './node_modules/@expo/vector-icons/MaterialCommunityIcons.js',
          'react-native/Libraries/Components/View/ViewStylePropTypes':
            './node_modules/react-native-web/dist/exports/View/ViewStylePropTypes',
          'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter':
            './node_modules/react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
          'react-native/Libraries/vendor/emitter/EventEmitter':
            './node_modules/react-native-web/dist/vendor/react-native/emitter/EventEmitter',
          'react-native/Libraries/vendor/emitter/EventSubscriptionVendor':
            './node_modules/react-native-web/dist/vendor/react-native/emitter/EventSubscriptionVendor',
          'react-native/Libraries/EventEmitter/NativeEventEmitter':
            './node_modules/react-native-web/dist/vendor/react-native/NativeEventEmitter',
          'react-native/Libraries/Image/AssetSourceResolver':
            './node_modules/expo-asset/build/AssetSourceResolver',
          'react-native/Libraries/Image/assetPathUtils':
            './node_modules/expo-asset/build/Image/assetPathUtils',
          'react-native/Libraries/Image/resolveAssetSource':
            './node_modules/expo-asset/build/resolveAssetSource',
          '@react-native-async-storage/async-storage':
            './node_modules/@react-native-async-storage/async-storage/lib/module/index.js',
        },
      },
    ],
  },
  native: {
    inject: [
      './node_modules/react-native/Libraries/polyfills/console.js',
      './node_modules/react-native/Libraries/polyfills/error-guard.js',
      './node_modules/react-native/Libraries/polyfills/Object.es7.js',
      './node_modules/react-native/Libraries/Core/InitializeCore.js',
    ],
    target: 'es2016',
    format: 'iife',
    plugins: [
      {
        name: 'exbuildAlias',
        params: {
          'react-native-vector-icons/': './node_modules/@expo/vector-icons/',
          'react-native-screens': './node_modules/react-native-screens/lib/module/index.native.js',
        },
      },
      {
        name: 'exbuildRemoveFlow',
        params: [
          'react-native',
          '@react-native-community/masked-view',
          'expo-asset-utils',
          '@react-native-picker/picker',
          '@react-native-segmented-control/segmented-control',
          '@react-native-community/datetimepicker',
          '@react-native-async-storage/async-storage',
          'react-native-view-shot',
          'react-native-gesture-handler',
          '@react-native-community/toolbar-android',
        ],
      },
      { name: 'exbuildAssets', params: assetExts },
      { name: 'exbuildPatchs' },
    ],
  },
}

config.android = config.native
config.ios = config.native

/**
 * @param {Platform} platform
 * @param {{minify: boolean, cleanCache: boolean}} Options
 * @param {*} pkg
 * @param {ExbBuildOptions} customConfig
 */
function getBuildOptions(platform, { minify, cleanCache }, pkg, customConfig) {
  /** @type {ExbBuildOptions} */
  const base = {
    entryPoints: [pkg.main],
    outfile: `dist/index.${platform}.js`,
    assetNames: 'assets/[name]',
    publicPath: '/',
    minify,
    write: true,
    bundle: true,
    sourcemap: true,
    incremental: true,
    mainFields: ['react-native', 'browser', 'module', 'main'],
    define: {
      'process.env.JEST_WORKER_ID': 'false',
      'process.env.NODE_DEV': minify ? '"production"' : '"development"',
      __DEV__: minify ? 'false' : 'true',
      global: 'window',
    },
    loader: { ...setAssetLoaders(assetExts), '.js': 'jsx' },
    resolveExtensions: setExtensions(platform),
    banner: { js: '' },
  }

  /** @type {BuildOptions} */
  const buildOptions = merge.all([base, config[platform], customConfig])

  const mergedPlugins = mergePlugins(config[platform].plugins, customConfig.plugins)
  //@ts-ignore
  buildOptions.plugins = setPlugins(mergedPlugins, platform, cleanCache)

  if (platform === 'web' && !minify) {
    buildOptions.banner.js =
      `(() => new EventSource("/esbuild").onmessage = () => location.reload())();\n` +
      buildOptions.banner.js
  }
  if (!(platform === 'web')) {
    buildOptions.banner.js += `\nvar __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now();
var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;`
  }
  return { buildOptions, mergedPlugins }
}

module.exports = getBuildOptions
