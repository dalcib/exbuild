const http = require('http')
const spawn = require('child_process').spawn
const esbuild = require('esbuild')
const { createDevServerMiddleware } = require('@react-native-community/cli-server-api')
const qrcode = require('qrcode-terminal')
const { initialPageMiddleware, nativeMiddleware, webMiddleware } = require('./middlewares')

let reload
const clients = []

function runServer({ platform, buildOptions, ip, initialPageManifest }, { port, liveReload }) {
  esbuild
    .build({
      ...buildOptions,
      watch: {
        onRebuild(error, result) {
          if (error) {
            console.error('watch build failed:', error)
            throw error
          }

          console.log(
            `rebuild succeeded. errors: ${result.errors.length}, warnings: ${result.warnings.length}`
          )
          liveReload && reload()
        },
      },
    })
    .then(() => {
      if (platform !== 'web') {
        qrcode.generate(`exp://${ip}:${port}`, (code) =>
          console.log(
            `${code.replace(/^(?!\s*$)/gm, ' ')}\n`,
            ` › Waiting on exp://${ip}:${port}\n › Scan the QR code above with Expo Go (Android) or the Cameo (Android) or the Camera app (iOS)`
          )
        )
      }
    })
    .catch((err) => {
      console.error(err?.message)
      process.exit(1)
    })

  esbuild
    .serve({ servedir: './dist' /*,onRequest:(args)=>{}*/ }, {})
    .then((esbuilldServer) => {
      console.log('Esbuild Server started')

      if (platform !== 'web') {
        const { middleware, attachToServer } = createDevServerMiddleware({
          host: '127.0.0.1',
          port,
          watchFolders: [],
        })

        middleware.use(initialPageMiddleware(initialPageManifest))
        middleware.use(nativeMiddleware)
        const server = http.createServer(middleware).listen(port)
        const { messageSocket, eventsSocket } = attachToServer(server)

        reload = () => messageSocket.broadcast('reload')
      } else {
        const server = http.createServer(webMiddleware(clients)).listen(port)

        setTimeout(() => {
          const op = { darwin: ['open'], linux: ['xdg-open'], win32: ['cmd', '/c', 'start'] }
          const ptf = process.platform
          //open the default browser only if it is not opened yet
          if (clients.length === 0) {
            spawn(op[ptf][0], [...[op[ptf].slice(1)], `http://localhost:19000`])
          }
        }, 1000)

        reload = () => {
          clients.forEach((res) => res.write('data: update\n\n'))
          clients.length = 0
        }
      }
    })
    .catch((err) => {
      console.error(err?.message)
      process.exit(1)
    })
}

module.exports = runServer
