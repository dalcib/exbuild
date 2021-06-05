function aliasPlugin(options) {
  const regexp = new RegExp(
    `^${Object.keys(options)
      .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')}$`
  )

  return {
    name: 'alias',
    setup(build) {
      build.onResolve({ filter: regexp }, (args) => {
        return { path: options[args.path] }
      })
    },
  }
}

module.exports = aliasPlugin
