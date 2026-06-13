// 월별 이동 가능한 일정 캘린더 (홈/Schedule 페이지 공용)
import { useState } from 'react'
import FIXTURES from '../data/fixtures.json'

const fmtDate = (d) => d.slice(5).replace('-', '.')
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// 긴 국가명 축약
const SHORT = {
  'Bosnia and Herzegovina': 'Bosnia',
  'New Zealand': 'NZ',
  'Saudi Arabia': 'Saudi',
  'Cape Verde': 'C. Verde',
  'Ivory Coast': 'Ivory C.',
  Netherlands: 'NED',
  Switzerland: 'SUI',
}
const shortName = (n) => SHORT[n] || n

const DEFAULT_MONTH = (FIXTURES[0]?.date || new Date().toISOString()).slice(0, 7)
const SEASON_STARTS = FIXTURES.filter((f) => !f.away)

const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Calendar({ compact = false }) {
  const [month, setMonth] = useState(DEFAULT_MONTH)
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const firstDow = new Date(y, m - 1, 1).getDay()

  const byDay = {}
  let monthCount = 0
  for (const f of FIXTURES) {
    if (f.date.slice(0, 7) !== month) continue
    const d = Number(f.date.slice(8))
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(f)
    monthCount++
  }

  return (
    <div className={'home-cal' + (compact ? ' in-app' : '')}>
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="이전 달">
          ←
        </button>
        <span className="cal-nav-label">
          {y}.{String(m).padStart(2, '0')}
          <em>{monthCount > 0 ? `${monthCount} matches & events` : 'No scheduled matches yet'}</em>
        </span>
        <button className="cal-nav-btn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="다음 달">
          →
        </button>
      </div>

      <div className="cal-wd-row">
        {WEEKDAYS.map((w) => (
          <span key={w} className="cal-wd">{w}</span>
        ))}
      </div>
      <div className="cal">
        {Array.from({ length: firstDow }, (_, i) => (
          <div key={'b' + i} className="cal-day blank" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const fx = byDay[d] || []
          return (
            <div key={d} className={'cal-day' + (fx.length ? '' : ' off')}>
              <span className="cal-num">{d}</span>
              {fx.map((f, j) =>
                f.away ? (
                  <span
                    key={j}
                    className="cal-fx"
                    title={`${f.home} vs ${f.away} · ${f.stage}${f.venue ? ' · ' + f.venue : ''}${f.time ? ' · ' + f.time : ''}`}
                  >
                    <b>{f.homeFlag}</b>
                    {shortName(f.home)}
                    <i>vs</i>
                    <b>{f.awayFlag}</b>
                    {shortName(f.away)}
                  </span>
                ) : (
                  <span key={j} className="cal-fx" title={`${f.comp} · ${f.stage}`}>
                    <b>{f.compFlag}</b>
                    {f.home}
                  </span>
                ),
              )}
            </div>
          )
        })}
      </div>

      {/* 시즌 개막 바로가기 — 클릭하면 해당 월로 이동 */}
      <div className="cal-later">
        {SEASON_STARTS.map((f, i) => (
          <button
            key={i}
            className="cal-later-item"
            onClick={() => setMonth(f.date.slice(0, 7))}
          >
            <b>{f.compFlag}</b> {f.home} · {fmtDate(f.date)}
          </button>
        ))}
      </div>
    </div>
  )
}
