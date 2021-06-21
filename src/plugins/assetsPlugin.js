const path = require('path')
//const fs = require('fs')
//onst crypto = require('crypto')
//const sizeOf = require('image-size')
const { getAssetData } = require('metro/src/Assets')

function camelize(text) {
  text = text.replace(/[-_\s.@]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
  return text.substr(0, 1).toLowerCase() + text.substr(1)
}

const imageExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'heic']

const filter = new RegExp(imageExts.map((ext) => `\.${ext}$`).join('|'))

function assetsPlugin(platform) {
  return {
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
      build.onResolve({ filter }, (args) => {
        let assetFile
        try {
          assetFile = require.resolve(args.path, {
            paths: [process.cwd()],
          })
        } catch (e) {
          assetFile = path.resolve(args.resolveDir, args.path)
        }
        assetFile = assetFile.replace(/\\/g, '/')
        if (path.parse(args.importer).base === path.parse(args.path + '.ast.js').base) {
          return { path: assetFile, namespace: 'file' }
        }
        return { path: assetFile + '.ast.js', namespace: 'assets' }
      })
      build.onLoad({ filter: /.*/, namespace: 'assets' }, async (args) => {
        const assetPath = args.path.slice(0, -7).replace(/\\/g, '/')

        const asset = await getAssetData(
          assetPath,
          path.basename(assetPath),
          [require.resolve('expo-asset/tools/hashAssetFiles')],
          platform,
          '/assets'
        )

        const contents = `
  const { registerAsset } = require('react-native/Libraries/Image/AssetRegistry.js')
  ${asset.files
    .map(
      (file) => `const ${camelize(path.parse(file).name)} = require('${file.replace(/\\/g, '/')}')`
    )
    .join('\n')}\n
  const asset = registerAsset(${JSON.stringify(asset, null, 6)})
  module.exports = asset
  `
        return { contents, loader: 'js', resolveDir: path.resolve(path.parse(args.path).dir) }
      })
    },
  }
}

module.exports = assetsPlugin

/*         if (name === 'user' || name === 'exponent-icon' || name === 'chapeau')
  console.log(assetPath, contents) //, JSON.stringify(asset, null, 2)) */
/*       const hasher = crypto.createHash('md5')
          hasher.update(fs.readFileSync(assetPath))
          const hash = hasher.digest('hex')
    
          const isImage = imageExts.includes(ext)
          let dimensions = {}
          //@ts-ignore
          if (isImage) dimensions = sizeOf(assetPath) */

/*       const contents = `
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
` */
