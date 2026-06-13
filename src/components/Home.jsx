// 시작 페이지 — 중앙 3개 항목 + 그 아래 경기 일정 캘린더
import Calendar from './Calendar.jsx'
import { CLUBS } from '../data/clubs.js'

const CARDS = [
  {
    id: 'matrix',
    num: '01',
    title: 'Articles',
    desc: 'Latest reports from tier-one journalists, mapped club by club. Korean summaries, original sources.',
    cta: 'Enter ↗',
    ready: true,
  },
  {
    id: 'transfers',
    num: '02',
    title: 'Transfers',
    desc: 'Every linked player this window — valuations, bids and club-by-club timelines.',
    cta: 'Enter ↗',
    ready: true,
  },
  {
    id: 'teaminfo',
    num: '03',
    title: 'Team Info',
    desc: 'Squads, starts, ratings and average positions — the numbers behind every club.',
    cta: 'Coming soon',
    ready: false,
  },
]

const fmtWhen = (a) => {
  const d = a.date.slice(5).replace('-', '.')
  if (!a.publishedAt) return d
  const t = new Date(a.publishedAt)
  return `${d} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
}

export default function Home({ onEnter, reportCount, lastUpdated, latest = [], journalists = [] }) {
  const jName = (id) => journalists.find((j) => j.id === id)?.nameEn || id
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="home">
      <div className="home-top">
        <span className="brand">Football Press Matrix</span>
        <span className="home-date">{today}</span>
      </div>

      <div className="ad-band">
        <div className="ph-box ph-logo">Main Logo</div>
        <div className="ph-box ph-ad">Ad Banner — 970 × 90</div>
      </div>

      <div className="home-hero">
        <span className="hero-kicker">Facts only — no opinions</span>
        <h1 className="hero-title">
          Trusted football reporting,
          <br />
          in one place.
        </h1>
        <p className="hero-sub">
          Tier-one journalists × Europe's biggest clubs · {reportCount} reports · updated {lastUpdated}
        </p>
      </div>

      {/* 새로 나온 기사 배너 — 이미지와 함께 흐르고, 클릭하면 매트릭스로 */}
      {latest.length > 0 && (
        <button className="home-ticker" onClick={() => onEnter('matrix')}>
          <span className="ht-label">Latest</span>
          <span className="ht-row">
            <span className="ht-track">
              {[...latest, ...latest].map((a, i) => {
                const club = CLUBS.find((c) => c.id === a.club)
                return (
                  <span className="ht-item" key={i}>
                    <span
                      className="ht-thumb"
                      style={
                        a.imageUrl
                          ? undefined
                          : { background: `linear-gradient(135deg, ${club?.color || '#999'}2e, ${club?.color || '#999'}10)` }
                      }
                    >
                      {a.imageUrl ? (
                        <img
                          src={a.imageUrl}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        club?.logo && <img className="ht-thumb-logo" src={club.logo} alt="" loading="lazy" />
                      )}
                    </span>
                    <span className="ht-text">
                      <i>
                        {fmtWhen(a)} · {jName(a.journalist)}
                      </i>
                      <b>{a.titleKo}</b>
                    </span>
                  </span>
                )
              })}
            </span>
          </span>
        </button>
      )}

      <div className="home-cards">
        {CARDS.map((c) => (
          <button
            key={c.id}
            className={'hcard' + (c.ready ? '' : ' hcard-soon')}
            onClick={() => onEnter(c.id)}
          >
            <span className="hc-num">{c.num}</span>
            <span className="hc-title">{c.title}</span>
            <span className="hc-desc">{c.desc}</span>
            <span className="hc-cta">{c.cta}</span>
          </button>
        ))}
      </div>

      {/* 스크롤하면 일정만 한 화면에 — 캘린더 형식 */}
      <Calendar />

      <div className="home-foot">
        Romano · Ornstein · Stone · Plettenberg · Di Marzio · Moretto +10 sources
      </div>
    </div>
  )
}
