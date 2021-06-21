const { resolve } = require('path')

function aliasPlugin(options) {
  const projectRoot = process.cwd().replace(/\\/g, '/')
  const regexp = new RegExp(
    `^${Object.keys(options)
      .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('$|^')}$`
  )

  return {
    name: 'alias',
    setup(build) {
      build.onResolve({ filter: regexp }, (args) => {
        let newPath
        try {
          newPath = require.resolve(options[args.path], {
            paths: [process.cwd()],
          })
        } catch (error) {
          newPath = resolve(projectRoot, options[args.path])
        }
        return { path: newPath }
      })
    },
  }
}

module.exports = aliasPlugin
