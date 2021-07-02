#!/usr/bin/env node

const { readFileSync } = require('fs')
const { resolve } = require('path')
const { Command, Argument } = require('commander')
const getInitialPageManifest = require('./initialPageManifest')
const getBuildOptions = require('./buildOptions')
const runServer = require('./server')
const { create, init } = require('./init')

const program = new Command()
const pkg = readFileSync(resolve(__dirname, '../package.json'), { encoding: 'utf8' })
const processRoot = process.cwd().replace(/\\/g, '/')

program
  .name('exbuild') //@ts-ignore
  .version(JSON.parse(pkg).version, '-v')
  .usage('<android | ios | web | init> [options]')
  .addArgument(
    new Argument(
      '<platform>',
      'use < android | ios | web > to start the application in dev mode, or < init > to create a new project'
    ).choices(['android', 'ios', 'web', 'init'])
  )
  //.arguments('<platform>')
  .option('-p, --port <number>', 'port number', '19000')
  .option('-m, --minify', 'Minify', false)
  .option('-c, --clean-cache', 'Clean cache', false)
  .option('-r, --live-reload', 'Live reload', true)
  .option('-n, --print-config', 'Print internal config', false)
  .option('-f, --config-file <path>', 'Path to a config file')
  .action((platform, options) => {
    if (platform === 'init') {
      create()
      return
    }

    /*    if (!['android', 'ios', 'web'].includes(platform)) {
      console.log('Usage: exbuild <platform> [options]')
      console.log("error: <platform> must be 'android', 'ios' or 'web'")
      process.exit()
    } */

    let platformCustomConfig = {}
    if (options.configFile) {
      try {
        const customConfig = require(require.resolve(processRoot + '/' + options.configFile))
        platformCustomConfig = customConfig[platform] || {}
      } catch (e) {
        console.log(e, 'error: The path for the config file is invalid')
      }
    }

    console.log(platform, options)
    const { ip, projectRoot, pkg, app } = init(platform)
    const initialPageManifest = getInitialPageManifest(platform, options, ip, app, pkg, projectRoot)
    const { buildOptions, mergedPlugins } = getBuildOptions(
      platform,
      options,
      pkg,
      platformCustomConfig
    )

    if (options.printConfig) {
      console.log(
        JSON.stringify(
          {
            ...buildOptions,
            plugins: mergedPlugins,
          },
          null,
          2
        )
      )
    }

    runServer(
      {
        platform,
        buildOptions,
        initialPageManifest,
        ip,
      },
      options
    )
  })
  .parse(process.argv)
