import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const spinsDir = fileURLToPath(new URL('./public/assets/spins', import.meta.url))

/** Dev-only sink for the marketplace spin baker. Not part of the production server. */
function saveSpinPlugin(): Plugin {
  return {
    name: 'save-spin',
    configureServer(server) {
      fs.mkdirSync(spinsDir, { recursive: true })
      server.middlewares.use('/__save-spin', (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') return next()
        const id = new URL(req.url ?? '', 'http://localhost').searchParams.get('id') ?? ''
        if (!/^[a-z0-9_-]+$/i.test(id)) {
          res.statusCode = 400
          res.end('bad id')
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          const body = Buffer.concat(chunks)
          if (body.length < 16 || body.length > 8_000_000 || body.subarray(0, 6).toString() !== 'GIF89a') {
            res.statusCode = 400
            res.end('bad gif')
            return
          }
          fs.writeFileSync(path.join(spinsDir, `${id}.gif`), body)
          res.end('ok')
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveSpinPlugin()],
  server: {
    // Dual-app local: RIPBEYS :5173 → Requiem Next :3000 /api/*
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
