import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') return new Response('Not found', { status: 404 })
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!/^[a-z0-9_-]+$/i.test(id)) return new Response('bad id', { status: 400 })
  const reader = req.body?.getReader()
  if (!reader) return new Response('bad gif', { status: 400 })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 8_000_000) { await reader.cancel(); return new Response('bad gif', { status: 413 }) }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const body = Buffer.concat(chunks)
  if (size < 16 || body.subarray(0, 6).toString() !== 'GIF89a') return new Response('bad gif', { status: 400 })
  const folder = path.join(process.cwd(), 'public/assets/spins')
  await mkdir(folder, { recursive: true })
  await writeFile(path.join(folder, `${id}.gif`), body)
  return new Response('ok')
}
