#!/usr/bin/env node

const { existsSync, readFileSync, copyFileSync } = require('fs')
const { resolve } = require('path')
const { Command } = require('commander')
const getConfigs = require('./config')
const runServer = require('./server')
const { mkdir } = require('./utils')

const program = new Command()
const pkg = readFileSync(resolve(__dirname, '../package.json'), { encoding: 'utf8' })

program
  .name('exbuild')
  .version(JSON.parse(pkg).version, '-v')
  .usage('<android | ios | web> [options]')
  .arguments('<platform>')
  .option('-p, --port <number>', 'port number', '19000')
  .option('-m, --minify', 'Minify', false)
  .option('-c, --clean-cache', 'Clean cache', false)
  .option('-r, --live-reload', 'Live reload', true)
  .option('-n, --print-config', 'Print internal config', false)
  .option('-f, --config-file <path>', 'Path to a config file')
  .action((platform, options) => {
    if (!['android', 'ios', 'web'].includes(platform)) {
      console.log('Usage: exbuild <platform> [options]')
      console.log("error: <platform> must be 'android', 'ios' or 'web'")
      process.exit()
    }
    console.log(platform, options)
    init(platform)
    const config = getConfigs(platform, options)
    if (options.printConfig) {
      console.log(formatConfig(config))
    }
    runServer(platform, config)
  })
  .parse(process.argv)

function init(platform) {
  const projectRoot = process.cwd().replace(/\\/g, '/')
  if (!existsSync(projectRoot + '/dist/index.html') && platform === 'web') {
    copyFileSync(resolve(__dirname, './../index.html'), projectRoot + '/dist/index.html')
  }
  if (platform !== 'web') {
    mkdir(projectRoot + '/.expo')
    mkdir(projectRoot + '/.expo/esbuild')
    mkdir(projectRoot + '/.expo/esbuild/cache')
  }
}

function formatConfig(config) {
  const { cleanCache, plugins, polyfills, ...conf } = config.platformConfig
  return {
    ...conf,
    esbuildOptions: {
      ...config.buildConfig,
      plugins: config.buildConfig.plugins.map(({ name }) => name),
    },
  }
}
