import { useMemo, useState } from 'react'
import { JOURNALISTS } from './data/journalists.js'
import { CLUBS, LEAGUES } from './data/clubs.js'
import ARTICLES from './data/articles.json'
import MatrixGrid from './components/MatrixGrid.jsx'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import Transfers from './components/Transfers.jsx'
import Sources from './components/Sources.jsx'
import Calendar from './components/Calendar.jsx'
import Standings from './components/Standings.jsx'

// 게시 후 30일이 지난 기사는 자동으로 사라집니다 (데이터는 보존)
const FRESH_DAYS = 30
const cutoff = Date.now() - FRESH_DAYS * 86400000
const LIVE_ARTICLES = ARTICLES.filter(
  (a) => new Date(a.date + 'T00:00:00').getTime() >= cutoff,
)

// 매트릭스 맨 앞 '종합' 열 — 모든 소스의 기사를 합쳐서 표시
const ALL_SOURCE = {
  id: 'all',
  name: '종합',
  nameEn: 'All Sources',
  outlet: '모든 소스 통합',
  specialty: '',
  credibility: 0,
  profileUrl: '',
  color: '#161513',
}
const MATRIX_JOURNALISTS = [ALL_SOURCE, ...JOURNALISTS]

const SOON_PAGES = {
  teaminfo: ['Player Stats', 'Starts, ratings and average positions — coming soon.'],
}

export default function App() {
  const [page, setPage] = useState('home')
  const [league, setLeague] = useState('epl')
  const [query, setQuery] = useState('')

  const articleIndex = useMemo(() => {
    const idx = new Map()
    for (const a of LIVE_ARTICLES) {
      for (const key of [`${a.journalist}|${a.club}`, `all|${a.club}`]) {
        if (!idx.has(key)) idx.set(key, [])
        idx.get(key).push(a)
      }
    }
    for (const list of idx.values()) list.sort((x, y) => (x.date < y.date ? 1 : -1))
    return idx
  }, [])

  // 기자별 리포트 수
  const journalistCounts = useMemo(() => {
    const m = new Map()
    for (const a of LIVE_ARTICLES) m.set(a.journalist, (m.get(a.journalist) || 0) + 1)
    m.set('all', LIVE_ARTICLES.length)
    return m
  }, [])

  // 검색: 비어있으면 선택 리그만, 검색 시에는 4대 리그 전체에서 매칭
  const { clubsShown, index } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = q ? CLUBS : CLUBS.filter((c) => c.league === league)
    if (!q) return { clubsShown: pool, index: articleIndex }

    const leagueName = (id) => LEAGUES.find((l) => l.id === id)?.name || ''
    const idx = new Map()
    const shown = []
    for (const club of pool) {
      const clubMatch = [club.name, club.nameEn, club.short, leagueName(club.league)]
        .some((s) => s.toLowerCase().includes(q))
      let any = false
      for (const j of JOURNALISTS) {
        const key = `${j.id}|${club.id}`
        const items = articleIndex.get(key) || []
        const filtered = clubMatch
          ? items
          : items.filter((a) =>
              [a.titleKo, a.summaryKo, a.outlet, j.name, j.nameEn]
                .some((s) => s.toLowerCase().includes(q)),
            )
        if (filtered.length) {
          idx.set(key, filtered)
          const ak = `all|${club.id}`
          idx.set(ak, (idx.get(ak) || []).concat(filtered).sort((x, y) => (x.date < y.date ? 1 : -1)))
          any = true
        }
      }
      if (any || clubMatch) shown.push(club)
    }
    return { clubsShown: shown, index: idx }
  }, [query, league, articleIndex])

  const lastUpdated = useMemo(
    () => LIVE_ARTICLES.reduce((m, a) => (a.date > m ? a.date : m), ''),
    [],
  )

  // 홈 배너용 최신 기사 8건 (발행 시각 우선 정렬)
  const ts = (a) => (a.publishedAt ? Date.parse(a.publishedAt) : Date.parse(a.date))
  const latestArticles = useMemo(
    () => [...LIVE_ARTICLES].sort((a, b) => ts(b) - ts(a)).slice(0, 8),
    [],
  )

  if (page === 'home') {
    return (
      <Home
        onEnter={setPage}
        reportCount={LIVE_ARTICLES.length}
        lastUpdated={lastUpdated}
        latest={latestArticles}
        journalists={JOURNALISTS}
      />
    )
  }

  if (SOON_PAGES[page]) {
    const [title, desc] = SOON_PAGES[page]
    return (
      <div className="soon-page">
        <button className="soon-back" onClick={() => setPage('home')}>← Back</button>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand brand-btn" onClick={() => setPage('home')}>
          Football Press Matrix
        </button>
        {page === 'matrix' && (
          <div className="searchbox">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="검색 — 단어 또는 구단, 4대 리그 전체 (예: 이적, Arsenal)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')} aria-label="지우기">×</button>
            )}
          </div>
        )}
        <span className="topbar-meta">
          {LIVE_ARTICLES.length} reports · updated {lastUpdated}
        </span>
      </header>

      <div className="ad-band">
        <div className="ph-box ph-logo">Main Logo</div>
        <div className="ph-box ph-ad">Ad Banner — 970 × 90</div>
      </div>

      <div className="body">
        <Sidebar page={page} onNav={setPage} onHome={() => setPage('home')} />
        <main className="main">
          {page === 'matrix' && (
            <>
              <div className="league-tabs">
                {LEAGUES.map((l) => (
                  <button
                    key={l.id}
                    className={'ltab' + (league === l.id && !query.trim() ? ' on' : '')}
                    onClick={() => {
                      setLeague(l.id)
                      setQuery('')
                    }}
                  >
                    {l.flag} {l.name}
                  </button>
                ))}
                {query.trim() && <span className="ltab-search-note">전체 리그 검색 중</span>}
              </div>
              {clubsShown.length > 0 ? (
                <MatrixGrid
                  key={query + league}
                  journalists={MATRIX_JOURNALISTS}
                  clubs={clubsShown}
                  leagues={LEAGUES}
                  articleIndex={index}
                  counts={journalistCounts}
                />
              ) : (
                <div className="no-results">
                  <p>"{query}"에 대한 결과가 없습니다.</p>
                  <span>구단명(한/영) 또는 기사 속 단어로 검색해보세요.</span>
                </div>
              )}
            </>
          )}
          {page === 'transfers' && <Transfers />}
          {page === 'schedule' && (
            <div className="sched-grid">
              <div className="sched-cal">
                <Calendar compact />
              </div>
              <div className="sched-side">
                <Standings />
              </div>
            </div>
          )}
          {page === 'sources' && <Sources counts={journalistCounts} />}
        </main>
      </div>
    </div>
  )
}
