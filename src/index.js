const http = require('http')
const { config } = require('./utils')
const { buildconfig, port, projectRoot, ip, platform } = require('./config')
const esbuild = require('esbuild')
const { createDevServerMiddleware } = require('@react-native-community/cli-server-api')
const qrcode = require('qrcode-terminal')

let reload
const watch = {
  onRebuild(error, result) {
    if (error) {
      console.error('watch build failed:', error)
      throw error
    }
    console.log(
      `rebuild succeeded. errors: ${result.errors.length}, warnings: ${result.warnings.length}`
    )
    reload()
  },
}

esbuild.build({ ...buildconfig, watch }).catch((err) => {
  console.error(err?.message)
  process.exit(1)
})

esbuild
  .serve({ servedir: './dist' /* , onRequest: (args) => {} */ }, {})
  .then((esbuilldServer) => {
    console.log('Esbuild Server started')
  })
  .catch((err) => {
    console.error(err?.message)
    process.exit(1)
  })

qrcode.generate(`exp://${ip}:${port}`, (code) =>
  console.log(
    `${code.replace(/^(?!\s*$)/gm, ' ')}\n`,
    ` › Waiting on exp://${ip}:${port}\n › Scan the QR code above with Expo Go (Android) or the Cameo (Android) or the Camera app (iOS)`
  )
)

function manifestMiddleware(req, res, next) {
  const pkgOpt = {
    hostType: 'lan',
    lanType: 'ip',
    devClient: false,
    dev: true,
    minify: false,
    https: false,
  }
  const manifest = {
    developer: {
      tool: 'esbuild-cli', //'expo-cli',
      projectRoot,
    },
    packagerOpts: pkgOpt,
    mainModuleName: config.pkg.main,
    bundleUrl: `http://${ip}:${port}/index.bundle?platform=${platform}&dev=${pkgOpt.dev}&hot=false&minify=${pkgOpt.minify}`,
    debuggerHost: `${ip}:${port}`,
    hostUri: `${ip}:${port}`,
    iconUrl: `http://1${ip}:${port}/assets/assets/images/icon.png`,
    isVerified: true,
  }
  if (req.url === '/') {
    //res.setHeader('Content-Type', 'text/html')
    res.end(JSON.stringify({ ...config.exp, ...manifest }))
  } else {
    next()
  }
}

const esbuildMiddleware = (req, res, next) => {
  const url = req.url.split('?')[0]
  if (url === '/logs') res.end()
  if (url === '/') return next()
  const proxyReq = http.request(
    `http://0.0.0.0:8000${url}`,
    { method: req.method, headers: req.headers },
    (proxyRes) => {
      console.log(req.url, proxyRes.statusCode, 19000)
      if (proxyRes.statusCode === 404) return next()
      if (url.endsWith('.bundle')) proxyRes.headers['content-type'] = 'application/javascript'
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
    }
  )
  req.pipe(proxyReq, { end: true })
}

const { middleware, attachToServer } = createDevServerMiddleware({
  host: '127.0.0.1',
  port,
  watchFolders: [],
})
middleware.use(manifestMiddleware)
middleware.use(esbuildMiddleware)
const server = http.createServer(middleware).listen(19000)
const { messageSocket, eventsSocket } = attachToServer(server)
reload = () => messageSocket.broadcast('reload')
