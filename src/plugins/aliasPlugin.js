const path = require('path')
const { resolve } = require('deno-importmap')

function aliasPlugin(alias) {
  const importMap = { imports: alias }

  return {
    name: 'alias',
    setup(build) {
      build.onStart(() => {
        console.log('build started')
        console.time('Esbuild Time:')
      })
      build.onEnd((result) => {
        console.log(`build ended with ${result.errors.length} errors`)
        console.timeEnd('Esbuild Time:')
      })

      build.onResolve({ filter: /.*/ }, (args) => {
        const resolvedPath = resolve(args.path, importMap)
        //if (args.path.match(/react-native-screens/)) console.log(args.path, resolvedPath, importMap)
        if (args.path === resolvedPath) return
        return { path: require.resolve(path.resolve(resolvedPath)) }
      })
    },
  }
}

module.exports = aliasPlugin
