const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const sizeOf = require('image-size')

const imageExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp']

const assetsPlugin = {
  name: 'assets',
  setup(build) {
    build.onStart(() => {
      console.log('build started')
      console.time('Esbuild Time:')
    })
    build.onEnd((result) => {
      console.log(`build ended with ${result.errors.length} errors`)
      console.timeEnd('Esbuild Time:')
    })
    build.onResolve({ filter: /\.jpg$|\.png$|\.ttf$/ }, (args) =>
      path.parse(args.importer).base === path.parse(args.path + '.ast.js').base
        ? { path: path.resolve(args.resolveDir, args.path), namespace: 'file' }
        : { path: path.resolve(args.resolveDir, args.path) + '.ast.js', namespace: 'assets' }
    )
    build.onLoad({ filter: /.*/, namespace: 'assets' }, (args) => {
      const assetPath = args.path.slice(0, -7)
      const { name, base, ext } = path.parse(assetPath)

      const hasher = crypto.createHash('md5')
      hasher.update(fs.readFileSync(assetPath))
      const hash = hasher.digest('hex')

      const isImage = imageExts.includes(ext)
      let dimensions = {}
      //@ts-ignore
      if (isImage) dimensions = sizeOf(assetPath)

      const contents = `
      const { registerAsset,  getAssetByID } = require('react-native/Libraries/Image/AssetRegistry.js')
      const  resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource.js')
      const file = require('./${base}')
      const asset = registerAsset({
          __packager_asset: true,
          httpServerLocation: '/assets',
          scales: [1],
          hash: '${hash}',
          name: '${name}',
          type:'${ext.slice(1)}',
          fileHashes: ['${hash}'],
        })
      const width = ${dimensions.width}
      const height = ${dimensions.height}
      if (${isImage} && width && height ) { asset.width = width; asset.height = height }
      module.exports = asset
      `
      return { contents, loader: 'js', resolveDir: path.resolve(path.parse(args.path).dir) }
    })
  },
}

module.exports = assetsPlugin
