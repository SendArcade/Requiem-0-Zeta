import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MarketingNav } from '../components/MarketingNav'
import { docBySlug, docPages, type DocBlock } from './docsContent'
import './docs.css'

function Block({ block }: { block: DocBlock }) {
  if (block.kind === 'h2') return <h2>{block.text}</h2>
  if (block.kind === 'p') return <p>{block.text}</p>
  if (block.kind === 'note') return <p className="docs-note">{block.text}</p>
  if (block.kind === 'ul') {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return (
    <div className="docs-table-wrap">
      <table>
        <thead>
          <tr>
            {block.headers.map((header) => (
              <th key={header} scope="col">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DocsPage() {
  const { slug } = useParams()
  const page = docBySlug(slug)
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      docPages.filter((item) => {
        if (!term) return true
        const hay = `${item.title} ${item.group} ${item.lede}`.toLowerCase()
        return hay.includes(term)
      }),
    [term],
  )
  const groups = [...new Set(visible.map((item) => item.group))]

  useEffect(() => {
    document.title = page ? `${page.title} · RIPBEYS docs` : 'Docs · RIPBEYS'
  }, [page])

  return (
    <main className="docs-page">
      <MarketingNav active="docs" />
      <div className="docs-shell">
        <aside className="docs-side" aria-label="Documentation">
          <label className="docs-search">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pricing, grading, models"
              type="search"
            />
          </label>
          {groups.length === 0 ? <p className="docs-empty">No pages match.</p> : null}
          {groups.map((group) => (
            <div key={group}>
              <p className="docs-group">{group}</p>
              <ul>
                {visible
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const href = item.slug === 'overview' ? '/docs' : `/docs/${item.slug}`
                    const current = (slug || 'overview') === item.slug
                    return (
                      <li key={item.slug}>
                        <Link to={href} aria-current={current ? 'page' : undefined}>
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
        </aside>
        {page ? (
          <article className="docs-article">
            <p className="docs-kicker">{page.group}</p>
            <h1>{page.title}</h1>
            <p className="docs-lede">{page.lede}</p>
            {page.blocks.map((block) => (
              <Block key={block.kind === 'table' ? block.headers.join('|') + block.rows.length : JSON.stringify(block)} block={block} />
            ))}
          </article>
        ) : (
          <article className="docs-article">
            <p className="docs-kicker">Docs</p>
            <h1>That page is not written.</h1>
            <p className="docs-lede">The address does not match a documentation page.</p>
            <p><Link to="/docs">Back to the start</Link></p>
          </article>
        )}
      </div>
    </main>
  )
}
