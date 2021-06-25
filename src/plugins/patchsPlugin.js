const path = require('path')
const fs = require('fs')

const hacksPlugin = {
  name: 'hacks',
  setup(build) {
    build.onLoad({ filter: /views[\\|/]GestureHandlerNative\.js$/ }, (args) => {
      return replace(args, ', PanGestureHandlerGestureEvent', '')
    })
    build.onLoad(
      { filter: /react-native-maps[\\|/]lib[\\|/]components[\\|/]AnimatedRegion.js$/ },
      (args) => {
        return replace(
          args,
          `AnimatedWithChildren.name !== 'AnimatedWithChildren'`,
          `!AnimatedWithChildren.name.startsWith('AnimatedWithChildren')`
        )
      }
    )
  },
}

function replace(args, remove, include) {
  const relpath = path.relative(process.cwd(), args.path)
  const source = fs.readFileSync(relpath, 'utf8')
  return { contents: source.replace(remove, include) }
}

module.exports = hacksPlugin
