const removeFlowPlugin = require('./plugins/removeFlowPlugin')
const assetsPlugin = require('./plugins/assetsPlugin')
const aliasPlugin = require('./plugins/aliasPlugin')
const hacksPlugin = require('./plugins/patchsPlugin')

/** @typedef {import('esbuild').BuildOptions} BuildOptions  */
/** @typedef {import('esbuild').Plugin} Plugin  */
/** @typedef {'web' | 'android' | 'ios'} Platform  */

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

/** @type {{[key in Platform | 'native']?: ExbuildOptions}} */
const config = {
  web: {
    importMap: {
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
    removeFlowOptions: [],
    plugins: [aliasPlugin],
    polyfills: ['setimmediate'],
    jsBanner: [' (() => new EventSource("/esbuild").onmessage = () => location.reload())();'],
    esbuildOptions: {
      target: 'es2020',
      format: 'esm',
    },
  },
  native: {
    importMap: {
      'react-native-vector-icons/': './node_modules/@expo/vector-icons/',
      'react-native-screens': './node_modules/react-native-screens/lib/module/index.native.js',
      /*         'react-native-map-clustering':
      './node_modules/react-native-map-clustering/lib/ClusteredMapView.js',
      '@nex/data/hooks': './data/src/index-hooks.ts',
      '@nex/data': './data/src/index.ts', */
    },
    removeFlowOptions: [
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

const assetExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'aac', 'aiff', 'caf', 'm4a', 'mp3',  'wav', 'html', 'pdf', 'yaml', 'yml', 'otf', 'ttf', 'zip', 'db'] //prettier-ignore

module.exports = { config, assetExts }
