// 배포용 자동 수집 파이프라인
// 사용법:  node scripts/collect.mjs [--dry] [--max=40]
//
// 흐름: RSS/Google News 피드 수집 → 구단 매칭 → 중복 제거
//      → Claude API로 한국어 제목·요약 생성 (ANTHROPIC_API_KEY 필요)
//      → og:image 추출 → 30일 경과 기사 정리 → articles.json 갱신
//
// ANTHROPIC_API_KEY가 없으면 번역 없이 원문 제목으로 추가하고
// titleKo 앞에 [EN]을 붙여 수동 검수 대상임을 표시합니다.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { SOURCES, CLUB_ALIASES } from './sources.config.mjs'
import { genClubImage } from './genimage.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARTICLES_PATH = join(root, 'src/data/articles.json')

const DRY = process.argv.includes('--dry')
const MAX_NEW = Number((process.argv.find((a) => a.startsWith('--max=')) || '').split('=')[1] || 40)
const FRESH_DAYS = 30
const WINDOW_HOURS = 48 // 이 시간 안에 게시된 항목만 후보로
const API_KEY = process.env.ANTHROPIC_API_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY // 있으면 GPT로 번역 (Anthropic 키 없을 때)

const { JOURNALISTS } = await import(join(root, 'src/data/journalists.js'))
const { CLUBS } = await import(join(root, 'src/data/clubs.js'))
const VALID_J = new Set(JOURNALISTS.map((j) => j.id))
const VALID_C = new Set(CLUBS.map((c) => c.id))

const log = (...a) => console.log('[collect]', ...a)

// 축구 외 종목 오탐 제외 패턴 (축구 용어와 겹치는 단어는 일부러 제외:
//  qualifying=월드컵 예선, match/set/try/race/knockout/Boxing Day 등은 넣지 않음)
const OFFTOPIC = new RegExp(
  [
    // 모터스포츠
    'F1', 'Formula\\s?1', 'Formula\\s?One', 'Grand Prix', 'MotoGP', 'NASCAR', 'IndyCar',
    '(free|final)\\s+practice', 'pole position', 'pit lane', 'paddock', 'brake pedals?',
    // 농구·미식축구·야구·하키
    'NBA', 'WNBA', 'NFL', 'MLB', 'NHL', 'NCAA',
    'basketball', 'baseball', 'American football', 'ice hockey',
    'touchdown', 'quarterback', 'Super Bowl', 'home run', 'slam dunk',
    // 크리켓
    'cricket', 'wicket', 'batsman', 'bowler', 'Test match', '\\bIPL\\b',
    // 테니스·골프·럭비·격투기·기타
    'tennis', '\\bATP\\b', '\\bWTA\\b', 'Wimbledon', 'Grand Slam',
    'golf', '\\bPGA\\b', 'birdie',
    'rugby', 'scrum', 'Six Nations',
    '\\bUFC\\b', '\\bMMA\\b',
    'cycling', 'Tour de France', 'darts', 'snooker', 'swimming', 'WWE', 'wrestling',
    // 한국어(번역된 잡음 청소용)
    '농구', '야구', '크리켓', '테니스', '골프', '럭비', '모터스포츠', '포뮬러', '그랑프리',
  ].join('|'),
  'i',
)

// 무료 키리스 번역 (Google Translate 비공식 엔드포인트) — API 키 없이 영어→한국어
async function translateFree(text) {
  const s = String(text || '').trim()
  if (!s) return ''
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=' + encodeURIComponent(s.slice(0, 1800))
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    const ko = (data[0] || []).map((seg) => seg[0]).join('')
    return ko || s
  } catch {
    return s
  }
}

// ── 유틸 ──
const strip = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

async function fetchText(url, timeoutMs = 15000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; FootballPressMatrix/1.0)' },
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

// 아주 단순한 RSS/Atom 파서 (item|entry 단위)
function parseFeed(xml) {
  const items = []
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/g) || []
  for (const b of blocks) {
    const pick = (tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? strip(m[1]) : ''
    }
    let link = pick('link')
    if (!link) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i)
      link = m ? m[1] : ''
    }
    const date = pick('pubDate') || pick('updated') || pick('published') || pick('dc:date')
    items.push({ title: pick('title'), link, description: pick('description') || pick('summary'), date })
  }
  return items
}

// Google News 링크는 원문으로 리다이렉트되는 중간 URL — 그대로 사용 가능
function normalizeUrl(u) {
  try {
    const url = new URL(u)
    url.hash = ''
    for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'guccounter']) url.searchParams.delete(p)
    return url.toString()
  } catch {
    return u
  }
}

function matchClubs(text) {
  const found = []
  for (const [id, aliases] of Object.entries(CLUB_ALIASES)) {
    if (!VALID_C.has(id)) continue
    if (aliases.some((a) => text.toLowerCase().includes(a.toLowerCase()))) found.push(id)
  }
  return found.slice(0, 2) // 한 기사 최대 2개 구단
}

// ── OpenAI(GPT) API: 한국어 제목/요약 일괄 생성 (OPENAI_API_KEY 필요) ──
async function summarizeKoOpenAI(items) {
  const payload = items.map((it, i) => ({ i, title: it.title, desc: (it.description || '').slice(0, 400) }))
  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      {
        role: 'user',
        content:
          '다음 축구 기사들의 한국어 헤드라인(titleKo)과 2문장 사실 요약(summaryKo)을 만들어줘. ' +
          '의견·과장 없이 사실만, 자연스러운 한국어로. JSON 배열만 출력: ' +
          '[{"i":0,"titleKo":"...","summaryKo":"..."}, ...]\n\n' +
          JSON.stringify(payload),
      },
    ],
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + OPENAI_KEY },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('OpenAI API ' + res.status + ': ' + (await res.text()).slice(0, 200))
  const data = await res.json()
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
  const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1))
  const byI = new Map(arr.map((x) => [x.i, x]))
  return items.map((_, i) => byI.get(i) || { titleKo: items[i].title, summaryKo: items[i].description || '' })
}

// ── Claude API: 한국어 제목/요약 일괄 생성 ──
async function summarizeKo(items) {
  // Anthropic 키가 없을 때: OpenAI(GPT) → 그것도 없으면 무료 번역
  if (!API_KEY && OPENAI_KEY) {
    try {
      log('OpenAI(GPT)로 한국어 요약 생성')
      return await summarizeKoOpenAI(items)
    } catch (e) {
      log('OpenAI 실패 — 무료 번역으로 폴백:', String(e).slice(0, 100))
    }
  }
  if (!API_KEY) {
    log('무료 번역(Google Translate)으로 한국어 생성')
    const out = []
    for (const it of items) {
      out.push({
        titleKo: await translateFree(it.title),
        summaryKo: await translateFree((it.description || it.title).slice(0, 280)),
      })
    }
    return out
  }
  const payload = items.map((it, i) => ({ i, title: it.title, desc: (it.description || '').slice(0, 400) }))
  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content:
          '다음 축구 기사들의 한국어 헤드라인(titleKo)과 2문장 사실 요약(summaryKo)을 만들어줘. ' +
          '의견·과장 없이 사실만, 자연스러운 한국어로. JSON 배열만 출력: ' +
          '[{"i":0,"titleKo":"...","summaryKo":"..."}, ...]\n\n' +
          JSON.stringify(payload),
      },
    ],
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Claude API ' + res.status + ': ' + (await res.text()).slice(0, 200))
  const data = await res.json()
  const text = data.content.map((c) => c.text || '').join('')
  const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1))
  const byI = new Map(arr.map((x) => [x.i, x]))
  return items.map((_, i) => byI.get(i) || { titleKo: '[EN] ' + items[i].title, summaryKo: items[i].description || '' })
}

// ── og:image 추출 ──
async function ogImage(url) {
  try {
    const html = await fetchText(url, 10000)
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (!m) return null
    const u = new URL(m[1], url)
    return u.origin + u.pathname
  } catch {
    return null
  }
}

// ── 메인 ──
let articles = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))
// 시작 시 잡음 청소: [EN] 미번역 + F1 등 오탐 제거 → 같은 기사가 재수집 시 한국어로 다시 채워짐
articles = articles.filter(
  (a) =>
    !String(a.titleKo || '').startsWith('[EN]') &&
    !OFFTOPIC.test((a.titleKo || '') + ' ' + (a.summaryKo || '')),
)
for (const a of articles) {
  if (a.imageUrl && String(a.url || '').includes('news.google.com')) delete a.imageUrl
}
const known = new Set(articles.map((a) => normalizeUrl(a.url)))
const knownTitle = new Set(articles.map((a) => (a.titleKo || '').slice(0, 30)))
const since = Date.now() - WINDOW_HOURS * 3600000

const candidates = []
for (const src of SOURCES) {
  if (!VALID_J.has(src.id)) { log('스킵(미등록 소스):', src.id); continue }
  for (const feed of src.feeds) {
    try {
      const xml = await fetchText(feed)
      const items = parseFeed(xml)
      let n = 0
      for (const it of items) {
        if (!it.title || !it.link) continue
        const ts = Date.parse(it.date)
        if (Number.isFinite(ts) && ts < since) continue
        const url = normalizeUrl(it.link)
        if (known.has(url)) continue
        const clubs = matchClubs(it.title + ' ' + it.description)
        if (!clubs.length) continue
        if (OFFTOPIC.test(it.title + ' ' + it.description)) continue // F1 등 축구 외 제외
        candidates.push({ journalist: src.id, clubs, url, ...it, ts: Number.isFinite(ts) ? ts : Date.now() })
        known.add(url)
        n++
      }
      log(src.id, feed.slice(0, 60) + '…', '→ 후보', n)
    } catch (e) {
      log('피드 실패:', src.id, String(e).slice(0, 80))
    }
  }
}

candidates.sort((a, b) => b.ts - a.ts)
const picked = candidates.slice(0, MAX_NEW)
log('후보', candidates.length, '→ 처리', picked.length)

if (DRY) {
  for (const c of picked) log('[dry]', c.journalist, c.clubs.join(','), '|', c.title.slice(0, 70))
  process.exit(0)
}

if (picked.length) {
  const ko = await summarizeKo(picked)
  for (let i = 0; i < picked.length; i++) {
    const c = picked[i]
    let img = c.url.includes('news.google.com') ? null : await ogImage(c.url)
    let ai = false
    // og:image 실패 시 Gemini로 구단 컬러 일러스트 생성 (GEMINI_API_KEY 필요)
    if (!img && process.env.GEMINI_API_KEY) {
      try {
        const clubInfo = CLUBS.find((x) => x.id === c.clubs[0])
        const name = await genClubImage({
          clubNameEn: clubInfo?.nameEn || c.clubs[0],
          clubColor: clubInfo?.color || '#444444',
          headline: c.title,
          outDir: join(root, 'genimg'),
        })
        if (name) { img = 'genimg/' + name; ai = true }
      } catch (e) {
        log('Gemini 생성 실패:', String(e).slice(0, 80))
      }
    }
    const date = new Date(c.ts).toISOString().slice(0, 10)
    for (const club of c.clubs) {
      if (knownTitle.has(ko[i].titleKo.slice(0, 30))) continue
      articles.push({
        journalist: c.journalist,
        club,
        date,
        sourceType: 'article',
        outlet: JOURNALISTS.find((j) => j.id === c.journalist)?.outlet || c.journalist,
        titleKo: ko[i].titleKo,
        summaryKo: ko[i].summaryKo,
        url: c.url,
        publishedAt: new Date(c.ts).toISOString(), // 발행 시각 (표시용)
        ...(img ? { imageUrl: img } : {}),
        ...(ai ? { aiImage: true } : {}),
      })
    }
  }
}

// 30일 경과 정리 + 잡음 청소
const cutoff = Date.now() - FRESH_DAYS * 86400000
const before = articles.length
let kept = articles.filter((a) => new Date(a.date + 'T00:00:00').getTime() >= cutoff)
// [EN] 미번역 잔재 제거 + F1 등 오탐 제거
kept = kept.filter(
  (a) =>
    !String(a.titleKo || '').startsWith('[EN]') &&
    !OFFTOPIC.test((a.titleKo || '') + ' ' + (a.summaryKo || '')),
)
// 구글 뉴스 로고가 이미지로 잡힌 항목은 이미지 제거 (구단 컬러 폴백 표시)
for (const a of kept) {
  if (a.imageUrl && String(a.url || '').includes('news.google.com')) delete a.imageUrl
}
writeFileSync(ARTICLES_PATH, JSON.stringify(kept, null, 2))
log('추가', picked.length, '| 정리 후 총', kept.length, '| 제거', before - kept.length)
