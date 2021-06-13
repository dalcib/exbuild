const { getConfig } = require('@expo/config')
const removeFlowPlugin = require('./plugins/removeFlowPlugin')
const assetsPlugin = require('./plugins/assetsPlugin')
const aliasPlugin = require('./plugins/aliasPlugin')
const { getIp, getExtensions, getAssetLoaders, getPolyfills, getPlugins } = require('./utils')

function getConfigs(platform, { port, minify }) {
  const config = {
    web: {
      removeFlowOptions: [],
      aliasOptions: {
        'react-native': 'node_modules/react-native-web/dist/index.js',
        'react-native-vector-icons/MaterialCommunityIcons':
          'node_modules/@expo/vector-icons/MaterialCommunityIcons.js',
        'react-native/Libraries/Components/View/ViewStylePropTypes$':
          'react-native-web/dist/exports/View/ViewStylePropTypes',
        'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
          'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
        'react-native/Libraries/vendor/emitter/EventEmitter$':
          'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
        'react-native/Libraries/vendor/emitter/EventSubscriptionVendor$':
          'react-native-web/dist/vendor/react-native/emitter/EventSubscriptionVendor',
        'react-native/Libraries/EventEmitter/NativeEventEmitter$':
          'react-native-web/dist/vendor/react-native/NativeEventEmitter',
        'react-native/Libraries/Image/AssetSourceResolver$': 'expo-asset/build/AssetSourceResolver',
        'react-native/Libraries/Image/assetPathUtils$': 'expo-asset/build/Image/assetPathUtils',
        'react-native/Libraries/Image/resolveAssetSource$': 'expo-asset/build/resolveAssetSource',
      },
      plugins: [aliasPlugin],
      polyfills: ['setimmediate'],
      esbuildOptions: {
        banner: {
          js: `${
            minify === false
              ? ' (() => new EventSource("/esbuild").onmessage = () => location.reload())();'
              : ''
          }`,
        },
        target: 'es2020',
        format: 'esm',
      },
    },
    native: {
      removeFlowOptions: ['react-native', '@react-native-community/masked-view'],
      aliasOptions: {
        'react-native-vector-icons/MaterialCommunityIcons':
          'node_modules/@expo/vector-icons/MaterialCommunityIcons.js',
      },
      plugins: [removeFlowPlugin, assetsPlugin, aliasPlugin],
      polyfills: [
        './node_modules/react-native/Libraries/polyfills/console.js',
        './node_modules/react-native/Libraries/polyfills/error-guard.js',
        './node_modules/react-native/Libraries/polyfills/Object.es7.js',
        './node_modules/react-native/Libraries/Core/InitializeCore',
      ],
      esbuildOptions: {
        banner: {
          js: `${`var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now()
   var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;`}`,
        },
        target: 'safari11',
        format: 'iife',
      },
    },
    get android() {
      return this.native
    },
    get ios() {
      return this.native
    },
  }

  const projectRoot = process.cwd().replace(/\\/g, '/')
  const ip = getIp()
  const expoConfig = getConfig(process.cwd())
  const assetExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'aac', 'aiff', 'caf', 'm4a', 'mp3',  'wav', 'html', 'pdf', 'yaml', 'yml', 'otf', 'ttf', 'zip'] //prettier-ignore
  const host = `${ip}:${port}`

  /** @typedef {import('esbuild').BuildOptions} BuildOptions  */
  /** @type {BuildOptions} */
  const buildconfig = {
    stdin: {
      contents: `${getPolyfills(config[platform].polyfills)}\nrequire('./${expoConfig.pkg.main}');`,
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
    define: {
      'process.env.JEST_WORKER_ID': 'false',
      'process.env.NODE_DEV': minify ? '"production"' : '"development"',
      __DEV__: minify ? 'false' : 'true',
      global: 'window',
    },
    loader: { ...getAssetLoaders(assetExts), '.js': 'jsx' },
    plugins: getPlugins(config[platform]),
    resolveExtensions: getExtensions(platform),
    ...config[platform].esbuildOptions,
  }

  const initialPage = {
    ...expoConfig.exp,
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
    buildconfig,
    projectRoot,
    ip,
    assetExts,
    initialPage,
    port,
  }
}

module.exports = getConfigs
