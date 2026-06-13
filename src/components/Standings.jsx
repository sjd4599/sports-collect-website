// 순위·득점·기록 패널 (Schedule 페이지 우측)
import { useState } from 'react'
import STANDINGS from '../data/standings.json'
import { CLUBS, LEAGUES } from '../data/clubs.js'

const TABS = [
  ['table', '순위'],
  ['scorers', '득점'],
  ['records', '기록'],
]

const clubById = (id) =>
  CLUBS.find((c) => c.id === id) || { nameEn: id, short: '', color: '#999', logo: null }

function Logo({ id }) {
  const c = clubById(id)
  return c.logo ? (
    <img src={c.logo} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />
  ) : (
    <i className="fb" style={{ background: c.color || '#999' }}>{c.short}</i>
  )
}

export default function Standings() {
  const [league, setLeague] = useState('epl')
  const [tab, setTab] = useState('table')
  const d = STANDINGS[league]

  return (
    <div className="sched-side-card">
      <div className="st-leagues">
        {LEAGUES.filter((l) => l.id !== 'worldcup').map((l) => (
          <button
            key={l.id}
            className={'st-league' + (league === l.id ? ' on' : '')}
            onClick={() => setLeague(l.id)}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className="st-tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={'st-tab' + (tab === id ? ' on' : '')}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="st-body">
        {!d ? (
          <p className="st-note">데이터 준비 중입니다.</p>
        ) : tab === 'table' ? (
          <table className="st-table">
            <thead>
              <tr>
                <th className="l">#</th>
                <th className="l">Club</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {d.table.map((r, i) => (
                <tr key={r.club}>
                  <td className="l st-rank">{i + 1}</td>
                  <td className="l">
                    <span className="st-team"><Logo id={r.club} />{clubById(r.club).nameEn}</span>
                  </td>
                  <td>{r.p}</td>
                  <td>{r.w}</td>
                  <td>{r.d}</td>
                  <td>{r.l}</td>
                  <td>{r.gd > 0 ? '+' : ''}{r.gd}</td>
                  <td className="st-pts">{r.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : tab === 'scorers' ? (
          <table className="st-table">
            <thead>
              <tr>
                <th className="l">#</th>
                <th className="l">Player</th>
                <th>G</th>
                <th>A</th>
              </tr>
            </thead>
            <tbody>
              {d.scorers.map((r, i) => (
                <tr key={r.name}>
                  <td className="l st-rank">{i + 1}</td>
                  <td className="l">
                    <span className="st-team"><Logo id={r.club} />{r.name}</span>
                  </td>
                  <td className="st-pts">{r.g}</td>
                  <td>{r.a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="st-records">
            {d.records.map((r, i) => (
              <div className="st-rec" key={i}>
                <span className="st-rec-label">{r.label}</span>
                <span className="st-rec-val"><Logo id={r.club} />{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="st-note">{STANDINGS.season} 시즌 · 샘플 데이터</span>
    </div>
  )
}
