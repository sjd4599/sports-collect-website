// 기존 기사 이미지 backfill
// imageUrl이 없는 기사에 대해:
//   1) 기사 페이지에서 og:image 추출
//   2) 실패(또는 X/트위터 글)면 Gemini로 분위기 이미지 생성 (GEMINI_API_KEY 있을 때만)
//   3) 둘 다 실패하면 그대로 두고 UI가 구단 컬러 폴백을 표시
// 사용: node scripts/backfill-images.mjs [--max=200]
//
// 이 스크립트는 GitHub Actions(네트워크 제약 없음)에서 안정적으로 동작합니다.
// 로컬 Cowork 샌드박스는 네트워크가 막혀 있어 효과가 제한적입니다.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { genClubImage } from './genimage.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARTICLES_PATH = join(root, 'src/data/articles.json')
const { CLUBS } = await import(join(root, 'src/data/clubs.js'))

const MAX = Number((process.argv.find((a) => a.startsWith('--max=')) || '').split('=')[1] || 200)
const log = (...a) => console.log('[backfill]', ...a)

async function fetchText(url, timeoutMs = 12000) {
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

async function ogImage(url) {
  try {
    const html = await fetchText(url)
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (!m) return null
    return new URL(m[1], url).toString()
  } catch {
    return null
  }
}

const isSocial = (u) => /(^|\.)x\.com|twitter\.com|t\.co/.test(String(u))

const articles = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))
let filled = 0, ai = 0, tried = 0, skipped = 0

for (const a of articles) {
  if (a.imageUrl) continue
  if (tried >= MAX) break
  tried++

  let img = null
  if (!isSocial(a.url) && !String(a.url).includes('news.google.com')) img = await ogImage(a.url)
  if (img) {
    a.imageUrl = img
    filled++
    continue
  }

  // og:image 실패 → Gemini 폴백 (키 있을 때만)
  if (process.env.GEMINI_API_KEY) {
    try {
      const club = CLUBS.find((c) => c.id === a.club) || {}
      const name = await genClubImage({
        clubNameEn: club.nameEn || a.club,
        clubColor: club.color || '#444444',
        headline: a.titleKo,
        outDir: join(root, 'genimg'),
      })
      if (name) {
        a.imageUrl = 'genimg/' + name
        a.aiImage = true
        ai++
        continue
      }
    } catch (e) {
      log('gemini 실패:', String(e).slice(0, 80))
    }
  }
  skipped++
}

writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2))
log('og:image 채움', filled, '| AI 생성', ai, '| 건너뜀', skipped, '| 시도', tried)
