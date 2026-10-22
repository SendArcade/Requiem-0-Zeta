import { afterEach, expect, it, vi } from 'vitest'
import { POST } from './route'
const files = vi.hoisted(() => ({ mkdir: vi.fn(), writeFile: vi.fn() }))
vi.mock('node:fs/promises', () => files)
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
const request = (id: string, body: BodyInit = 'GIF89a01234567890') => new Request(`http://localhost/__save-spin?id=${encodeURIComponent(id)}`, { method: 'POST', body })
it('never exposes the development file writer in production', async () => {
  vi.stubEnv('NODE_ENV', 'production')
  expect((await POST(request('valid'))).status).toBe(404)
  expect(files.writeFile).not.toHaveBeenCalled()
})
it('rejects path traversal identifiers', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  expect((await POST(request('../escape'))).status).toBe(400)
  expect(files.writeFile).not.toHaveBeenCalled()
})
it('rejects invalid GIF content', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  expect((await POST(request('valid', 'not-a-gif-body-at-all'))).status).toBe(400)
  expect(files.writeFile).not.toHaveBeenCalled()
})
it('bounds uploads before writing files', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  expect((await POST(request('valid', new Uint8Array(8_000_001)))).status).toBe(413)
  expect(files.writeFile).not.toHaveBeenCalled()
})
it('retains the development spin-baker workflow', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  expect((await POST(request('bx-002'))).status).toBe(200)
  expect(files.writeFile).toHaveBeenCalledWith(expect.stringContaining('public/assets/spins/bx-002.gif'), Buffer.from('GIF89a01234567890'))
})
