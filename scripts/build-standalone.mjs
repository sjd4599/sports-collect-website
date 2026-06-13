// React 프로젝트의 데이터/스타일을 그대로 읽어
// 빌드 없이 브라우저에서 바로 열 수 있는 standalone.html을 생성합니다.
// 사용법: node scripts/build-standalone.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const { JOURNALISTS } = await import(join(root, 'src/data/journalists.js'))
const { CLUBS, LEAGUES } = await import(join(root, 'src/data/clubs.js'))
const ARTICLES = JSON.parse(readFileSync(join(root, 'src/data/articles.json'), 'utf8'))
const TRANSFERS = JSON.parse(readFileSync(join(root, 'src/data/transfers.json'), 'utf8'))
const FIXTURES = JSON.parse(readFileSync(join(root, 'src/data/fixtures.json'), 'utf8'))
const SQUADS = JSON.parse(readFileSync(join(root, 'src/data/squads.json'), 'utf8'))
const STANDINGS = JSON.parse(readFileSync(join(root, 'src/data/standings.json'), 'utf8'))
const CSS = readFileSync(join(root, 'src/styles.css'), 'utf8')

// standalone 전용: preview/expanded를 모두 렌더해두고 클래스로 토글
const EXTRA_CSS = `
.g-cell .xp { display: none; }
.g-cell.expanded .xp { display: flex; }
.g-cell.expanded .preview { display: none; }
`

const APP_JS = String.raw`
const CLUB_COL = '235px'
const HEAD_ROW = '112px'
const ROW = '160px'
const EXPAND_ROW = '540px'
const COL = '230px'
const EXPAND_COL = '700px'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// ── 언어 모드 (ko / en) — 좌하단 토글 ──
let lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ko'
const I18N = {
  ko: {
    searchPh: '검색 — 단어 또는 구단 (예: 이적, Arsenal, 골키퍼)',
    searchNote: '전체 리그 검색 중',
    noResults: '에 대한 결과가 없습니다.',
    noResultsHint: '구단명(한/영) 또는 기사 속 단어로 검색해보세요.',
    readOrig: '원문 보기 ↗', article: '기사', origShort: '원문 ↗',
    sd_matrix: '기자 × 구단 리포트', sd_transfers: '이적 타임라인 · 가격',
    sd_schedule: '월드컵 · 리그 일정', sd_sources: '기자 신뢰도 가이드',
    sd_teaminfo: '선발 횟수 · 평점 · 포지션',
    sideFoot: 'Facts only.<br />의견이 아닌 팩트만.',
    soonTeaminfo: '선발 횟수·평점·평균 포지션 — 준비 중입니다.',
    srcIntro: '이 사이트가 추적하는 기자·언론사와 자체 공신력 평가입니다. 점수는 보도 적중률, 소속 매체, 담당 영역 전문성을 기준으로 하며 주기적으로 조정됩니다. 낮은 등급의 소스도 흐름 파악을 위해 수집하되, 원문 링크로 직접 확인하는 것을 권장합니다.',
    tier5: '단독 보도 적중률 최상급. "Here we go" 급 확정 보도.',
    tier4: '소속 매체·담당 영역에서 검증된 신뢰도.',
    tier3: '대체로 정확하나 구단 편향·설레발 가능성 존재.',
    tier2: '루머 비중 높음. 교차 확인 필수.',
    types: { interest: '관심', contact: '접촉', talks: '협상', bid: '입찰', demand: '요구액', agreed: '합의', medical: '메디컬', option: '옵션', done: '완료' },
    tmStarters: '주전 베스트 XI', tmBench: '후보 · 로테이션', tmSchedule: '일정',
    tmNoSchedule: '등록된 일정이 없습니다 — 시즌 오프 기간이거나 수집 예정입니다.',
    tmNoSquad: '스쿼드 데이터 준비 중입니다 — 자동 수집으로 채워질 예정입니다.',
    tmTotal: '스쿼드 가치', tmEst: '베스트 XI는 가장 최근 실전 경기 선발 기준 · 시장가치는 Transfermarkt 기반 추정치',
  },
  en: {
    searchPh: 'Search — keyword or club (e.g. transfer, Arsenal)',
    searchNote: 'Searching all leagues',
    noResults: ' — no results.',
    noResultsHint: 'Try a club name or a keyword from the articles.',
    readOrig: 'Read original ↗', article: 'Article', origShort: 'Source ↗',
    sd_matrix: 'Journalist × club reports', sd_transfers: 'Transfer timelines · fees',
    sd_schedule: 'World Cup · league schedule', sd_sources: 'Source credibility guide',
    sd_teaminfo: 'Starts · ratings · positions',
    sideFoot: 'Facts only.<br />No opinions.',
    soonTeaminfo: 'Starts, ratings and average positions — coming soon.',
    srcIntro: 'The journalists and outlets this site tracks, with our own credibility ratings based on track record, outlet and beat expertise. Lower-tier sources are collected for signal — always verify via the original link.',
    tier5: 'Elite accuracy. "Here we go"-grade confirmations.',
    tier4: 'Proven reliability within their outlet and beat.',
    tier3: 'Mostly accurate, some club bias or hype.',
    tier2: 'Rumour-heavy. Cross-check required.',
    types: { interest: 'Interest', contact: 'Contact', talks: 'Talks', bid: 'Bid', demand: 'Asking', agreed: 'Agreed', medical: 'Medical', option: 'Option', done: 'Done' },
    tmStarters: 'Starting XI', tmBench: 'Bench · rotation', tmSchedule: 'Schedule',
    tmNoSchedule: 'No fixtures registered — off-season or pending collection.',
    tmNoSquad: 'Squad data coming soon — will be filled by auto-collection.',
    tmTotal: 'Squad value', tmEst: 'XI = most recent competitive lineup · market values are Transfermarkt-style estimates',
  },
}
const t = (k) => I18N[lang][k] !== undefined ? I18N[lang][k] : k

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n) })
  const foot = document.querySelector('.side-foot')
  if (foot) foot.innerHTML = t('sideFoot')
  const si = document.getElementById('search')
  if (si) si.placeholder = t('searchPh')
  const lt = document.getElementById('lang-toggle')
  if (lt) lt.textContent = lang === 'ko' ? 'EN' : '한국어'
}
const leagueName = (id) => (LEAGUES.find((l) => l.id === id) || {}).name || ''

// 게시 후 30일이 지난 기사는 자동으로 사라집니다 (데이터는 보존)
const FRESH_DAYS = 30
const cutoffTs = Date.now() - FRESH_DAYS * 86400000
const LIVE_ARTICLES = ARTICLES.filter((a) => new Date(a.date + 'T00:00:00').getTime() >= cutoffTs)

// ── 인덱싱 ──
const baseIndex = new Map()
for (const a of LIVE_ARTICLES) {
  for (const key of [a.journalist + '|' + a.club, 'all|' + a.club]) {
    if (!baseIndex.has(key)) baseIndex.set(key, [])
    baseIndex.get(key).push(a)
  }
}
for (const list of baseIndex.values()) list.sort((x, y) => (x.date < y.date ? 1 : -1))

// 매트릭스 맨 앞 '종합' 열
const ALL_SOURCE = { id: 'all', name: '종합', nameEn: 'All Sources', outlet: '모든 소스 통합', specialty: '', credibility: 0, profileUrl: '', color: '#161513' }
const MATRIX_JOURNALISTS = [ALL_SOURCE].concat(JOURNALISTS)

const journalistCounts = new Map()
for (const a of LIVE_ARTICLES) journalistCounts.set(a.journalist, (journalistCounts.get(a.journalist) || 0) + 1)
journalistCounts.set('all', LIVE_ARTICLES.length)
const isNewDate = (d) => Date.now() - new Date(d + 'T00:00:00').getTime() < 2 * 86400000

// 'MM.DD' 또는 발행 시각이 있으면 'MM.DD HH:MM'
const fmtWhen = (a) => {
  const d = a.date.slice(5).replace('-', '.')
  if (!a.publishedAt) return d
  const t = new Date(a.publishedAt)
  return d + ' ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
}
const lastUpdated = LIVE_ARTICLES.reduce((m, a) => (a.date > m ? a.date : m), '')
const lastTs = LIVE_ARTICLES.reduce((m, a) => Math.max(m, a.publishedAt ? Date.parse(a.publishedAt) : Date.parse(a.date)), 0)
const lastLabel = (() => { const t = new Date(lastTs); return lastUpdated + ' ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') })()
document.getElementById('topbar-meta').textContent = LIVE_ARTICLES.length + ' reports · updated ' + lastLabel
document.getElementById('home-date').textContent = new Date().toISOString().slice(0, 10)

// 홈 배너: 최신 기사 8건 티커
{
  const latest = [...LIVE_ARTICLES]
    .sort((a, b) => (b.publishedAt ? Date.parse(b.publishedAt) : Date.parse(b.date)) - (a.publishedAt ? Date.parse(a.publishedAt) : Date.parse(a.date)))
    .slice(0, 8)
  if (latest.length) {
    const jn = (id) => (JOURNALISTS.find((j) => j.id === id) || {}).nameEn || id
    const item = (a) => {
      const club = CLUBS.find((c) => c.id === a.club) || {}
      const thumb = a.imageUrl
        ? '<span class="ht-thumb"><img src="' + a.imageUrl + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"></span>'
        : '<span class="ht-thumb" style="background:linear-gradient(135deg,' + (club.color || '#999') + '2e,' + (club.color || '#999') + '10)">' +
          (club.logo ? '<img class="ht-thumb-logo" src="' + club.logo + '" alt="" loading="lazy">' : '') + '</span>'
      return '<span class="ht-item">' + thumb + '<span class="ht-text"><i>' +
        fmtWhen(a) + ' · ' + esc(jn(a.journalist)) + '</i><b>' + esc(a.titleKo) + '</b></span></span>'
    }
    document.getElementById('ht-track').innerHTML = latest.concat(latest).map(item).join('')
    document.getElementById('home-ticker').style.display = ''
  }
}
document.getElementById('hero-sub').textContent =
  "Tier-one journalists × Europe's biggest clubs · " + LIVE_ARTICLES.length + ' reports · updated ' + lastLabel

// ── 상태 ──
let currentLeague = 'epl'
let currentSection = 'matrix' // matrix | transfers | schedule | sources

// ── 페이지 전환 (home / app / soon) ──
const PAGES = { home: 'page-home', app: 'page-app', soon: 'page-soon' }
function showPage(name) {
  for (const id of Object.values(PAGES)) document.getElementById(id).style.display = 'none'
  document.getElementById(PAGES[name]).style.display = ''
}
const SOON_TEXT = () => ({
  teaminfo: ['Player Stats', t('soonTeaminfo')],
})
function goto(target) {
  if (target === 'home') return showPage('home')
  if (['matrix', 'transfers', 'schedule', 'sources'].includes(target)) {
    currentSection = target
    showPage('app')
    renderSidebarActive()
    renderMain()
    return
  }
  const st = SOON_TEXT()[target]
  document.getElementById('soon-title').textContent = st[0]
  document.getElementById('soon-desc').textContent = st[1]
  showPage('soon')
}
document.querySelectorAll('[data-goto]').forEach((el) => {
  el.addEventListener('click', () => goto(el.dataset.goto))
})
function renderSidebarActive() {
  document.querySelectorAll('.side-item[data-goto]').forEach((el) => {
    el.classList.toggle('active', el.dataset.goto === currentSection)
  })
  document.querySelector('.searchbox').style.display = currentSection === 'matrix' ? '' : 'none'
}

// ── 검색 필터 ──
function applyFilter(query) {
  const q = query.trim().toLowerCase()
  const pool = q ? CLUBS : CLUBS.filter((c) => c.league === currentLeague)
  if (!q) return { clubsShown: pool, index: baseIndex }
  const idx = new Map()
  const shown = []
  for (const club of pool) {
    const clubMatch = [club.name, club.nameEn, club.short, leagueName(club.league)]
      .some((s) => s.toLowerCase().includes(q))
    let any = false
    for (const j of JOURNALISTS) {
      const key = j.id + '|' + club.id
      const items = baseIndex.get(key) || []
      const filtered = clubMatch ? items : items.filter((a) =>
        [a.titleKo, a.summaryKo, a.outlet, j.name, j.nameEn].some((s) => s.toLowerCase().includes(q)))
      if (filtered.length) {
        idx.set(key, filtered)
        const ak = 'all|' + club.id
        idx.set(ak, (idx.get(ak) || []).concat(filtered).sort((x, y) => (x.date < y.date ? 1 : -1)))
        any = true
      }
    }
    if (any || clubMatch) shown.push(club)
  }
  return { clubsShown: shown, index: idx }
}

// ── 매트릭스 렌더 ──
const main = document.getElementById('main')

function clubLogoHtml(club, size) {
  const img = club.logo
    ? '<img src="' + club.logo + '" alt="' + esc(club.nameEn) + '" loading="lazy" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
    : ''
  const fbDisplay = club.logo ? 'none' : 'flex'
  return '<span class="club-logo" style="width:' + size + 'px;height:' + size + 'px">' + img +
    '<span class="logo-fallback" style="background:' + club.color + ';display:' + fbDisplay + '">' + club.short + '</span></span>'
}

function credHtml(j) {
  if (!j.credibility) return ''
  let dots = ''
  for (let i = 0; i < 5; i++) dots += '<i class="dot' + (i < j.credibility ? ' on' : '') + '"></i>'
  return '<span class="jh-cred" title="공신력 ' + j.credibility + '/5">' + dots + '</span>'
}

function previewHtml(items) {
  const latest = items[0]
  const more = items.length > 1 ? '<em class="pv-more">+' + (items.length - 1) + '</em>' : ''
  const nb = isNewDate(latest.date) ? '<em class="new-badge">NEW</em>' : ''
  return '<div class="preview"><span class="pv-date">' + latest.date + nb + more + '</span>' +
    '<span class="pv-title">' + esc(latest.titleKo) + '</span></div>'
}

function expandedHtml(club, j, items) {
  const latest = items[0]
  const older = items.slice(1)
  const logo = club.logo ? '<img class="thumb-logo" src="' + club.logo + '" alt="" loading="lazy">' : ''
  let html = '<div class="xp"><div class="xp-head">' +
    '<span class="xp-jname">' + esc(j.nameEn) + '</span><span class="xp-on">on</span>' +
    '<span class="xp-cname">' + esc(club.nameEn) + '</span></div><div class="xp-scroll">'
  const photo = latest.imageUrl
    ? '<img class="thumb-photo" src="' + latest.imageUrl + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">'
    : club.logo
      ? '<img class="thumb-logo-big" src="' + club.logo + '" alt="" loading="lazy">'
      : '<span class="thumb-img-label">Image</span>'
  const tvCls = latest.imageUrl ? ' has-photo' : ' brand'
  const tvStyle = latest.imageUrl ? '' : ' style="background:linear-gradient(135deg,' + club.color + '2e 0%,' + club.color + '10 55%,transparent 100%)"'
  const cornerLogo = latest.imageUrl ? logo : ''
  html += '<a class="thumb" href="' + latest.url + '" target="_blank" rel="noreferrer">' +
    '<div class="thumb-visual' + tvCls + '"' + tvStyle + '>' + photo + cornerLogo +
    '<span class="thumb-chip">' + (latest.sourceType === 'x' ? '𝕏 POST' : 'ARTICLE') + ' — ' + esc(latest.outlet) + '</span>' +
    (latest.aiImage ? '<span class="ai-chip">AI IMAGE</span>' : '') + '</div>' +
    '<div class="thumb-body"><span class="thumb-date">' + fmtWhen(latest) + ' · LATEST' + (isNewDate(latest.date) ? '<em class="new-badge">NEW</em>' : '') + '</span>' +
    '<span class="thumb-title">' + esc(latest.titleKo) + '</span>' +
    '<p class="thumb-summary">' + esc(latest.summaryKo) + '</p>' +
    '<span class="thumb-link">' + t('readOrig') + '</span></div></a>'
  if (older.length) {
    html += '<div class="older"><span class="older-label">Earlier reports</span>'
    for (const a of older) {
      html += '<a class="older-item" href="' + a.url + '" target="_blank" rel="noreferrer">' +
        '<span class="oi-date">' + a.date + '</span>' +
        '<span class="oi-title">' + esc(a.titleKo) + '</span>' +
        '<p class="oi-summary">' + esc(a.summaryKo) + '</p>' +
        '<span class="oi-meta">' + (a.sourceType === 'x' ? '𝕏' : t('article')) + ' · ' + esc(a.outlet) + ' · ' + t('origShort') + '</span></a>'
    }
    html += '</div>'
  }
  return html + '</div></div>'
}

function renderMatrix() {
  const { clubsShown, index } = applyFilter(document.getElementById('search').value)
  let active = null

  const qNow = document.getElementById('search').value.trim()
  let tabs = '<div class="league-tabs">'
  for (const l of LEAGUES) {
    tabs += '<button class="ltab' + (l.id === currentLeague && !qNow ? ' on' : '') + '" data-league="' + l.id + '">' + l.flag + ' ' + esc(l.name) + '</button>'
  }
  if (qNow) tabs += '<span class="ltab-search-note">' + t('searchNote') + '</span>'
  tabs += '</div>'

  if (!clubsShown.length) {
    const q = document.getElementById('search').value
    main.innerHTML = tabs + '<div class="no-results"><p>"' + esc(q) + '"' + t('noResults') + '</p>' +
      '<span>' + t('noResultsHint') + '</span></div>'
    bindTabs()
    return
  }

  let html = tabs + '<div class="grid-scroll" id="grid-scroll"><div class="grid" id="grid">'
  html += '<div class="g-corner" data-reset><span>Clubs ↓</span><span>Journalists →</span></div>'
  MATRIX_JOURNALISTS.forEach((j, c) => {
    html += '<a class="g-jhead' + (j.id === 'all' ? ' jh-all' : '') + '" data-reset data-col="' + c + '"' +
      (j.profileUrl ? ' href="' + j.profileUrl + '" target="_blank" rel="noreferrer"' : '') + '>' +
      '<span class="jh-name">' + esc(j.nameEn) + '</span>' +
      '<span class="jh-outlet">' + esc(j.outlet) + '</span>' +
      '<span class="jh-count">' + (journalistCounts.get(j.id) || 0) + ' reports</span>' + credHtml(j) + '</a>'
  })
  clubsShown.forEach((club, r) => {
    html += '<div class="g-club g-club-click" data-reset data-row="' + r + '" data-clubid="' + club.id + '" title="' + esc(club.nameEn) + ' — 스쿼드/일정 보기">' + clubLogoHtml(club, 34) +
      '<span class="club-en">' + esc(club.nameEn) + '</span></div>'
    MATRIX_JOURNALISTS.forEach((j, c) => {
      const items = index.get(j.id + '|' + club.id) || []
      if (!items.length) {
        html += '<div class="g-cell empty" data-reset></div>'
      } else {
        html += '<div class="g-cell has" data-r="' + r + '" data-c="' + c + '">' +
          previewHtml(items) + expandedHtml(club, j, items) + '</div>'
      }
    })
  })
  html += '</div></div>'
  main.innerHTML = html
  bindTabs()

  const grid = document.getElementById('grid')

  // 기자 헤더 위에서만 휠 → 가로 스크롤, 표 본문에서는 일반 세로 스크롤
  const gs = document.getElementById('grid-scroll')
  gs.addEventListener('wheel', (e) => {
    if (e.shiftKey) return
    if (!e.target.closest('.g-jhead, .g-corner')) return // 본문은 그대로 아래로
    const max = gs.scrollWidth - gs.clientWidth
    if (max <= 0) return
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    e.preventDefault()
    gs.scrollLeft = Math.min(max, Math.max(0, gs.scrollLeft + d))
  }, { passive: false })

  // 잡고 끌어서 둘러보기 (가로 = 표, 세로 = 페이지)
  {
    let down = null
    let dragMoved = false
    gs.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
      down = { x: e.clientX, y: e.clientY, sl: gs.scrollLeft, st: main.scrollTop }
      dragMoved = false
    })
    window.addEventListener('mousemove', (e) => {
      if (!down) return
      const dx = e.clientX - down.x
      const dy = e.clientY - down.y
      if (!dragMoved && Math.abs(dx) + Math.abs(dy) > 6) {
        dragMoved = true
        gs.dataset.dragging = '1'
        active = null
        applyLayout()
      }
      if (!dragMoved) return
      e.preventDefault()
      gs.scrollLeft = down.sl - dx
      main.scrollTop = down.st - dy
    })
    window.addEventListener('mouseup', () => {
      if (!down) return
      down = null
      setTimeout(() => delete gs.dataset.dragging, 50)
    })
    gs.addEventListener('click', (e) => {
      if (dragMoved) { e.preventDefault(); e.stopPropagation(); dragMoved = false }
    }, true)
    gs.addEventListener('dragstart', (e) => e.preventDefault())
  }

  function applyLayout() {
    const cols = [CLUB_COL].concat(MATRIX_JOURNALISTS.map((_, i) => (active && active.c === i ? EXPAND_COL : COL)))
    const rows = [HEAD_ROW].concat(clubsShown.map((_, i) => (active && active.r === i ? EXPAND_ROW : ROW)))
    grid.style.gridTemplateColumns = cols.join(' ')
    grid.style.gridTemplateRows = rows.join(' ')
    grid.classList.toggle('focusing', !!active)
    grid.querySelectorAll('.g-cell.has').forEach((cell) => {
      const r = +cell.dataset.r, c = +cell.dataset.c
      const expanded = active && active.r === r && active.c === c
      cell.classList.toggle('expanded', !!expanded)
      cell.classList.toggle('dimmed', !!active && !expanded)
    })
    grid.querySelectorAll('.g-jhead').forEach((el) => el.classList.toggle('is-on', !!active && active.c === +el.dataset.col))
    grid.querySelectorAll('.g-club').forEach((el) => el.classList.toggle('is-on', !!active && active.r === +el.dataset.row))
  }

  grid.querySelectorAll('.g-cell.has').forEach((cell) => {
    cell.addEventListener('mouseenter', () => {
      if (gs.dataset.dragging) return
      active = { r: +cell.dataset.r, c: +cell.dataset.c }
      applyLayout()
    })
  })
  grid.querySelectorAll('[data-reset]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      if (gs.dataset.dragging) return
      active = null
      applyLayout()
    })
  })
  grid.querySelectorAll('.g-club-click').forEach((el) => {
    el.addEventListener('click', () => openTeam(el.dataset.clubid))
  })
  grid.addEventListener('mouseleave', () => { active = null; applyLayout() })
  applyLayout()
}

function bindTabs() {
  main.querySelectorAll('.ltab').forEach((el) => {
    el.addEventListener('click', () => {
      currentLeague = el.dataset.league
      const si = document.getElementById('search')
      si.value = ''
      document.getElementById('search-clear').style.display = 'none'
      renderMatrix()
    })
  })
}

// ── Transfer Tracker 렌더 ──
const TYPE_KO = new Proxy({}, { get: (_, k) => t('types')[k] || k })
const STATUS_EN = { done: 'Done', agreed: 'Agreed', advanced: 'Advanced', rumour: 'Rumour' }
let ttSel = null

function timelineHtml(sel) {
  let html = '<div class="tt-tl-head"><b>' + esc(sel.name) + '</b>' +
    '<span>' + esc(sel.pos) + ' · ' + esc(sel.fromLabel) + ' → ' + esc(sel.toLabel) + '</span>' +
    '<em>' + esc(sel.priceLabel) + '</em></div><div class="tt-tl-track">'
  sel.events.forEach((e, i) => {
    html += '<div class="tt-ev ev-' + e.type + '" style="--ed:' + (i * 0.1) + 's"><span class="ev-date">' + e.date + '</span>' +
      '<span class="ev-node"></span>' +
      '<span class="ev-club">' + esc(e.clubLabel) + '</span>' +
      '<span class="ev-type">' + (TYPE_KO[e.type] || e.type) + '</span>' +
      (e.feeLabel ? '<span class="ev-fee">' + esc(e.feeLabel) + '</span>' : '') +
      '<p class="ev-note">' + esc(e.noteKo) + '</p></div>'
  })
  return html + '</div>'
}

// 이적 데이터의 팀 라벨 → 구단 데이터 매핑 (로고 표시용)
const LABEL_MAP = {
  'RB Leipzig': 'leipzig', "Nott'm Forest": 'forest', Forest: 'forest',
  'Man City': 'mancity', 'Man Utd': 'manutd', Newcastle: 'newcastle',
  Liverpool: 'liverpool', Barcelona: 'barcelona', Inter: 'inter',
  Leverkusen: 'leverkusen', Arsenal: 'arsenal', Atalanta: 'atalanta',
  Bayern: 'bayern', 'Real Madrid': 'realmadrid', Dortmund: 'dortmund',
  'Aston Villa': 'astonvilla', Juventus: 'juventus', Como: 'como',
  Tottenham: 'tottenham', Chelsea: 'chelsea',
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

function linkedClubs(t) {
  const from = clubFor(t.fromLabel).nameEn
  const seen = new Set()
  const out = []
  for (const label of [t.toLabel].concat(t.events.map((e) => e.clubLabel))) {
    const c = clubFor(label)
    if (c.nameEn === from || seen.has(c.nameEn)) continue
    seen.add(c.nameEn)
    out.push(c)
  }
  return out.slice(0, 3)
}

function nodeHtml(c, role) {
  const visual = c.logo
    ? '<img src="' + c.logo + '" alt="' + esc(c.nameEn) + '" loading="lazy">'
    : '<i class="tt-node-fb" style="background:' + c.color + '">' + esc(c.short) + '</i>'
  return '<span class="tt-node' + (role ? ' ' + role : '') + '">' + visual + '<small>' + esc(c.nameEn) + '</small></span>'
}

// 선택 변경 시: 전체 재렌더 없이 강조·중앙 패널·타임라인만 갱신 (깜빡임 방지)
function centerHtml(sel) {
  const solid = sel.status === 'done' || sel.status === 'agreed'
  let stack = ''
  linkedClubs(sel).forEach((c, i) => {
    stack += '<div class="tt-stack-row"><span class="tt-line short' + (i === 0 && solid ? ' solid' : '') + '"></span>' +
      nodeHtml(c, i === 0 ? 'to' : 'rival') + '</div>'
  })
  return '<div class="tt-diagram">' +
    nodeHtml(clubFor(sel.fromLabel), 'from') +
    '<span class="tt-line' + (solid ? ' solid' : '') + '"></span>' +
    '<span class="tt-center-photo">' + (sel.photo ? '<img class="tt-photo-img" src="' + sel.photo + '" alt="' + esc(sel.name) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">' : '<span class="tt-photo-label">Photo</span>') + '</span>' +
    '<div class="tt-stack">' + stack + '</div></div>' +
    '<span class="tt-center-name">' + esc(sel.name) + '</span>' +
    '<span class="tt-center-route">' + esc(sel.pos) + ' · ' + esc(sel.fromLabel) + ' → ' + esc(sel.toLabel) + '</span>' +
    '<span class="tt-center-foot"><em class="tt-status st-' + sel.status + '">' + STATUS_EN[sel.status] + '</em>' +
    '<span class="tt-center-price">' + esc(sel.priceLabel) + '</span></span>'
}

function selectTT(id) {
  if (ttSel === id) return
  ttSel = id
  main.querySelectorAll('[data-tt]').forEach((el) => el.classList.toggle('on', el.dataset.tt === id))
  layoutWheel()
  const sel = TRANSFERS.find((t) => t.id === id)
  if (!sel) return
  const center = document.getElementById('tt-center')
  if (center) {
    center.innerHTML = centerHtml(sel)
    center.style.animation = 'none'
    void center.offsetWidth
    center.style.animation = ''
  }
  const tl = document.getElementById('tt-tl')
  if (tl) tl.innerHTML = timelineHtml(sel)
}

// 평면 원호 다이얼 — 항목 수와 무관하게 높이 고정
const WHEEL_STEP = 8
const WHEEL_GAP = 28
const WHEEL_BULGE = 280
const WHEEL_SPAN = 7
let ttVisible = []

function wheelOffset(i, active, n) {
  let d = i - active
  d = ((d % n) + n) % n
  if (d > n / 2) d -= n
  return d
}

// 세로 간격은 균일(off*GAP), 가로 돌출·회전만 곡선 — 정점(off=0)은 오른쪽·수평
function wheelTransform(off) {
  const rad = (off * WHEEL_STEP * Math.PI) / 180
  const dx = WHEEL_BULGE * (Math.cos(rad) - 1)
  const dy = off * WHEEL_GAP
  return 'translate(' + dx.toFixed(1) + 'px, calc(-50% + ' + dy + 'px)) rotate(' + (off * WHEEL_STEP) + 'deg)'
}

// 현재 선택(ttSel)을 중앙으로 두고 모든 이름의 원호 위 위치를 다시 계산
function layoutWheel() {
  const track = document.getElementById('tt-wheel-track')
  if (!track) return
  const n = ttVisible.length
  const active = Math.max(0, ttVisible.indexOf(ttSel))
  track.querySelectorAll('.tt-wheel-item').forEach((li) => {
    const i = +li.dataset.i
    const off = wheelOffset(i, active, n)
    const abs = Math.abs(off)
    li.style.transform = wheelTransform(off)
    const hidden = abs > WHEEL_SPAN
    li.style.opacity = hidden ? '0' : String(Math.max(0.18, 1 - abs * 0.13))
    li.style.visibility = hidden ? 'hidden' : 'visible'
    li.style.zIndex = String(100 - abs)
    li.classList.toggle('on', off === 0)
  })
}

function ttStep(dir) {
  const n = ttVisible.length
  if (!n) return
  const active = Math.max(0, ttVisible.indexOf(ttSel))
  const next = ((active + dir) % n + n) % n
  selectTT(ttVisible[next])
}

// 상태 필터
let ttFilter = 'all'
const TT_FILTERS = [['all', 'All'], ['done', 'Done'], ['talks', 'In talks'], ['rumour', 'Rumour']]
const matchFilter = (t, f) =>
  f === 'all' ||
  (f === 'done' && t.status === 'done') ||
  (f === 'talks' && (t.status === 'advanced' || t.status === 'agreed')) ||
  (f === 'rumour' && t.status === 'rumour')

function renderTransfers() {
  const sorted = [...TRANSFERS].sort((a, b) => b.value - a.value)
  const visible = sorted.filter((t) => matchFilter(t, ttFilter))
  if (!ttSel || !visible.find((t) => t.id === ttSel)) ttSel = (visible[0] || sorted[0]).id

  let html = '<div class="tt"><div class="tt-strip">' +
    '<span class="tt-strip-label">Live valuations · Summer 2026</span><div class="tt-strip-row"><div class="tt-marquee">'
  for (const t of sorted.concat(sorted)) {
    html += '<button class="tt-chip' + (ttSel === t.id ? ' on' : '') + '" data-tt="' + t.id + '">' +
      '<b>' + esc(t.name) + '</b><span>' + esc(t.priceLabel) + '</span></button>'
  }
  html += '</div></div></div>'

  // 상태 필터 칩
  html += '<div class="tt-filter">'
  for (const [fid, flabel] of TT_FILTERS) {
    html += '<button class="tt-fbtn' + (ttFilter === fid ? ' on' : '') + '" data-ttf="' + fid + '">' + flabel + '</button>'
  }
  html += '</div>'

  // 이름 쳇바퀴 다이얼 + 오른쪽 무대 패널
  ttVisible = visible.map((t) => t.id)
  html += '<div class="tt-arc"><div class="tt-wheel" id="tt-wheel"><span class="tt-wheel-dot"></span><ul class="tt-wheel-track" id="tt-wheel-track">'
  visible.forEach((t, i) => {
    html += '<li class="tt-wheel-item" data-ttw="' + t.id + '" data-i="' + i + '"><button>' + esc(t.name) +
      '<span class="tt-wheel-ix">' + String(sorted.indexOf(t) + 1).padStart(2, '0') + '</span></button></li>'
  })
  const sel0 = TRANSFERS.find((t) => t.id === ttSel)
  html += '</ul></div><div class="tt-stage"><div class="tt-center" id="tt-center">' + (sel0 ? centerHtml(sel0) : '') + '</div></div></div>'

  html += '<div class="tt-timeline" id="tt-tl">' + (sel0 ? timelineHtml(sel0) : '') + '</div>'
  html += '</div>'
  main.innerHTML = html

  // 가격 티커 칩: 올리면 선택
  main.querySelectorAll('[data-tt]').forEach((el) => {
    el.addEventListener('mouseenter', () => selectTT(el.dataset.tt))
  })
  // 휠 이름: 클릭하면 중앙으로
  main.querySelectorAll('[data-ttw]').forEach((el) => {
    el.addEventListener('click', () => selectTT(el.dataset.ttw))
  })
  main.querySelectorAll('[data-ttf]').forEach((el) => {
    el.addEventListener('click', () => { ttFilter = el.dataset.ttf; renderTransfers() })
  })

  // 휠 스크롤·드래그로 다이얼 회전
  const wheelEl = document.getElementById('tt-wheel')
  if (wheelEl) {
    // 휠 = 한 번에 한 칸 (쿨다운 220ms로 관성/연속 이벤트 차단)
    let last = 0
    wheelEl.addEventListener('wheel', (e) => {
      e.preventDefault()
      if (Math.abs(e.deltaY) < 2) return
      const now = Date.now()
      if (now - last < 220) return
      last = now
      ttStep(e.deltaY > 0 ? 1 : -1)
    }, { passive: false })
    let drag = null
    wheelEl.addEventListener('pointerdown', (e) => {
      drag = { y: e.clientY }
      if (wheelEl.setPointerCapture) wheelEl.setPointerCapture(e.pointerId)
    })
    wheelEl.addEventListener('pointermove', (e) => {
      if (!drag) return
      const TH = 44
      let d = e.clientY - drag.y
      while (Math.abs(d) >= TH) { ttStep(d > 0 ? -1 : 1); d += d > 0 ? -TH : TH; drag.y = e.clientY - d }
    })
    const endDrag = () => { drag = null }
    wheelEl.addEventListener('pointerup', endDrag)
    wheelEl.addEventListener('pointerleave', endDrag)
    layoutWheel()
  }
}

// ── 캘린더 (월 이동 가능, 홈/Schedule 공용) ──
const CAL_SHORT = {
  'Bosnia and Herzegovina': 'Bosnia', 'New Zealand': 'NZ', 'Saudi Arabia': 'Saudi',
  'Cape Verde': 'C. Verde', 'Ivory Coast': 'Ivory C.', Netherlands: 'NED', Switzerland: 'SUI',
}
const calShort = (n) => CAL_SHORT[n] || n
const fmtD = (d) => d.slice(5).replace('-', '.')
const SEASON_STARTS = FIXTURES.filter((f) => !f.away)
let calMonth = (FIXTURES[0] ? FIXTURES[0].date : new Date().toISOString()).slice(0, 7)

function shiftMonth(ym, delta) {
  const parts = ym.split('-').map(Number)
  const d = new Date(parts[0], parts[1] - 1 + delta, 1)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

function calHtml(ym, inApp) {
  const parts = ym.split('-').map(Number)
  const y = parts[0], m = parts[1]
  const daysInMonth = new Date(y, m, 0).getDate()
  const firstDow = new Date(y, m - 1, 1).getDay()
  const byDay = {}
  let monthCount = 0
  for (const f of FIXTURES) {
    if (f.date.slice(0, 7) !== ym) continue
    const d = Number(f.date.slice(8))
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(f)
    monthCount++
  }
  let cells = ''
  for (let i = 0; i < firstDow; i++) cells += '<div class="cal-day blank"></div>'
  for (let d = 1; d <= daysInMonth; d++) {
    const fx = byDay[d] || []
    const iso = ym + '-' + String(d).padStart(2, '0')
    cells += '<div class="cal-day' + (fx.length ? ' cal-click' : ' off') + '"' + (fx.length ? ' data-calday="' + iso + '"' : '') + '><span class="cal-num">' + d + '</span>'
    for (const f of fx) {
      if (f.away) {
        const title = (f.home + ' vs ' + f.away + ' · ' + f.stage + (f.venue ? ' · ' + f.venue : '') + (f.time ? ' · ' + f.time : '')).replace(/"/g, '&quot;')
        cells += '<span class="cal-fx" title="' + title + '"><b>' + f.homeFlag + '</b>' + calShort(f.home) + '<i>vs</i><b>' + f.awayFlag + '</b>' + calShort(f.away) + '</span>'
      } else {
        cells += '<span class="cal-fx" title="' + esc(f.comp + ' · ' + f.stage) + '"><b>' + f.compFlag + '</b>' + esc(f.home) + '</span>'
      }
    }
    cells += '</div>'
  }
  const wd = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => '<span class="cal-wd">' + w + '</span>').join('')
  const later = SEASON_STARTS.map((f) =>
    '<button class="cal-later-item" data-calgoto="' + f.date.slice(0, 7) + '"><b>' + f.compFlag + '</b> ' + esc(f.home) + ' · ' + fmtD(f.date) + '</button>').join('')
  return '<div class="home-cal' + (inApp ? ' in-app' : '') + '">' +
    '<div class="cal-nav">' +
    '<button class="cal-nav-btn" data-calnav="-1" aria-label="이전 달">←</button>' +
    '<span class="cal-nav-label">' + y + '.' + String(m).padStart(2, '0') +
    '<em>' + (monthCount > 0 ? monthCount + ' matches & events' : 'No scheduled matches yet') + '</em></span>' +
    '<button class="cal-nav-btn" data-calnav="1" aria-label="다음 달">→</button></div>' +
    '<div class="cal-wd-row">' + wd + '</div>' +
    '<div class="cal">' + cells + '</div>' +
    '<div class="cal-later">' + later + '</div></div>'
}

function renderCalInto(el, inApp) {
  el.innerHTML = calHtml(calMonth, inApp)
  el.querySelectorAll('[data-calnav]').forEach((b) => {
    b.addEventListener('click', () => {
      calMonth = shiftMonth(calMonth, Number(b.dataset.calnav))
      renderCalInto(el, inApp)
    })
  })
  el.querySelectorAll('[data-calgoto]').forEach((b) => {
    b.addEventListener('click', () => {
      calMonth = b.dataset.calgoto
      renderCalInto(el, inApp)
    })
  })
  el.querySelectorAll('[data-calday]').forEach((c) => {
    c.addEventListener('click', () => openDay(c.dataset.calday))
  })
}

// 날짜 클릭 → 그날의 경기/이벤트 상세를 모달로 표시
function openDay(dateStr) {
  const matches = FIXTURES.filter((f) => f.date === dateStr)
  if (!matches.length) return
  const rows = matches.map((f) => {
    if (f.away) {
      return '<div class="cd-row"><span class="cd-comp">' + esc(f.comp + ' · ' + f.stage) + '</span>' +
        '<div class="cd-match"><b>' + (f.homeFlag || '') + ' ' + esc(f.home) + '</b><i>vs</i><b>' + (f.awayFlag || '') + ' ' + esc(f.away) + '</b></div>' +
        '<span class="cd-meta">' + (f.venue ? esc(f.venue) + ' · ' : '') + esc(f.time || 'TBC') + '</span></div>'
    }
    return '<div class="cd-row"><span class="cd-comp">' + esc(f.comp) + '</span>' +
      '<div class="cd-match"><b>' + (f.compFlag || '') + ' ' + esc(f.home) + '</b></div>' +
      '<span class="cd-meta">' + esc(f.stage || '') + '</span></div>'
  }).join('')
  const overlay = document.getElementById('team-modal')
  overlay.querySelector('.tmodal-card').innerHTML =
    '<button class="tmodal-close" aria-label="닫기">×</button>' +
    '<div class="cal-detail"><div class="cd-head">' + dateStr + ' · ' + matches.length + ' 경기·이벤트</div>' + rows + '</div>'
  overlay.style.display = 'flex'
  document.body.style.overflow = 'hidden'
  overlay.querySelector('.tmodal-close').addEventListener('click', closeTeam)
}

renderCalInto(document.getElementById('home-cal-mount'), false)

// ── Schedule 페이지 (캘린더 좌 + 순위·기록 패널 우) ──
let stLeague = 'epl'
let stTab = 'table'
const ST_TABS = [['table', '순위'], ['scorers', '득점'], ['records', '기록']]

function stClub(id) {
  return CLUBS.find((c) => c.id === id) || { nameEn: id, short: '', color: '#999', logo: null }
}
function stLogo(c, cls) {
  return c.logo
    ? '<img src="' + c.logo + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
    : '<i class="fb' + (cls ? ' ' + cls : '') + '" style="background:' + (c.color || '#999') + '">' + esc(c.short || '') + '</i>'
}
function stTeamCell(id) {
  const c = stClub(id)
  return '<span class="st-team">' + stLogo(c) + esc(c.nameEn) + '</span>'
}
function standingsBody() {
  const d = STANDINGS[stLeague]
  if (!d) return '<p class="st-note">데이터 준비 중입니다.</p>'
  if (stTab === 'table') {
    let h = '<table class="st-table"><thead><tr><th class="l">#</th><th class="l">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>'
    d.table.forEach((r, i) => {
      h += '<tr><td class="l st-rank">' + (i + 1) + '</td><td class="l">' + stTeamCell(r.club) + '</td>' +
        '<td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td>' +
        '<td>' + (r.gd > 0 ? '+' : '') + r.gd + '</td><td class="st-pts">' + r.pts + '</td></tr>'
    })
    return h + '</tbody></table>'
  }
  if (stTab === 'scorers') {
    let h = '<table class="st-table"><thead><tr><th class="l">#</th><th class="l">Player</th><th>G</th><th>A</th></tr></thead><tbody>'
    d.scorers.forEach((r, i) => {
      const c = stClub(r.club)
      h += '<tr><td class="l st-rank">' + (i + 1) + '</td>' +
        '<td class="l"><span class="st-team">' + stLogo(c) + esc(r.name) + '</span></td>' +
        '<td class="st-pts">' + r.g + '</td><td>' + r.a + '</td></tr>'
    })
    return h + '</tbody></table>'
  }
  let h = '<div class="st-records">'
  d.records.forEach((r) => {
    const c = stClub(r.club)
    h += '<div class="st-rec"><span class="st-rec-label">' + esc(r.label) + '</span>' +
      '<span class="st-rec-val">' + stLogo(c) + esc(r.value) + '</span></div>'
  })
  return h + '</div>'
}
function renderStandings() {
  const card = document.getElementById('sched-side')
  if (!card) return
  let h = '<div class="st-leagues">'
  for (const l of LEAGUES) {
    if (l.id === 'worldcup') continue
    h += '<button class="st-league' + (stLeague === l.id ? ' on' : '') + '" data-stl="' + l.id + '">' + esc(l.name) + '</button>'
  }
  h += '</div><div class="st-tabs">'
  for (const tb of ST_TABS) {
    h += '<button class="st-tab' + (stTab === tb[0] ? ' on' : '') + '" data-stt="' + tb[0] + '">' + tb[1] + '</button>'
  }
  h += '</div><div class="st-body">' + standingsBody() + '</div>' +
    '<span class="st-note">' + (STANDINGS.season || '') + ' 시즌 · 샘플 데이터</span>'
  card.innerHTML = h
  card.querySelectorAll('[data-stl]').forEach((b) => b.addEventListener('click', () => { stLeague = b.dataset.stl; renderStandings() }))
  card.querySelectorAll('[data-stt]').forEach((b) => b.addEventListener('click', () => { stTab = b.dataset.stt; renderStandings() }))
}

function renderSchedule() {
  main.innerHTML = '<div class="sched-grid"><div class="sched-cal" id="sched-cal-mount"></div>' +
    '<div class="sched-side"><div class="sched-side-card" id="sched-side"></div></div></div>'
  renderCalInto(document.getElementById('sched-cal-mount'), true)
  renderStandings()
}

// ── Sources 페이지 (기자 신뢰도 가이드) ──
const TIER = () => ({
  5: ['Tier 1', t('tier5')],
  4: ['Trusted', t('tier4')],
  3: ['Solid', t('tier3')],
  2: ['Tabloid', t('tier2')],
})
function renderSources() {
  const sorted = [...JOURNALISTS].sort((a, b) => b.credibility - a.credibility)
  let html = '<div class="sources"><div class="sources-head"><h2>Sources</h2>' +
    '<p>' + t('srcIntro') + '</p></div>' +
    '<div class="sources-grid">'
  for (const j of sorted) {
    const [tl, td] = TIER()[j.credibility]
    html += '<a class="source-card" href="' + j.profileUrl + '" target="_blank" rel="noreferrer" style="--jcolor:' + j.color + '">' +
      '<div class="sc-top"><span class="sc-tier">' + tl + '</span>' + credHtml(j) + '</div>' +
      '<span class="sc-name">' + esc(j.nameEn) + '</span>' +
      '<span class="sc-name-ko">' + esc(j.name) + '</span>' +
      '<span class="sc-meta">' + esc(j.outlet) + ' · ' + esc(j.specialty) + '</span>' +
      '<span class="sc-desc">' + td + '</span>' +
      '<span class="sc-foot"><em>' + (journalistCounts.get(j.id) || 0) + ' reports</em><span>' + esc(j.handle) + ' ↗</span></span></a>'
  }
  html += '</div></div>'
  main.innerHTML = html
}

// ── 팀 팝업: 스쿼드 피치 + 시장가치 + 일정 ──
function pitchSlots(formation) {
  const lines = formation.split('-').map(Number)
  const slots = [{ x: 50, y: 90 }] // GK
  const yTop = 16, yBack = 72
  lines.forEach((cnt, li) => {
    const y = lines.length === 1 ? yBack : yBack - (li * (yBack - yTop)) / (lines.length - 1)
    for (let j = 0; j < cnt; j++) slots.push({ x: (100 / (cnt + 1)) * (j + 1), y })
  })
  return slots
}

const fmtV = (v) => (v == null ? '—' : v >= 1 ? '€' + (v % 1 ? v.toFixed(1) : v) + 'M' : '€' + Math.round(v * 1000) + 'K')

function teamFixtures(club) {
  return FIXTURES.filter((f) => f.home === club.nameEn || f.away === club.nameEn)
}

// ── 선수 호버 스탯 (추정치 — 선수명+포지션 기반 결정적 생성) ──
function spHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function spRng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function spGroup(p){p=String(p||'').toUpperCase();if(p==='GK')return 'gk';if(/CB|LB|RB|LWB|RWB|WB|DF/.test(p))return 'def';if(/DM|CM|CAM|AM|LM|RM|MF|MID/.test(p))return 'mid';return 'fwd'}
function spStats(pl){
  const r=spRng(spHash((pl.name||'')+'|'+(pl.pos||'')));const g=spGroup(pl.pos);
  const matches=24+Math.floor(r()*15);const rating=(6.4+r()*1.6).toFixed(2);
  if(g==='gk')return{gk:true,group:'gk',matches,rating,clean:4+Math.floor(r()*13),saves:45+Math.floor(r()*70),conceded:18+Math.floor(r()*28)};
  let goals,assists,xg,xa,shots;
  if(g==='def'){goals=Math.floor(r()*4);assists=Math.floor(r()*5);xg=0.5+r()*3;xa=0.5+r()*3;shots=8+Math.floor(r()*14)}
  else if(g==='mid'){goals=2+Math.floor(r()*8);assists=3+Math.floor(r()*9);xg=2+r()*6;xa=2+r()*7;shots=20+Math.floor(r()*30)}
  else{goals=7+Math.floor(r()*18);assists=2+Math.floor(r()*9);xg=7+r()*15;xa=1.5+r()*6;shots=45+Math.floor(r()*55)}
  const nDots=Math.min(14,Math.max(5,Math.round(shots/6)));const map=[];let gl=goals;
  for(let i=0;i<nDots;i++){let x,y;
    if(g==='fwd'){x=28+r()*44;y=6+r()*32}else if(g==='mid'){x=18+r()*64;y=18+r()*52}else{x=22+r()*56;y=32+r()*52}
    const goal=gl>0&&r()<0.3;if(goal)gl--;map.push({x,y,goal})}
  let ax,ay;
  if(g==='fwd'){ax=50+(r()-0.5)*38;ay=20+r()*16}else if(g==='mid'){ax=50+(r()-0.5)*46;ay=44+r()*14}else{ax=50+(r()-0.5)*52;ay=66+r()*16}
  const rx=g==='def'?27:18,ry=g==='fwd'?22:16,heat=[];
  for(let i=0;i<11;i++){heat.push({x:Math.max(5,Math.min(95,ax+(r()-0.5)*rx*2)),y:Math.max(5,Math.min(95,ay+(r()-0.5)*ry*2)),w:0.35+r()*0.65})}
  return{group:g,matches,rating,goals,assists,xg:xg.toFixed(1),xa:xa.toFixed(1),shots,map,avg:{x:ax,y:ay},heat};
}
function heatSVG(s){
  let blobs='';s.heat.forEach((p)=>{blobs+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+(9+p.w*15).toFixed(1)+'" fill="url(#heatg)" opacity="'+(0.22+p.w*0.4).toFixed(2)+'"/>'});
  return '<svg class="heat-svg" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="heatg"><stop offset="0" stop-color="#ff2d1a"/><stop offset="0.35" stop-color="#ffae18"/><stop offset="0.7" stop-color="#22d36f" stop-opacity="0.55"/><stop offset="1" stop-color="#22d36f" stop-opacity="0"/></radialGradient></defs>'+blobs+'</svg>';
}
function phShots(s){let d='';s.map.forEach((m)=>{d+='<i class="ph-shot'+(m.goal?' goal':'')+'" style="left:'+m.x.toFixed(0)+'%;top:'+m.y.toFixed(0)+'%"></i>'});return d}
function phInfo(pl,s){
  const items=s.group==='gk'?['평점 '+s.rating,'클린시트 '+s.clean,'선방 '+s.saves,'실점 '+s.conceded]:['평점 '+s.rating,'골 '+s.goals,'xG '+s.xg,'도움 '+s.assists];
  return '<div class="ph-info"><b>'+esc(pl.nameKo||pl.name)+'</b><span>'+esc(pl.pos)+'</span>'+items.map((x)=>'<em>'+x+'</em>').join('')+'</div>';
}
function spStat(label,val){return '<div class="sp-stat"><em>'+label+'</em><b>'+val+'</b></div>'}
function statPopHtml(pl,club){
  const s=spStats(pl);const col=club.color||'#161513';
  const head='<div class="sp-head"><b>'+esc(pl.nameKo||pl.name)+'</b><span>'+esc(pl.pos)+'</span></div>';
  if(s.gk)return head+'<div class="sp-grid">'+spStat('경기',s.matches)+spStat('평점',s.rating)+spStat('클린시트',s.clean)+spStat('선방',s.saves)+spStat('실점',s.conceded)+'</div><p class="sp-note">추정치 · 샘플</p>';
  let dots='';s.map.forEach((d)=>{dots+='<i class="sp-shot'+(d.goal?' goal':'')+'" style="left:'+d.x.toFixed(0)+'%;top:'+d.y.toFixed(0)+'%'+(d.goal?';background:'+col+';border-color:'+col:'')+'"></i>'});
  const pitch='<div class="sp-pitch"><span class="sp-pbox"></span><span class="sp-parc"></span>'+dots+'<i class="sp-avg" style="left:'+s.avg.x.toFixed(0)+'%;top:'+s.avg.y.toFixed(0)+'%;border-color:'+col+'"><b style="color:'+col+'">AVG</b></i></div>';
  const legend='<div class="sp-legend"><span><i class="sp-shot goal" style="background:'+col+';border-color:'+col+'"></i>골</span><span><i class="sp-shot"></i>슈팅</span><span>◎ 평균 위치</span></div>';
  const grid='<div class="sp-grid">'+spStat('경기',s.matches)+spStat('평점',s.rating)+spStat('골',s.goals)+spStat('도움',s.assists)+spStat('xG',s.xg)+spStat('xA',s.xa)+spStat('슈팅',s.shots)+'</div>';
  return head+pitch+legend+grid+'<p class="sp-note">추정치 · Opta/FotMob 연동 전 샘플</p>';
}

function openTeam(id) {
  const club = CLUBS.find((c) => c.id === id)
  if (!club) return
  const sq = SQUADS[id]
  const visual = club.flag
    ? '<span class="tm-flag">' + club.flag + '</span>'
    : clubLogoHtml(club, 52)

  let body = ''
  if (sq) {
    const starters = sq.players.filter((x) => x.role === 'starter')
    const bench = sq.players.filter((x) => x.role === 'bench')
    const total = sq.players.reduce((s, x) => s + (x.value || 0), 0)
    const slots = pitchSlots(sq.formation)
    let pitch = '<div class="pitch"><i class="pitch-line"></i><i class="pitch-circle"></i><i class="pitch-box top"></i><i class="pitch-box bot"></i>'
    starters.slice(0, slots.length).forEach((pl, i) => {
      const s = slots[i]
      const last = (pl.nameKo || pl.name).split(' ').pop()
      pitch += '<span class="stone" data-nm="' + esc(pl.name) + '" data-nmk="' + esc(pl.nameKo || pl.name) + '" data-pos="' + esc(pl.pos) + '" style="left:' + s.x + '%;top:' + s.y + '%">' +
        '<i style="border-color:' + club.color + '">' + esc(pl.pos) + '</i><b>' + esc(last) + '</b><em>' + fmtV(pl.value) + '</em></span>'
    })
    pitch += '</div>'

    const row = (pl) => '<div class="tm-row"><b>' + esc(pl.nameKo || pl.name) + '</b><span>' + esc(pl.pos) + '</span>' +
      (pl.startRate ? '<i>' + pl.startRate + '%</i>' : '<i>—</i>') + '<em>' + fmtV(pl.value) + '</em></div>'

    body = '<div class="tm-grid"><div class="tm-left">' +
      '<div class="tm-sec-label">' + t('tmStarters') + ' · ' + sq.formation + (sq.basis ? ' — ' + esc(sq.basis) : '') + '</div>' + pitch + '</div>' +
      '<div class="tm-right">' +
      '<div class="tm-total"><span>' + t('tmTotal') + '</span><b>' + fmtV(total) + '</b></div>' +
      '<div class="tm-sec-label">' + t('tmStarters') + '</div>' + starters.map(row).join('') +
      '<div class="tm-sec-label" style="margin-top:14px">' + t('tmBench') + '</div>' + bench.map(row).join('') +
      '</div></div>' +
      '<p class="tm-note">' + t('tmEst') + '</p>'
  } else {
    body = '<p class="tm-empty">' + t('tmNoSquad') + '</p>'
  }

  // 일정
  const fx = teamFixtures(club)
  let sched = '<div class="tm-sec-label">' + t('tmSchedule') + '</div>'
  if (fx.length) {
    sched += '<div class="tm-fx">' + fx.map((f) =>
      '<div class="tm-fx-row"><i>' + f.date.slice(5).replace('-', '.') + (f.time ? ' ' + f.time : '') + '</i>' +
      '<b>' + (f.homeFlag || '') + ' ' + esc(f.home) + (f.away ? ' <s>vs</s> ' + (f.awayFlag || '') + ' ' + esc(f.away) : '') + '</b>' +
      '<span>' + esc(f.stage) + (f.venue ? ' · ' + esc(f.venue) : '') + '</span></div>').join('') + '</div>'
  } else {
    sched += '<p class="tm-empty">' + t('tmNoSchedule') + '</p>'
  }

  const overlay = document.getElementById('team-modal')
  overlay.querySelector('.tmodal-card').innerHTML =
    '<button class="tmodal-close" aria-label="닫기">×</button>' +
    '<div class="tm-head">' + visual + '<div><div class="tm-name">' + esc(club.nameEn) + '</div>' +
    '<div class="tm-sub">' + esc(club.name) + ' · ' + esc(leagueName(club.league)) + '</div></div></div>' +
    body + sched
  overlay.style.display = 'flex'
  document.body.style.overflow = 'hidden'
  overlay.querySelector('.tmodal-close').addEventListener('click', closeTeam)

  // 선수 호버 → 다른 선수는 흐려지고, 평균 위치 히트맵(열화상)이 피치에 떠오름
  const pitchEl = overlay.querySelector('.pitch')
  if (pitchEl) {
    const heat = document.createElement('div')
    heat.className = 'pitch-heat'
    pitchEl.appendChild(heat)
    pitchEl.querySelectorAll('.stone').forEach((st) => {
      st.addEventListener('mouseenter', () => {
        const pl = { name: st.dataset.nm, nameKo: st.dataset.nmk, pos: st.dataset.pos }
        const s = spStats(pl)
        pitchEl.classList.add('focus')
        st.classList.add('active')
        heat.innerHTML = (s.gk ? '' : heatSVG(s) + phShots(s) + '<i class="ph-avg" style="left:' + s.avg.x.toFixed(0) + '%;top:' + s.avg.y.toFixed(0) + '%"><b>AVG</b></i>') + phInfo(pl, s)
        heat.classList.add('on')
      })
      st.addEventListener('mouseleave', () => {
        pitchEl.classList.remove('focus')
        st.classList.remove('active')
        heat.classList.remove('on')
      })
    })
  }
}

function closeTeam() {
  const overlay = document.getElementById('team-modal')
  overlay.style.display = 'none'
  document.body.style.overflow = ''
}
document.getElementById('team-modal').addEventListener('click', (e) => {
  if (e.target.id === 'team-modal') closeTeam()
})
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTeam() })

function renderMain() {
  if (currentSection === 'matrix') renderMatrix()
  else if (currentSection === 'transfers') renderTransfers()
  else if (currentSection === 'schedule') renderSchedule()
  else renderSources()
}

// ── 검색 이벤트 ──
const searchInput = document.getElementById('search')
const searchClear = document.getElementById('search-clear')
searchInput.addEventListener('input', () => {
  searchClear.style.display = searchInput.value ? 'block' : 'none'
  renderMatrix()
})
searchClear.addEventListener('click', () => {
  searchInput.value = ''
  searchClear.style.display = 'none'
  renderMatrix()
  searchInput.focus()
})

// 언어 토글
document.getElementById('lang-toggle').addEventListener('click', () => {
  lang = lang === 'ko' ? 'en' : 'ko'
  applyLang()
  if (document.getElementById('page-app').style.display !== 'none') renderMain()
})

renderSidebarActive()
renderMain()
applyLang()
showPage('home')
`

const AD_BAND_HTML = `
<div class="ad-band">
  <div class="ph-box ph-logo">Main Logo</div>
  <div class="ph-box ph-ad">Ad Banner — 970 × 90</div>
</div>
`

const HOME_HTML = `
<div class="home" id="page-home">
  <div class="home-top">
    <span class="brand">Football Press Matrix</span>
    <span class="home-date" id="home-date"></span>
  </div>
  <div class="ad-band">
    <div class="ph-box ph-logo">Main Logo</div>
    <div class="ph-box ph-ad">Ad Banner — 970 × 90</div>
  </div>
  <div class="home-hero">
    <span class="hero-kicker">Facts only — no opinions</span>
    <h1 class="hero-title">Trusted football reporting,<br />in one place.</h1>
    <p class="hero-sub" id="hero-sub"></p>
  </div>
  <button class="home-ticker" data-goto="matrix" id="home-ticker" style="display:none">
    <span class="ht-label">Latest</span>
    <span class="ht-row"><span class="ht-track" id="ht-track"></span></span>
  </button>
  <div class="home-cards">
    <button class="hcard" data-goto="matrix">
      <span class="hc-num">01</span>
      <span class="hc-title">Articles</span>
      <span class="hc-desc">Latest reports from tier-one journalists, mapped club by club. Korean summaries, original sources.</span>
      <span class="hc-cta">Enter ↗</span>
    </button>
    <button class="hcard" data-goto="transfers">
      <span class="hc-num">02</span>
      <span class="hc-title">Transfers</span>
      <span class="hc-desc">Every linked player this window — valuations, bids and club-by-club timelines.</span>
      <span class="hc-cta">Enter ↗</span>
    </button>
    <button class="hcard hcard-soon" data-goto="teaminfo">
      <span class="hc-num">03</span>
      <span class="hc-title">Team Info</span>
      <span class="hc-desc">Squads, starts, ratings and average positions — the numbers behind every club.</span>
      <span class="hc-cta">Coming soon</span>
    </button>
  </div>
  <div id="home-cal-mount"></div>
  <div class="home-foot">Romano · Ornstein · Stone · Plettenberg · Di Marzio · Moretto +10 sources</div>
</div>
<div class="soon-page" id="page-soon" style="display:none">
  <button class="soon-back" data-goto="home">← Back</button>
  <h2 id="soon-title"></h2>
  <p id="soon-desc"></p>
</div>
`

const SIDEBAR_HTML = `
<aside class="sidebar">
  <button class="side-home" data-goto="home">← Home</button>
  <div class="side-section">
    <span class="side-label">Sections</span>
    <button class="side-item" data-goto="matrix"><span class="si-name">Press Matrix</span><span class="si-desc" data-i18n="sd_matrix">기자 × 구단 리포트</span></button>
    <button class="side-item" data-goto="transfers"><span class="si-name">Transfer Tracker</span><span class="si-desc" data-i18n="sd_transfers">이적 타임라인 · 가격</span></button>
    <button class="side-item" data-goto="schedule"><span class="si-name">Schedule</span><span class="si-desc" data-i18n="sd_schedule">월드컵 · 리그 일정</span></button>
    <button class="side-item" data-goto="sources"><span class="si-name">Sources</span><span class="si-desc" data-i18n="sd_sources">기자 신뢰도 가이드</span></button>
    <button class="side-item soon" data-goto="teaminfo"><span class="si-name">Player Stats <em class="si-tag">SOON</em></span><span class="si-desc" data-i18n="sd_teaminfo">선발 횟수 · 평점 · 포지션</span></button>
  </div>
  <div class="side-foot">Facts only.<br />의견이 아닌 팩트만.</div>
</aside>
`

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Football Press Matrix — 해외 공신력 기자 리포트 한눈에</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
${CSS}
${EXTRA_CSS}
</style>
</head>
<body>
${HOME_HTML}
<div class="app" id="page-app" style="display:none">
  <header class="topbar">
    <button class="brand brand-btn" data-goto="home">Football Press Matrix</button>
    <div class="searchbox">
      <span class="search-icon">⌕</span>
      <input type="text" id="search" placeholder="검색 — 단어 또는 구단 (예: 이적, Arsenal, 골키퍼)" />
      <button class="search-clear" id="search-clear" style="display:none" aria-label="지우기">×</button>
    </div>
    <span class="topbar-meta" id="topbar-meta"></span>
  </header>
${AD_BAND_HTML}
  <div class="body">
${SIDEBAR_HTML}
    <main class="main" id="main"></main>
  </div>
</div>
<div class="tmodal" id="team-modal" style="display:none"><div class="tmodal-card"></div></div>
<button class="lang-toggle" id="lang-toggle" title="Language">EN</button>
<script>
const JOURNALISTS = ${JSON.stringify(JOURNALISTS)}
const FIXTURES = ${JSON.stringify(FIXTURES)}
const SQUADS = ${JSON.stringify(SQUADS)}
const LEAGUES = ${JSON.stringify(LEAGUES)}
const CLUBS = ${JSON.stringify(CLUBS)}
const ARTICLES = ${JSON.stringify(ARTICLES)}
const TRANSFERS = ${JSON.stringify(TRANSFERS)}
const STANDINGS = ${JSON.stringify(STANDINGS)}
${APP_JS}
</script>
</body>
</html>
`

writeFileSync(join(root, 'standalone.html'), html)
console.log('standalone.html generated:', html.length, 'bytes')
