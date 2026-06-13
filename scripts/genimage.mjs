// Gemini 이미지 생성 폴백
// og:image를 얻지 못한 기사에 대해 구단 컬러 기반의 에디토리얼 일러스트를 생성합니다.
// 주의: 실존 인물·구단 로고를 그리지 않도록 프롬프트를 제한하고,
//       생성 이미지에는 UI에서 'AI' 배지가 표시됩니다 (aiImage: true).
//
// 필요 환경변수: GEMINI_API_KEY (https://aistudio.google.com 에서 발급)
// 모델 변경:     GEMINI_IMAGE_MODEL (기본 gemini-2.5-flash-image)
import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'

export async function genClubImage({ clubNameEn, clubColor, headline, outDir }) {
  const KEY = process.env.GEMINI_API_KEY
  if (!KEY) return null

  const prompt =
    `Photorealistic editorial sports photograph for a football news website card (16:9). ` +
    `Cinematic, realistic stadium atmosphere that evokes: "${(headline || 'football news').slice(0, 80)}". ` +
    `Dominant palette based on the club colour ${clubColor} of ${clubNameEn}. ` +
    `Style: real press-photo look — shallow depth of field, dramatic floodlights, pitch grass, ` +
    `crowd in the stands, dusk sky, photographic grain. ` +
    `STRICT: no recognizable real people or faces, no readable club crests or logos, ` +
    `no text or letters, no identifiable jerseys or names. Atmosphere only, no specific persons.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  )
  if (!res.ok) throw new Error('Gemini API ' + res.status + ': ' + (await res.text()).slice(0, 200))
  const data = await res.json()

  const part = (data.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data)
  if (!part) return null

  const ext = (part.inlineData.mimeType || 'image/png').includes('jpeg') ? 'jpg' : 'png'
  const name = createHash('sha1').update(prompt).digest('hex').slice(0, 16) + '.' + ext
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, name), Buffer.from(part.inlineData.data, 'base64'))
  return name // 호출부에서 'genimg/<name>' 상대 경로로 사용
}
