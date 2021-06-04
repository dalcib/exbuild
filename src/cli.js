#!/usr/bin/env node

const { writeFileSync, readFileSync } = require('fs')
const { resolve, dirname } = require('path')
const { Command } = require('commander')
const config = require('./config')

const program = new Command()

const pkg = readFileSync(resolve(__dirname, '../package.json'), { encoding: 'utf8' })

program
  .version(JSON.parse(pkg).version, '-v')
  .option('-p, --pages-dir <directory>', 'Directory with the Pages', './pages')
  .option('-d, --dest-dir <directory>', 'Directory of the root navigator', '.')
  .option('-w, --web', 'Replaces Native-stack for Stack and disable react-screens')
  .option('-s, --save-file <File>', 'Save to the specified file')
  .action((options) => {
    require('./server')
    /* const code = generateNavigator(options.pagesDir, options.destDir, options.web)

    if (options.saveFile) {
      writeFileSync(options.saveFile, code)
      console.log('Saved to ', options.saveFile)
    } else {
      console.log(code)
    } */
  })
  .parse(process.argv)

const { loader, plugins, resolveExtensions, ...buildOptions } = config.buildconfig

//console.log(process.cwd(), __dirname, config.options, buildOptions)
