import { useEffect, useRef, useState, type RefObject } from 'react'

type FeedMedia = {
  type: 'video' | 'photo'
  url: string
  poster?: string | null
}

type FeedPost = {
  id: string
  url: string
  text: string
  createdAt: string | null
  likes: number
  replies: number
  reposts: number
  views: number | null
  author: { handle: string; name: string; avatar?: string | null }
  media: FeedMedia[]
  collaborators: Array<{ handle: string; name: string; url: string }>
  quote?: { text: string; author?: string | null; url?: string | null } | null
}

type FeedPayload = {
  handle: string
  profileUrl: string
  posts: FeedPost[]
  fetchedAt?: string
}

function formatCount(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    // Twitter "Wed Aug 05 …" strings
    const parsed = Date.parse(iso)
    if (Number.isNaN(parsed)) return iso
    return new Date(parsed).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let active = false
    let dragging = false
    let startX = 0
    let startScroll = 0
    let pointerId: number | null = null

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      active = true
      dragging = false
      startX = e.clientX
      startScroll = el.scrollLeft
      pointerId = e.pointerId
    }
    const move = (e: PointerEvent) => {
      if (!active) return
      const dx = e.clientX - startX
      if (!dragging && Math.abs(dx) > 10) {
        dragging = true
        el.classList.add('is-dragging')
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
      if (!dragging) return
      el.scrollLeft = startScroll - dx
      e.preventDefault()
    }
    const up = () => {
      if (!active) return
      active = false
      if (dragging) {
        el.dataset.suppressClick = '1'
        window.setTimeout(() => {
          delete el.dataset.suppressClick
        }, 120)
      }
      dragging = false
      el.classList.remove('is-dragging')
      if (pointerId != null) {
        try {
          el.releasePointerCapture(pointerId)
        } catch {
          /* already released */
        }
      }
      pointerId = null
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move, { passive: false })
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [ref])
}

export function RipBeysFeed() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [feed, setFeed] = useState<FeedPayload | null>(null)
  const [error, setError] = useState(false)
  useDragScroll(trackRef)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/x/feed', { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error('feed')
        const data = (await res.json()) as FeedPayload
        if (!cancelled) {
          setFeed(data)
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }
    load()
    const timer = window.setInterval(load, 180_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const posts = feed?.posts ?? []
  const profileUrl = feed?.profileUrl ?? 'https://x.com/ripbeysio'

  return (
    <section className="rb-xfeed" id="x" aria-label="Rip Beys on X">
      <div className="rb-xfeed-head">
        <div>
          <p className="rb-under">Live from X</p>
          <h3>
            @{feed?.handle ?? 'ripbeysio'}
          </h3>
        </div>
        <a className="rb-pill cursor-target" href={profileUrl} target="_blank" rel="noreferrer">
          Follow on X
        </a>
      </div>

      {!posts.length && !error ? (
        <p className="rb-xfeed-empty">Pulling the latest posts…</p>
      ) : null}
      {error && !posts.length ? (
        <p className="rb-xfeed-empty">
          Feed briefly offline.{' '}
          <a href={profileUrl} target="_blank" rel="noreferrer">Open @ripbeysio</a>
        </p>
      ) : null}

      <div className="rb-xfeed-track" ref={trackRef}>
        {posts.map((post) => (
          <a
            key={post.id}
            className="rb-xcard"
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (trackRef.current?.dataset.suppressClick) {
                e.preventDefault()
                return
              }
              // Force open — custom cursors / drag handlers can swallow default nav.
              e.preventDefault()
              window.open(post.url, '_blank', 'noopener,noreferrer')
            }}
          >
            <header>
              {post.author.avatar ? (
                <img src={post.author.avatar.replace('_normal', '_bigger')} alt="" loading="lazy" />
              ) : (
                <span className="rb-xcard-avatar" />
              )}
              <div>
                <b>{post.author.name}</b>
                <small>@{post.author.handle}</small>
              </div>
              <time dateTime={post.createdAt ?? undefined}>{formatDate(post.createdAt)}</time>
            </header>

            {post.text ? <p>{post.text}</p> : null}

            {post.quote?.text ? (
              <blockquote>
                <small>{post.quote.author ? `@${post.quote.author}` : 'Quoted'}</small>
                <span>{post.quote.text}</span>
              </blockquote>
            ) : null}

            {post.media[0] ? (
              <div className="rb-xcard-media" data-type={post.media[0].type}>
                {post.media[0].type === 'video' ? (
                  <video
                    src={post.media[0].url}
                    poster={post.media[0].poster || undefined}
                    muted
                    playsInline
                    loop
                    autoPlay
                    preload="metadata"
                  />
                ) : (
                  <img src={post.media[0].url} alt="" loading="lazy" decoding="async" />
                )}
              </div>
            ) : null}

            {post.collaborators.length ? (
              <div className="rb-xcard-collab">
                <span>with</span>
                {post.collaborators.map((c) => (
                  <em key={c.handle}>@{c.handle}</em>
                ))}
              </div>
            ) : null}

            <footer>
              <span title="Likes">{formatCount(post.likes)} likes</span>
              <span title="Replies">{formatCount(post.replies)} replies</span>
              <span title="Views">{formatCount(post.views)} views</span>
            </footer>
          </a>
        ))}
      </div>
    </section>
  )
}
