// 기자 신뢰도 가이드 — 공신력 평가 기준과 소스별 정보
import { JOURNALISTS } from '../data/journalists.js'

const TIER = {
  5: { label: 'Tier 1', desc: '단독 보도 적중률 최상급. "Here we go" 급 확정 보도.' },
  4: { label: 'Trusted', desc: '소속 매체·담당 영역에서 검증된 신뢰도.' },
  3: { label: 'Solid', desc: '대체로 정확하나 구단 편향·설레발 가능성 존재.' },
  2: { label: 'Tabloid', desc: '루머 비중 높음. 교차 확인 필수.' },
}

export default function Sources({ counts }) {
  const sorted = [...JOURNALISTS].sort((a, b) => b.credibility - a.credibility)
  return (
    <div className="sources">
      <div className="sources-head">
        <h2>Sources</h2>
        <p>
          이 사이트가 추적하는 기자·언론사와 자체 공신력 평가입니다. 점수는 보도
          적중률, 소속 매체, 담당 영역 전문성을 기준으로 하며 주기적으로
          조정됩니다. 낮은 등급의 소스도 흐름 파악을 위해 수집하되, 원문 링크로
          직접 확인하는 것을 권장합니다.
        </p>
      </div>
      <div className="sources-grid">
        {sorted.map((j) => (
          <a
            key={j.id}
            className="source-card"
            href={j.profileUrl}
            target="_blank"
            rel="noreferrer"
            style={{ '--jcolor': j.color }}
          >
            <div className="sc-top">
              <span className="sc-tier">{TIER[j.credibility].label}</span>
              <span className="jh-cred">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} className={'dot' + (i < j.credibility ? ' on' : '')} />
                ))}
              </span>
            </div>
            <span className="sc-name">{j.nameEn}</span>
            <span className="sc-name-ko">{j.name}</span>
            <span className="sc-meta">
              {j.outlet} · {j.specialty}
            </span>
            <span className="sc-desc">{TIER[j.credibility].desc}</span>
            <span className="sc-foot">
              <em>{counts?.get(j.id) || 0} reports</em>
              <span>{j.handle} ↗</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
