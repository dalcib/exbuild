#!/usr/bin/env node

const { readFileSync } = require('fs')
const { resolve } = require('path')
const { Command } = require('commander')
const getConfigs = require('./config')
const runServer = require('./server')

const platform = process.argv[2]
if (!['android', 'ios', 'web'].includes(platform)) {
  throw Error('platform must be android, ios or web')
}

const program = new Command()
const pkg = readFileSync(resolve(__dirname, '../package.json'), { encoding: 'utf8' })

program
  .version(JSON.parse(pkg).version, '-v')
  .usage('[platform] [options]')
  .arguments('[platform]')
  .option('-p, --port <number>', 'port number', '19000')
  .option('-m, --minify', 'Minify', false)
  .option('-c, --clean-cache', 'Clean cache', false)
  .action((platforn, options) => {
    console.log(platform, options)
    const config = getConfigs(platform, options)
    runServer(platform, config)
  })
  .parse(process.argv)
