// 이적 트래커 선수 프로필 사진 backfill
// transfers.json의 각 선수에 대해 위키피디아 대표 이미지(주로 Commons, CC 라이선스)를 채웁니다.
// 사용: node scripts/backfill-player-photos.mjs
//
// GitHub Actions(네트워크 정상)에서 안정적으로 동작합니다.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PATH = join(root, 'src/data/transfers.json')
const log = (...a) => console.log('[player-photos]', ...a)

async function wikiPhoto(name) {
  if (!name) return null
  try {
    const url =
      'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages' +
      '&piprop=thumbnail&pithumbsize=420&titles=' + encodeURIComponent(name)
    const res = await fetch(url, { headers: { 'user-agent': 'FootballPressMatrix/1.0 (football news demo)' } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    const pages = data && data.query && data.query.pages
    if (!pages) return null
    for (const k of Object.keys(pages)) {
      const th = pages[k].thumbnail
      if (th && th.source) return th.source
    }
    return null
  } catch (e) {
    log('실패:', name, String(e).slice(0, 60))
    return null
  }
}

const transfers = JSON.parse(readFileSync(PATH, 'utf8'))
let filled = 0
for (const t of transfers) {
  if (t.photo) continue
  const img = await wikiPhoto(t.name)
  if (img) {
    t.photo = img
    filled++
    log('OK', t.name)
  }
}
writeFileSync(PATH, JSON.stringify(transfers, null, 2))
log('채움', filled, '/ 전체', transfers.length)
