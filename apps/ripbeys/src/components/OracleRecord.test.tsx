// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OracleRecord } from './OracleRecord'

vi.mock('./OracleHistory', () => ({ OracleHistory: () => null }))

let host: HTMLDivElement
let root: Root
const fetchMock = vi.fn()
const streams: string[] = []
const liveStreams: Array<{ onmessage: ((message: { data: string }) => void) | null }> = []
const payload = (value: number, conditions = ['used', 'like_new', 'unknown']) => ({
  oracle: { value, nComps: 3, currency: 'JPY' }, comps: [], conditions,
})
const response = (data: ReturnType<typeof payload>) => ({ ok: true, json: async () => data })
const text = () => host.textContent || ''
async function click(label: string) {
  const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent === label)
  expect(button, `Missing button ${label}`).toBeTruthy()
  await act(async () => button!.click())
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('EventSource', class {
    onopen = null; onerror = null; onmessage: ((message: { data: string }) => void) | null = null
    constructor(url: string) { streams.push(url); liveStreams.push(this) }
    close() {}
  })
  streams.length = 0
  liveStreams.length = 0
  fetchMock.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Oracle record requests', () => {
  it('removes the previous mark immediately when a filter changes', async () => {
    fetchMock.mockResolvedValueOnce(response(payload(1234)))
    await act(async () => root.render(<OracleRecord productId="product-a" />))
    expect(text()).toContain('¥1,234')
    let finish!: (data: ReturnType<typeof response>) => void
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    await click('Sealed / New')
    expect(text()).toContain('Loading Oracle')
    expect(text()).not.toContain('¥1,234')
    await act(async () => finish(response(payload(5678))))
    expect(text()).toContain('¥5,678')
  })

  it('keeps filters and retry available after failure and recovers', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await act(async () => root.render(<OracleRecord productId="product-a" />))
    expect(text()).toContain('Oracle request failed')
    expect(text()).toContain('Include sources')
    expect(text()).toContain('Conditions')
    fetchMock.mockResolvedValueOnce(response(payload(2345)))
    await click('Retry')
    expect(text()).toContain('¥2,345')
    expect(text()).not.toContain('Oracle request failed')
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await click('Mercari JP')
    fetchMock.mockResolvedValueOnce(response(payload(3456)))
    await click('Mercari JP')
    expect(text()).toContain('¥3,456')
  })

  it('uses the configured API base for records and events and respects sealed defaults', async () => {
    vi.stubEnv('VITE_REQUIEM_API_BASE', 'https://oracle.example/')
    fetchMock.mockResolvedValueOnce(response(payload(1234, ['sealed'])))
    await act(async () => root.render(<OracleRecord productId="sealed-product" />))
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.origin).toBe('https://oracle.example')
    expect(url.searchParams.has('conditions')).toBe(false)
    expect(streams[0]).toBe('https://oracle.example/api/events?productId=sealed-product')
    expect(Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Sealed / New')?.className).toBe('is-on')
    expect(Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Used')?.className).toBe('')
    fetchMock.mockResolvedValueOnce(response(payload(2345, ['sealed', 'used'])))
    await click('Used')
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('conditions')).toBe('sealed,used')
  })

  it('refreshes after a live sale without resetting the selected filters', async () => {
    fetchMock.mockResolvedValueOnce(response(payload(1234, ['sealed'])))
    await act(async () => root.render(<OracleRecord productId="sealed-product" />))
    fetchMock.mockResolvedValueOnce(response(payload(2345, ['sealed'])))
    await act(async () => liveStreams[0].onmessage?.({ data: JSON.stringify({ type: 'sale' }) }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(text()).toContain('¥2,345')
    expect(Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Sealed / New')?.className).toBe('is-on')
  })

  it('ignores an old response after navigating to another product', async () => {
    let finish!: (data: ReturnType<typeof response>) => void
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    await act(async () => root.render(<OracleRecord productId="product-a" />))
    fetchMock.mockResolvedValueOnce(response(payload(9876)))
    await act(async () => root.render(<OracleRecord productId="product-b" />))
    await act(async () => finish(response(payload(1234))))
    expect(text()).toContain('¥9,876')
    expect(text()).not.toContain('¥1,234')
  })
})
