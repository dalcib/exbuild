const http = require('http')
const fs = require('fs')
const spawn = require('child_process').spawn
const esbuild = require('esbuild')
const { createDevServerMiddleware } = require('@react-native-community/cli-server-api')
const qrcode = require('qrcode-terminal')
const { buildconfig, projectRoot, ip, options, expoConfig, manifest } = require('./config')

let reload
const clients = []
const onWatch = (platform) => ({
  onRebuild(error, result) {
    if (error) {
      console.error('watch build failed:', error)
      throw error
    }
    console.log(
      `rebuild succeeded. errors: ${result.errors.length}, warnings: ${result.warnings.length}`
    )
    //@ts-ignore
    if (platform !== 'web') {
      reload()
    } else {
      clients.forEach((res) => res.write('data: update\n\n'))
      clients.length = 0
    }
  },
})

function manifestMiddleware(req, res, next) {
  if (req.url === '/') {
    res.end(JSON.stringify({ ...expoConfig.exp, ...manifest }))
  } else {
    next()
  }
}

const nativeMiddleware = (req, res, next) => {
  console.log(req.url)
  const url = req.url.split('?')[0]
  if (url === '/logs') res.end()
  if (url === '/') return next()
  //if (url === '/launch-js-devtools') return next()
  const proxyReq = http.request(
    `http://0.0.0.0:8000${url}`,
    { method: req.method, headers: req.headers },
    (proxyRes) => {
      if (proxyRes.statusCode === 404) return next()
      //if (url.endsWith('.bundle')) proxyRes.headers['content-type'] = 'application/javascript'
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
    }
  )
  req.pipe(proxyReq, { end: true })
}

const webMiddleware = (req, res) => {
  const { url, method, headers } = req
  if (req.url === '/esbuild')
    return clients.push(
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
    )
  const path = ~url.split('/').pop().indexOf('.') ? url : `/index.html` //for PWA with router
  req.pipe(
    http.request({ hostname: '0.0.0.0', port: 8000, path, method, headers }, (prxRes) => {
      res.writeHead(prxRes.statusCode, prxRes.headers)
      prxRes.pipe(res, { end: true })
    }),
    { end: true }
  )
}

function runServer(platform) {
  esbuild.build({ ...buildconfig, watch: onWatch(platform) }).catch((err) => {
    console.error(err?.message)
    process.exit(1)
  })

  esbuild
    .serve({ servedir: './dist' /*,onRequest:(args)=>{}*/ }, {})
    .then((esbuilldServer) => {
      console.log('Esbuild Server started at port ' + esbuilldServer.port)

      if (platform !== 'web') {
        qrcode.generate(`exp://${ip}:${options.port}`, (code) =>
          console.log(
            `${code.replace(/^(?!\s*$)/gm, ' ')}\n`,
            ` › Waiting on exp://${ip}:${options.port}\n › Scan the QR code above with Expo Go (Android) or the Cameo (Android) or the Camera app (iOS)`
          )
        )

        const { middleware, attachToServer } = createDevServerMiddleware({
          host: '127.0.0.1',
          port: options.port,
          watchFolders: [],
        })

        middleware.use(manifestMiddleware)
        middleware.use(nativeMiddleware)
        const server = http.createServer(middleware).listen(19000)
        const { messageSocket, eventsSocket } = attachToServer(server)

        reload = () => messageSocket.broadcast('reload')
      } else {
        if (!fs.existsSync(projectRoot + '/dist/index.html')) {
          fs.copyFileSync('./../index.html', projectRoot + '/dist/index.html')
        }

        http.createServer(webMiddleware).listen(3000)

        //open the default browser only if it is not opened yet
        setTimeout(() => {
          const op = { darwin: ['open'], linux: ['xdg-open'], win32: ['cmd', '/c', 'start'] }
          const ptf = process.platform
          if (clients.length === 0)
            spawn(op[ptf][0], [...[op[ptf].slice(1)], `http://localhost:3000`])
        }, 1000)
      }
    })
    .catch((err) => {
      console.error(err?.message)
      process.exit(1)
    })
}

module.exports = runServer
