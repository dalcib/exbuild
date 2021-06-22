const http = require('http')

function initialPageMiddleware(initialPage) {
  return (req, res, next) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.write(JSON.stringify(initialPage))
      res.end(null)
    } else {
      next()
    }
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
      if (url.endsWith('.js')) proxyRes.headers['content-type'] = 'application/javascript'
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
    }
  )
  req.pipe(proxyReq, { end: true })
}

const webMiddleware = (clients) => (req, res) => {
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

module.exports = {
  initialPageMiddleware,
  nativeMiddleware,
  webMiddleware,
}
