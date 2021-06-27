#!/usr/bin/env node

const { existsSync, readFileSync, copyFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')
const { Command } = require('commander')
const getConfigs = require('./config')
const runServer = require('./server')
const { initProject, initDist } = require('./init')
const { formatConfig } = require('./utils')

const program = new Command()
const pkg = readFileSync(resolve(__dirname, '../package.json'), { encoding: 'utf8' })

program
  .name('exbuild')
  .version(JSON.parse(pkg).version, '-v')
  .usage('<android | ios | web | init> [options]')
  .arguments('<platform>')
  .option('-p, --port <number>', 'port number', '19000')
  .option('-m, --minify', 'Minify', false)
  .option('-c, --clean-cache', 'Clean cache', false)
  .option('-r, --live-reload', 'Live reload', true)
  .option('-n, --print-config', 'Print internal config', false)
  .option('-f, --config-file <path>', 'Path to a config file')
  .option('-i, --init', 'Create a basic projet')
  .action((platform, options) => {
    if (platform === 'init') {
      initProject()
    } else {
      if (!['android', 'ios', 'web'].includes(platform)) {
        console.log('Usage: exbuild <platform> [options]')
        console.log("error: <platform> must be 'android', 'ios' or 'web'")
        process.exit()
      }
      console.log(platform, options)
      initDist(platform)

      let platformCustomConfig = {}
      if (options.configFile) {
        try {
          const customConfig = require(require.resolve(
            process.cwd().replace(/\\/g, '/') + '/' + options.configFile
          ))
          platformCustomConfig = customConfig[platform] || {}
          console.log(customConfig, platformCustomConfig)
        } catch (e) {
          console.log(e, 'error: The path for the config file is invalid')
        }
      }

      const config = getConfigs(platform, options, platformCustomConfig)
      if (options.printConfig) {
        console.log(formatConfig(config))
      }

      runServer(platform, config)
    }
  })
  .parse(process.argv)
