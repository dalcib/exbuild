const fs = require('fs')
const path = require('path')
const merge = require('deepmerge')
/* const removeFlowPlugin = require('./plugins/removeFlowPlugin')
const assetsPlugin = require('./plugins/assetsPlugin')
const aliasPlugin = require('./plugins/aliasPlugin')
const hacksPlugin = require('./plugins/patchsPlugin') */
const { getIp, setExtensions, setAssetLoaders, setPolyfills, setPlugins } = require('./utils')
const { config, assetExts } = require('./defaultConfig')

const ip = getIp()
const projectRoot = process.cwd().replace(/\\/g, '/')
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(projectRoot, 'package.json'), { encoding: 'utf8' })
)
const app = JSON.parse(fs.readFileSync(path.resolve(projectRoot, 'app.json'), { encoding: 'utf8' }))

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 * @typedef {'web' | 'android' | 'ios'} Platform
 *
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
  const host = `${ip}:${port}`

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
  platformConfig.cleanCache = cleanCache

  /** @type {BuildOptions} */
  const buildConfig = merge(
    {
      stdin: {
        contents: `${setPolyfills(platformConfig.polyfills)}\nrequire('./${pkg.main}');`,
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
      mainFields: ['react-native', 'browser', 'module', 'main'],
      define: {
        'process.env.JEST_WORKER_ID': 'false',
        'process.env.NODE_DEV': minify ? '"production"' : '"development"',
        __DEV__: minify ? 'false' : 'true',
        global: 'window',
      },
      loader: { ...setAssetLoaders(assetExts), '.js': 'jsx' },
      plugins: setPlugins(platformConfig, platform, assetExts),
      resolveExtensions: setExtensions(platform),
      banner: { js: '' },
    },
    platformConfig.esbuildOptions
  )

  if (!(minify && platform === 'web')) buildConfig.banner.js += config[platform].jsBanner.join('\n')

  const initialPage = {
    ...{
      ...{
        _internal: {
          isDebug: false,
          projectRoot,
          dynamicConfigPath: null,
          staticConfigPath: projectRoot + '/app.json',
          packageJsonPath: projectRoot + '/package.json',
        },
        description: undefined,
        sdkVersion: '41.0.0',
        platforms: ['ios', 'android', 'web'],
      },
      ...app.expo,
    },
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
    mainModuleName: pkg.main,
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
