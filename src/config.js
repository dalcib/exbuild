const fs = require('fs')
const path = require('path')
const merge = require('deepmerge')
const { getIp, setExtensions, setAssetLoaders, setPlugins, readJSON } = require('./utils')
const { config, assetExts } = require('./defaultConf')

const ip = getIp()
const projectRoot = process.cwd().replace(/\\/g, '/')
const pkg = readJSON('package.json')
const app = readJSON('app.json')

/**
 * @param {'web' | 'android' | 'ios'} platform
 * @param {{ port: string, minify: boolean, cleanCache: boolean, liveReload: boolean}} config
 * @param {*} platformCustomConfig
 */
function getConfigs(platform, { port, minify, cleanCache, liveReload }, platformCustomConfig) {
  const host = `${ip}:${port}`
  console.log(platformCustomConfig)
  const platformConfig = merge(config[platform], platformCustomConfig)

  /** @type {import('esbuild').BuildOptions} BuildOptions */
  const buildConfig = merge(
    {
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
      plugins: setPlugins(platformConfig, platform, assetExts, cleanCache),
      resolveExtensions: setExtensions(platform),
      banner: { js: '' },
    },
    platformConfig.esbuildOptions
  )

  if (platform === 'web' && !minify) {
    buildConfig.banner.js += `\n(() => new EventSource("/esbuild").onmessage = () => location.reload())();`
  }
  if (!(platform === 'web')) {
    buildConfig.banner.js += `\nvar __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now();
var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;`
  }

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
