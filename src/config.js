const { getIp, readJSON } = require('./utils')
const { getBuildOptions } = require('./buildOptions')

const ip = getIp()
const projectRoot = process.cwd().replace(/\\/g, '/')
const pkg = readJSON('package.json')
const app = readJSON('app.json')

function getConfigs(platform, { port, minify, cleanCache, liveReload }, platformCustomConfig) {
  const host = `${ip}:${port}`
  console.log(platformCustomConfig)

  const buildOptions = getBuildOptions(platform, minify, pkg.main, platformCustomConfig, cleanCache)

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
    buildOptions,
    initialPage,
    ip,
    port,
    liveReload,
  }
}

module.exports = getConfigs
