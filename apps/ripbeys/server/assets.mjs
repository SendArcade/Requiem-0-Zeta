import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

let client = null

export function assetsConfigured() {
  return Boolean(process.env.ASSETS_BUCKET && process.env.ASSETS_ENDPOINT && process.env.ASSETS_ACCESS_KEY_ID && process.env.ASSETS_SECRET_ACCESS_KEY)
}

function getClient() {
  if (client) return client
  if (!assetsConfigured()) return null
  client = new S3Client({
    region: process.env.ASSETS_REGION || 'auto',
    endpoint: process.env.ASSETS_ENDPOINT,
    forcePathStyle: process.env.ASSETS_URL_STYLE !== 'virtual',
    credentials: {
      accessKeyId: process.env.ASSETS_ACCESS_KEY_ID,
      secretAccessKey: process.env.ASSETS_SECRET_ACCESS_KEY,
    },
  })
  return client
}

export function assetKeyFromUrlPath(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '')
  if (!cleaned.startsWith('assets/')) return null
  return cleaned
}

/**
 * Stream an object from the Railway/Tigris bucket.
 * @returns {Promise<{status:number, headers:Record<string,string>, body?:import('stream').Readable, buffer?:Buffer} | null>}
 */
export async function fetchAsset(urlPath) {
  const s3 = getClient()
  if (!s3) return null
  const Key = assetKeyFromUrlPath(urlPath)
  if (!Key) return null
  const Bucket = process.env.ASSETS_BUCKET

  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key }))
    const obj = await s3.send(new GetObjectCommand({ Bucket, Key }))
    const headers = {
      'Content-Type': obj.ContentType || head.ContentType || 'application/octet-stream',
      'Cache-Control': obj.CacheControl || 'public, max-age=604800, stale-while-revalidate=86400',
      ETag: obj.ETag || head.ETag || '',
      'X-Asset-Source': 'bucket',
    }
    if (obj.ContentLength != null) headers['Content-Length'] = String(obj.ContentLength)
    return {
      status: 200,
      headers,
      body: obj.Body instanceof Readable ? obj.Body : Readable.from(obj.Body),
    }
  } catch (err) {
    const code = err?.$metadata?.httpStatusCode || err?.name
    if (code === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchKey') {
      return { status: 404, headers: { 'Content-Type': 'text/plain' }, buffer: Buffer.from('not found') }
    }
    console.warn('[assets] fetch failed', Key, err?.message || err)
    return null
  }
}
