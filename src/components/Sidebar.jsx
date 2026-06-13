// 좌측 내비게이션
const ITEMS = [
  { id: 'matrix', name: 'Press Matrix', desc: '기자 × 구단 리포트' },
  { id: 'transfers', name: 'Transfer Tracker', desc: '이적 타임라인 · 가격' },
  { id: 'schedule', name: 'Schedule', desc: '월드컵 · 리그 일정' },
  { id: 'sources', name: 'Sources', desc: '기자 신뢰도 가이드' },
  { id: 'teaminfo', name: 'Player Stats', desc: '선발 횟수 · 평점 · 포지션', soon: true },
]

export default function Sidebar({ page, onNav, onHome }) {
  return (
    <aside className="sidebar">
      <button className="side-home" onClick={onHome}>← Home</button>
      <div className="side-section">
        <span className="side-label">Sections</span>
        {ITEMS.map((it) => (
          <button
            key={it.id}
            className={
              'side-item' + (page === it.id ? ' active' : '') + (it.soon ? ' soon' : '')
            }
            onClick={() => onNav(it.id)}
          >
            <span className="si-name">
              {it.name}
              {it.soon && <em className="si-tag">SOON</em>}
            </span>
            <span className="si-desc">{it.desc}</span>
          </button>
        ))}
      </div>
      <div className="side-foot">Facts only.<br />의견이 아닌 팩트만.</div>
    </aside>
  )
}
