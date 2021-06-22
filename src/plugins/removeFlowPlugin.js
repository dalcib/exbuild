const fs = require('fs')
const path = require('path')
const flowRemoveTypes = require('flow-remove-types')

const projectRoot = process.cwd().replace(/\\/g, '/')

let cache = new Map()
let updateCache = false
const cacheFile = projectRoot + '/.expo/esbuild/cache/removed-flow.json'

function removeFlowPlugin(modules, cleanCache) {
  if (fs.existsSync(cacheFile) && !cleanCache)
    cache = new Map(JSON.parse(fs.readFileSync(cacheFile).toString()))

  const packagesRemoveFlow = new RegExp(
    modules
      .map((module) => module.replace(/\\/g, '/'))
      .map((module) => module.replace(/\//g, '[/|\\\\]'))
      .map((module) => `node_modules[/|\\\\]${module}.*\\.jsx?$`)
      .join('|'),
    'g'
  )

  return {
    name: 'removeFlow',
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
