import { useEffect, useRef, useState } from 'react'
import TRANSFERS from '../data/transfers.json'
import { CLUBS } from '../data/clubs.js'

// 이적 데이터의 팀 라벨 → 구단 데이터 매핑 (로고 표시용)
const LABEL_MAP = {
  'RB Leipzig': 'leipzig',
  "Nott'm Forest": 'forest',
  Forest: 'forest',
  'Man City': 'mancity',
  'Man Utd': 'manutd',
  Newcastle: 'newcastle',
  Liverpool: 'liverpool',
  Barcelona: 'barcelona',
  Inter: 'inter',
  Leverkusen: 'leverkusen',
  Arsenal: 'arsenal',
  Atalanta: 'atalanta',
  Bayern: 'bayern',
  'Real Madrid': 'realmadrid',
  Dortmund: 'dortmund',
  'Aston Villa': 'astonvilla',
  Juventus: 'juventus',
  Como: 'como',
  Tottenham: 'tottenham',
  Chelsea: 'chelsea',
}
const EXTRA_CLUBS = {
  PSG: { nameEn: 'PSG', short: 'PSG', color: '#004170', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png' },
}

function clubFor(label) {
  const clean = label.replace(/\s*\(.*\)$/, '').trim()
  if (EXTRA_CLUBS[clean]) return EXTRA_CLUBS[clean]
  const id = LABEL_MAP[clean]
  const c = id && CLUBS.find((x) => x.id === id)
  return c || { nameEn: clean, short: clean.slice(0, 3).toUpperCase(), color: '#9a968c', logo: null }
}

// 링크된(관심·입찰·합의) 팀들 — 소속팀 제외, 행선지 우선
function linkedClubs(t) {
  const from = clubFor(t.fromLabel).nameEn
  const seen = new Set()
  const out = []
  for (const label of [t.toLabel, ...t.events.map((e) => e.clubLabel)]) {
    const c = clubFor(label)
    if (c.nameEn === from || seen.has(c.nameEn)) continue
    seen.add(c.nameEn)
    out.push(c)
  }
  return out.slice(0, 3)
}

function ClubNode({ club, role }) {
  return (
    <span className={'tt-node' + (role ? ' ' + role : '')}>
      {club.logo ? (
        <img src={club.logo} alt={club.nameEn} loading="lazy" />
      ) : (
        <i className="tt-node-fb" style={{ background: club.color }}>{club.short}</i>
      )}
      <small>{club.nameEn}</small>
    </span>
  )
}

const TYPE_KO = {
  interest: '관심',
  contact: '접촉',
  talks: '협상',
  bid: '입찰',
  demand: '요구액',
  agreed: '합의',
  medical: '메디컬',
  option: '옵션',
  done: '완료',
}

const STATUS_EN = { done: 'Done', agreed: 'Agreed', advanced: 'Advanced', rumour: 'Rumour' }

// 평면 원호 다이얼 파라미터 — 항목 수와 무관하게 높이 고정
const WHEEL_STEP = 8 // 항목당 회전 각도(deg)
const WHEEL_GAP = 28 // 항목 사이 세로 간격(px) — 균일하게 고정해 꽉 찬 느낌
const WHEEL_BULGE = 280 // 가로 돌출(부채꼴) 깊이 — 클수록 곡선이 강함
const WHEEL_SPAN = 7 // 중앙 기준 위·아래로 보이는 항목 수

// 원형으로 끊김 없이 돌도록, 가장 가까운 방향의 부호 있는 거리(wrap-around)
function wheelOffset(i, active, n) {
  let d = i - active
  d = ((d % n) + n) % n
  if (d > n / 2) d -= n
  return d
}

// 세로 간격은 균일(off*GAP), 가로 돌출·회전만 곡선 — 정점(off=0)은 오른쪽·수평
function wheelStyle(off) {
  const rad = (off * WHEEL_STEP * Math.PI) / 180
  const dx = WHEEL_BULGE * (Math.cos(rad) - 1) // ≤0, 멀어질수록 왼쪽으로
  const dy = off * WHEEL_GAP // 균일 간격
  return `translate(${dx.toFixed(1)}px, calc(-50% + ${dy}px)) rotate(${off * WHEEL_STEP}deg)`
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'done', label: 'Done' },
  { id: 'talks', label: 'In talks' },
  { id: 'rumour', label: 'Rumour' },
]
const matchFilter = (t, f) =>
  f === 'all' ||
  (f === 'done' && t.status === 'done') ||
  (f === 'talks' && (t.status === 'advanced' || t.status === 'agreed')) ||
  (f === 'rumour' && t.status === 'rumour')

export default function Transfers() {
  const sorted = [...TRANSFERS].sort((a, b) => b.value - a.value)
  const [sel, setSel] = useState(sorted[0].id)
  const [filter, setFilter] = useState('all')
  const visible = sorted.filter((t) => matchFilter(t, filter))
  const selected =
    TRANSFERS.find((t) => t.id === sel && matchFilter(t, filter)) || visible[0]
  const active = Math.max(
    0,
    visible.findIndex((t) => selected && t.id === selected.id),
  )

  // 한 칸 회전 — 매 렌더마다 최신 active/visible를 담아 ref로 노출
  const wheelRef = useRef(null)
  const stepRef = useRef(() => {})
  stepRef.current = (dir) => {
    const n = visible.length
    if (!n) return
    const next = ((active + dir) % n + n) % n
    setSel(visible[next].id)
  }

  // 휠 스크롤 = 한 번에 한 칸. 쿨다운(220ms)으로 관성/연속 이벤트가 여러 칸 넘기는 걸 방지
  useEffect(() => {
    const el = wheelRef.current
    if (!el) return
    let last = 0
    const onWheel = (e) => {
      e.preventDefault()
      if (Math.abs(e.deltaY) < 2) return
      const now = Date.now()
      if (now - last < 220) return
      last = now
      stepRef.current(e.deltaY > 0 ? 1 : -1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // 잡고 끌어서 돌리기 — 44px마다 한 칸
  const drag = useRef(null)
  const onPointerDown = (e) => {
    drag.current = { y: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const TH = 44
    let acc = e.clientY - drag.current.y
    while (Math.abs(acc) >= TH) {
      const dir = acc > 0 ? -1 : 1 // 아래로 끌면 위 항목이 중앙으로 내려옴
      stepRef.current(dir)
      acc += acc > 0 ? -TH : TH
      drag.current.y = e.clientY - acc
    }
  }
  const endDrag = () => {
    drag.current = null
  }

  return (
    <div className="tt">
      {/* 맨 윗칸 — 가격 티커 (천천히 흐르고, 올리면 멈춤) */}
      <div className="tt-strip">
        <span className="tt-strip-label">Live valuations · Summer 2026</span>
        <div className="tt-strip-row">
          <div className="tt-marquee">
            {[...sorted, ...sorted].map((t, i) => (
              <button
                key={t.id + '-' + i}
                className={'tt-chip' + (sel === t.id ? ' on' : '')}
                onMouseEnter={() => setSel(t.id)}
              >
                <b>{t.name}</b>
                <span>{t.priceLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="tt-filter">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={'tt-fbtn' + (filter === f.id ? ' on' : '')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 원호 다이얼 — 휠을 한 칸씩 굴리거나 끌면 이름이 곡선을 따라 돌고, 중앙 선수가 오른쪽에 표시됨 */}
      <div className="tt-arc">
        <div
          className="tt-wheel"
          ref={wheelRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          role="listbox"
          aria-label="이적 선수 다이얼 — 스크롤하거나 끌어서 회전"
        >
          <span className="tt-wheel-dot" />
          <ul className="tt-wheel-track">
            {visible.map((t, i) => {
              const off = wheelOffset(i, active, visible.length)
              const abs = Math.abs(off)
              const hidden = abs > WHEEL_SPAN
              return (
                <li
                  key={t.id}
                  className={'tt-wheel-item' + (off === 0 ? ' on' : '')}
                  style={{
                    transform: wheelStyle(off),
                    opacity: hidden ? 0 : Math.max(0.18, 1 - abs * 0.13),
                    visibility: hidden ? 'hidden' : 'visible',
                    zIndex: 100 - abs,
                  }}
                >
                  <button onClick={() => setSel(t.id)}>
                    {t.name}
                    <span className="tt-wheel-ix">
                      {String(sorted.indexOf(t) + 1).padStart(2, '0')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="tt-stage">
          {selected && (
            <div className="tt-center" key={selected.id}>
              <div className="tt-diagram">
                <ClubNode club={clubFor(selected.fromLabel)} role="from" />
                <span
                  className={
                    'tt-line' +
                    (selected.status === 'done' || selected.status === 'agreed' ? ' solid' : '')
                  }
                />
                <span className="tt-center-photo">
                  <span className="tt-photo-label">Photo</span>
                </span>
                <div className="tt-stack">
                  {linkedClubs(selected).map((c, i) => (
                    <div className="tt-stack-row" key={i}>
                      <span
                        className={
                          'tt-line short' +
                          (i === 0 && (selected.status === 'done' || selected.status === 'agreed')
                            ? ' solid'
                            : '')
                        }
                      />
                      <ClubNode club={c} role={i === 0 ? 'to' : 'rival'} />
                    </div>
                  ))}
                </div>
              </div>
              <span className="tt-center-name">{selected.name}</span>
              <span className="tt-center-route">
                {selected.pos} · {selected.fromLabel} → {selected.toLabel}
              </span>
              <span className="tt-center-foot">
                <em className={'tt-status st-' + selected.status}>
                  {STATUS_EN[selected.status]}
                </em>
                <span className="tt-center-price">{selected.priceLabel}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 가로 타임라인 */}
      {selected && (
        <div className="tt-timeline" key={'tl-' + selected.id}>
          <div className="tt-tl-head">
            <b>{selected.name}</b>
            <span>
              {selected.pos} · {selected.fromLabel} → {selected.toLabel}
            </span>
            <em>{selected.priceLabel}</em>
          </div>
          <div className="tt-tl-track">
            {selected.events.map((e, i) => (
              <div
                key={i}
                className={'tt-ev ev-' + e.type}
                style={{ '--ed': `${i * 0.1}s` }}
              >
                <span className="ev-date">{e.date}</span>
                <span className="ev-node" />
                <span className="ev-club">{e.clubLabel}</span>
                <span className="ev-type">{TYPE_KO[e.type] || e.type}</span>
                {e.feeLabel && <span className="ev-fee">{e.feeLabel}</span>}
                <p className="ev-note">{e.noteKo}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
