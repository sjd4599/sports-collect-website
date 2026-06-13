import { useEffect, useRef, useState } from 'react'

const CLUB_COL = '235px'
const HEAD_ROW = '112px'
const ROW = '160px'
const EXPAND_ROW = '540px'
const COL = '230px'
const EXPAND_COL = '700px'

// 48시간 이내 보도는 NEW 표시
const isNew = (d) => Date.now() - new Date(d + 'T00:00:00').getTime() < 2 * 86400000

export default function MatrixGrid({ journalists, clubs, leagues, articleIndex, counts }) {
  const [active, setActiveRaw] = useState(null) // { r, c }
  const scrollRef = useRef(null)

  // 드래그 중에는 호버 확장을 잠시 멈춤
  const setActive = (v) => {
    if (scrollRef.current?.dataset.dragging) return
    setActiveRaw(v)
  }

  // 세로 휠 → 표 가로 스크롤 / 마우스 드래그로 자유 패닝
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const mainEl = el.closest('.main')

    const onWheel = (e) => {
      if (e.shiftKey) return // 네이티브 가로 스크롤은 그대로
      if (!e.target.closest('.g-jhead, .g-corner')) return // 본문은 그대로 아래로
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      e.preventDefault()
      el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + d))
    }

    // 잡고 끌어서 둘러보기 (가로 = 표, 세로 = 페이지)
    let down = null
    let moved = false
    const onDown = (e) => {
      if (e.button !== 0) return
      down = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: mainEl ? mainEl.scrollTop : 0 }
      moved = false
    }
    const onMove = (e) => {
      if (!down) return
      const dx = e.clientX - down.x
      const dy = e.clientY - down.y
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) {
        moved = true
        el.dataset.dragging = '1'
        setActiveRaw(null)
      }
      if (!moved) return
      e.preventDefault()
      el.scrollLeft = down.sl - dx
      if (mainEl) mainEl.scrollTop = down.st - dy
    }
    const onUp = () => {
      if (!down) return
      down = null
      setTimeout(() => delete el.dataset.dragging, 50)
    }
    const onClick = (e) => {
      // 드래그였다면 클릭(링크 이동) 취소
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    }
    const noDrag = (e) => e.preventDefault()

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    el.addEventListener('click', onClick, true)
    el.addEventListener('dragstart', noDrag)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('dragstart', noDrag)
    }
  }, [])

  const cols = [
    CLUB_COL,
    ...journalists.map((_, i) => (active && active.c === i ? EXPAND_COL : COL)),
  ].join(' ')
  const rows = [
    HEAD_ROW,
    ...clubs.map((_, i) => (active && active.r === i ? EXPAND_ROW : ROW)),
  ].join(' ')

  const leagueName = (id) => leagues.find((l) => l.id === id)?.name || ''

  return (
    <div className="grid-scroll" ref={scrollRef}>
    <div
      className={'grid' + (active ? ' focusing' : '')}
      style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}
      onMouseLeave={() => setActive(null)}
    >
      {/* 좌상단 코너 */}
      <div className="g-corner" onMouseEnter={() => setActive(null)}>
        <span>Clubs ↓</span>
        <span>Journalists →</span>
      </div>

      {/* 기자 헤더 (영문 + 공신력) */}
      {journalists.map((j, c) => (
        <a
          key={j.id}
          className={'g-jhead' + (active && active.c === c ? ' is-on' : '') + (j.id === 'all' ? ' jh-all' : '')}
          href={j.profileUrl || undefined}
          target={j.profileUrl ? '_blank' : undefined}
          rel="noreferrer"
          onMouseEnter={() => setActive(null)}
        >
          <span className="jh-name">{j.nameEn}</span>
          <span className="jh-outlet">{j.outlet}</span>
          <span className="jh-count">{counts?.get(j.id) || 0} reports</span>
          {j.credibility > 0 && (
            <span className="jh-cred" title={`공신력 ${j.credibility}/5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={'dot' + (i < j.credibility ? ' on' : '')} />
              ))}
            </span>
          )}
        </a>
      ))}

      {/* 행: 구단 + 셀 */}
      {clubs.map((club, r) => (
        <Row
          key={club.id}
          club={club}
          r={r}
          journalists={journalists}
          articleIndex={articleIndex}
          active={active}
          setActive={setActive}
        />
      ))}
    </div>
    </div>
  )
}

function Row({ club, r, journalists, articleIndex, active, setActive }) {
  return (
    <>
      <div
        className={'g-club' + (active && active.r === r ? ' is-on' : '')}
        onMouseEnter={() => setActive(null)}
      >
        <ClubLogo club={club} size={34} />
        <span className="club-en">{club.nameEn}</span>
      </div>

      {journalists.map((j, c) => {
        const items = articleIndex.get(`${j.id}|${club.id}`) || []
        const has = items.length > 0
        const expanded = active && active.r === r && active.c === c
        const dimmed = active && !expanded
        return (
          <div
            key={j.id}
            className={
              'g-cell' +
              (has ? ' has' : ' empty') +
              (expanded ? ' expanded' : '') +
              (dimmed ? ' dimmed' : '')
            }
            onMouseEnter={() => (has ? setActive({ r, c }) : setActive(null))}
          >
            {has && !expanded && <CellPreview latest={items[0]} count={items.length} />}
            {has && expanded && (
              <CellExpanded club={club} journalist={j} items={items} />
            )}
          </div>
        )
      })}
    </>
  )
}

function ClubLogo({ club, size }) {
  return (
    <span className="club-logo" style={{ width: size, height: size }}>
      {club.logo && (
        <img
          src={club.logo}
          alt={club.nameEn}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextSibling.style.display = 'flex'
          }}
        />
      )}
      <span
        className="logo-fallback"
        style={{ background: club.color, display: club.logo ? 'none' : 'flex' }}
      >
        {club.short}
      </span>
    </span>
  )
}

function CellPreview({ latest, count }) {
  return (
    <div className="preview">
      <span className="pv-date">
        {latest.date}
        {isNew(latest.date) && <em className="new-badge">NEW</em>}
        {count > 1 && <em className="pv-more">+{count - 1}</em>}
      </span>
      <span className="pv-title">{latest.titleKo}</span>
    </div>
  )
}

function CellExpanded({ club, journalist, items }) {
  const [latest, ...older] = items
  return (
    <div className="xp">
      <div className="xp-head">
        <span className="xp-jname">{journalist.nameEn}</span>
        <span className="xp-on">on</span>
        <span className="xp-cname">{club.nameEn}</span>
      </div>

      <div className="xp-scroll">
        {/* 최신 — 이미지 좌 / 텍스트 우 */}
        <a className="thumb" href={latest.url} target="_blank" rel="noreferrer">
          <div
            className={'thumb-visual' + (latest.imageUrl ? ' has-photo' : ' brand')}
            style={
              latest.imageUrl
                ? undefined
                : { background: `linear-gradient(135deg, ${club.color}2e 0%, ${club.color}10 55%, transparent 100%)` }
            }
          >
            {latest.imageUrl ? (
              <img
                className="thumb-photo"
                src={latest.imageUrl}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : club.logo ? (
              <img className="thumb-logo-big" src={club.logo} alt="" loading="lazy" />
            ) : (
              <span className="thumb-img-label">Image</span>
            )}
            {latest.imageUrl && club.logo && (
              <img className="thumb-logo" src={club.logo} alt="" loading="lazy" />
            )}
            <span className="thumb-chip">
              {latest.sourceType === 'x' ? '𝕏 POST' : 'ARTICLE'} — {latest.outlet}
            </span>
            {latest.aiImage && <span className="ai-chip">AI IMAGE</span>}
          </div>
          <div className="thumb-body">
            <span className="thumb-date">
              {latest.date} · LATEST
              {isNew(latest.date) && <em className="new-badge">NEW</em>}
            </span>
            <span className="thumb-title">{latest.titleKo}</span>
            <p className="thumb-summary">{latest.summaryKo}</p>
            <span className="thumb-link">원문 보기 ↗</span>
          </div>
        </a>

        {/* 이전 소식 — 스크롤로 열람 */}
        {older.length > 0 && (
          <div className="older">
            <span className="older-label">Earlier reports</span>
            {older.map((a, i) => (
              <a key={i} className="older-item" href={a.url} target="_blank" rel="noreferrer">
                <span className="oi-date">{a.date}</span>
                <span className="oi-title">{a.titleKo}</span>
                <p className="oi-summary">{a.summaryKo}</p>
                <span className="oi-meta">
                  {a.sourceType === 'x' ? '𝕏' : '기사'} · {a.outlet} · 원문 ↗
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
