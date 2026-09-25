/**
 * Live @ripbeysio feed for the landing strip.
 * Discovers recent post IDs from the public profile, hydrates each via
 * FixTweet (media + metrics), caches in Redis/memory.
 *
 * Optional: set X_BEARER_TOKEN to prefer the official X API user timeline.
 */
import { cachedJson } from './cache.mjs'

const HANDLE = (process.env.X_HANDLE || 'ripbeysio').replace(/^@/, '')
const PROFILE = `https://x.com/${HANDLE}`
const BOOTSTRAP_IDS = [
  '2084925991940661368',
  '2082727941482647940',
  '2081801892787802536',
]

function pickMp4(media) {
  const variants = media?.variants || media?.formats || []
  const mp4s = variants
    .filter((v) => (v.content_type || v.container || '').includes('mp4') && v.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
  return mp4s[0]?.url || media?.url || null
}

function normalizeTweet(raw) {
  const t = raw?.tweet || raw
  if (!t?.id) return null
  const author = t.author || {}
  const screen = (author.screen_name || author.username || '').replace(/^@/, '')
  const mediaAll = t.media?.all || []
  const media = mediaAll.map((m) => ({
    type: m.type === 'video' || m.type === 'gif' ? 'video' : 'photo',
    url: m.type === 'video' || m.type === 'gif' ? pickMp4(m) : m.url || m.thumbnail_url,
    poster: m.thumbnail_url || m.url || null,
    width: m.width || null,
    height: m.height || null,
  })).filter((m) => m.url)

  // Link cards (YouTube etc.) when the post has no attached media.
  const external = t.media?.external
  const cardImage =
    external?.thumbnail_url ||
    t.card?.image ||
    t.card?.binding_values?.photo_image_full_size?.image_value?.url ||
    t.card?.binding_values?.thumbnail_image_large?.image_value?.url ||
    null
  if (!media.length && cardImage) {
    media.push({
      type: external?.type === 'video' ? 'photo' : 'photo',
      url: cardImage,
      poster: cardImage,
      width: external?.width || null,
      height: external?.height || null,
    })
  }

  const quote = t.quote || t.quoted_tweet || null
  const quoteAuthor = quote?.author?.screen_name || quote?.author?.username || null
  const collaborators = []
  if (quoteAuthor && quoteAuthor.toLowerCase() !== HANDLE.toLowerCase()) {
    collaborators.push({
      handle: quoteAuthor.replace(/^@/, ''),
      name: quote.author?.name || quoteAuthor,
      url: `https://x.com/${quoteAuthor.replace(/^@/, '')}`,
    })
  }
  for (const c of t.collaborators || t.coauthors || []) {
    const h = (c.screen_name || c.username || '').replace(/^@/, '')
    if (h && !collaborators.some((x) => x.handle.toLowerCase() === h.toLowerCase())) {
      collaborators.push({
        handle: h,
        name: c.name || h,
        url: `https://x.com/${h}`,
      })
    }
  }

  const created =
    t.created_at ||
    (t.created_timestamp ? new Date(t.created_timestamp * 1000).toISOString() : null)

  return {
    id: String(t.id),
    url: `https://x.com/${screen || HANDLE}/status/${t.id}`,
    text: (t.text || t.raw_text?.text || '').trim(),
    createdAt: created,
    likes: Number(t.likes ?? t.favorite_count ?? 0),
    replies: Number(t.replies ?? t.reply_count ?? 0),
    reposts: Number(t.retweets ?? t.retweet_count ?? 0),
    views: Number(t.views ?? t.view_count ?? 0) || null,
    author: {
      handle: screen || HANDLE,
      name: author.name || 'Rip Beys',
      avatar: author.avatar_url || author.profile_image_url || null,
    },
    media,
    collaborators,
    quote: quote
      ? {
          id: String(quote.id || ''),
          text: (quote.text || '').trim(),
          author: quoteAuthor,
          url: quote.id ? `https://x.com/${quoteAuthor}/status/${quote.id}` : null,
        }
      : null,
  }
}

async function discoverIds() {
  const ids = new Set(BOOTSTRAP_IDS)
  const sources = [
    `https://r.jina.ai/http://x.com/${HANDLE}`,
    `https://r.jina.ai/https://x.com/${HANDLE}`,
  ]
  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'text/plain', 'User-Agent': 'ripbeys-feed/1.0' },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) continue
      const body = await res.text()
      for (const m of body.matchAll(/status\/(\d{10,})/g)) ids.add(m[1])
      if (ids.size >= 4) break
    } catch {
      /* try next */
    }
  }
  return [...ids].slice(0, 12)
}

async function hydrateId(id) {
  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'ripbeys-feed/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    return normalizeTweet(await res.json())
  } catch {
    return null
  }
}

async function fetchOfficialTimeline() {
  const token = process.env.X_BEARER_TOKEN
  if (!token) return null
  try {
    const userRes = await fetch(
      `https://api.x.com/2/users/by/username/${HANDLE}?user.fields=profile_image_url,name`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) },
    )
    if (!userRes.ok) return null
    const userJson = await userRes.json()
    const userId = userJson?.data?.id
    if (!userId) return null
    const tl = await fetch(
      `https://api.x.com/2/users/${userId}/tweets?max_results=10&exclude=replies&tweet.fields=created_at,public_metrics,attachments,entities,referenced_tweets&expansions=attachments.media_keys,referenced_tweets.id,referenced_tweets.id.author_id,author_id&media.fields=preview_image_url,url,type,variants,width,height&user.fields=name,username,profile_image_url`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12_000) },
    )
    if (!tl.ok) return null
    const data = await tl.json()
    const users = new Map((data.includes?.users || []).map((u) => [u.id, u]))
    const mediaMap = new Map((data.includes?.media || []).map((m) => [m.media_key, m]))
    const tweets = []
    for (const t of data.data || []) {
      const author = users.get(t.author_id) || userJson.data
      const mediaKeys = t.attachments?.media_keys || []
      const media = mediaKeys.map((k) => mediaMap.get(k)).filter(Boolean).map((m) => ({
        type: m.type === 'video' || m.type === 'animated_gif' ? 'video' : 'photo',
        url:
          m.type === 'video' || m.type === 'animated_gif'
            ? [...(m.variants || [])]
                .filter((v) => v.content_type === 'video/mp4')
                .sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0))[0]?.url || m.preview_image_url
            : m.url || m.preview_image_url,
        poster: m.preview_image_url || m.url || null,
        width: m.width || null,
        height: m.height || null,
      }))
      tweets.push({
        id: t.id,
        url: `https://x.com/${author.username}/status/${t.id}`,
        text: t.text || '',
        createdAt: t.created_at,
        likes: t.public_metrics?.like_count ?? 0,
        replies: t.public_metrics?.reply_count ?? 0,
        reposts: t.public_metrics?.retweet_count ?? 0,
        views: t.public_metrics?.impression_count ?? null,
        author: {
          handle: author.username,
          name: author.name,
          avatar: author.profile_image_url || null,
        },
        media,
        collaborators: [],
        quote: null,
      })
    }
    return tweets
  } catch (err) {
    console.warn('[xfeed] official api failed', err?.message || err)
    return null
  }
}

export async function loadRipBeysFeed() {
  return cachedJson(
    `xfeed:${HANDLE}:v1`,
    async () => {
      const official = await fetchOfficialTimeline()
      if (official?.length) {
        return {
          handle: HANDLE,
          profileUrl: PROFILE,
          source: 'x-api',
          fetchedAt: new Date().toISOString(),
          posts: official,
        }
      }

      const ids = await discoverIds()
      const hydrated = (await Promise.all(ids.map(hydrateId))).filter(Boolean)
      const posts = hydrated.filter(
        (p) => p.author.handle.toLowerCase() === HANDLE.toLowerCase(),
      )
      // Keep quote/repost cards that still belong to the account timeline.
      const ordered = posts.length ? posts : hydrated.slice(0, 6)

      return {
        handle: HANDLE,
        profileUrl: PROFILE,
        source: 'live',
        fetchedAt: new Date().toISOString(),
        posts: ordered,
      }
    },
    { ttlSec: 180 },
  )
}
