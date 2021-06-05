const fs = require('fs')
const path = require('path')
const flowRemoveTypes = require('flow-remove-types')
const { mkdir } = require('./../utils')

const projectRoot = process.cwd().replace(/\\/g, '/')

let cache = new Map()
let updateCache = false
mkdir(projectRoot + '/.expo')
mkdir(projectRoot + '/.expo/esbuild')
mkdir(projectRoot + '/.expo/esbuild/cache')
const cacheFile = projectRoot + '/.expo/esbuild/cache/removed-flow.json'

if (fs.existsSync(cacheFile)) cache = new Map(JSON.parse(fs.readFileSync(cacheFile).toString()))

function removeFlowPlugin(modules) {
  const packagesRemoveFlow = new RegExp(
    modules
      .map((module) => module.replace(/\\/g, '/'))
      .map((module) => module.replace(/\//g, '[/|\\\\]'))
      .map((module) => `node_modules[/|\\\\]${module}.*\\.jsx?$`)
      .join('|'),
    'g'
  )

  return {
    name: 'createFlowRemoveTypesPlugin',
    setup(build) {
      build.onLoad({ filter: packagesRemoveFlow, namespace: 'file' }, async (args) => {
        const relpath = path.relative(process.cwd(), args.path)
        const cacheResult = cache.get(relpath)
        if (cacheResult) {
          return { contents: cacheResult, loader: 'jsx' }
        }
        const source = fs.readFileSync(relpath, 'utf8')
        const output = flowRemoveTypes(/* '// @flow\n' + */ source, {
          pretty: false,
          all: true,
          ignoreUninitializedFields: true,
        })
        const contents = output.toString().replace(/static\s+\+/g, 'static ')
        cache.set(relpath, contents)
        updateCache = true
        return { contents, loader: 'jsx' }
      })
      build.onEnd(() => {
        if (updateCache) fs.writeFileSync(cacheFile, JSON.stringify([...cache.entries()]))
      })
    },
  }
}

module.exports = removeFlowPlugin
