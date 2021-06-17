const path = require('path')
const fs = require('fs')

const hacksPlugin = {
  name: 'alias',
  setup(build) {
    build.onLoad({ filter: /views[\\|/]GestureHandlerNative\.js$/ }, (args) => {
      const relpath = path.relative(process.cwd(), args.path)
      const source = fs.readFileSync(relpath, 'utf8')
      return { contents: source.replace(', PanGestureHandlerGestureEvent', '') }
    })
  },
}

module.exports = hacksPlugin
