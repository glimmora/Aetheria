// Lightweight static file server for the built client (port 12000)
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'client', 'dist')
const PORT = parseInt(process.env.CLIENT_PORT) || 12000
const HOST = process.env.HOST || '0.0.0.0'

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
}

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url)
  const ext = path.extname(filePath)

  if (!ext || !fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html')
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    const mime = MIME[path.extname(filePath)] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': mime })
    res.end(data)
  })
})

server.listen(PORT, HOST, () => {
  console.log(`  🌐  Client served at http://${HOST}:${PORT}`)
})
