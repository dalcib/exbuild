const fs = require('fs')
const path = require('path')
const flowRemoveTypes = require('flow-remove-types')

let cache = new Map()
let updateCache = false
const cacheFile = './.cache-removed-flow.json'
if (fs.existsSync(cacheFile)) cache = new Map(JSON.parse(fs.readFileSync(cacheFile).toString()))
const packagesRemoveFlow = ((modules) =>
  new RegExp(modules.map((module) => `node_modules[/|\\\\]${module}.*\\.jsx?$`).join('|'), 'g'))([
  'react-native',
  '@react-native-community[/|\\\\]masked-view',
])
const removeFlowPlugin = {
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

module.exports = removeFlowPlugin
