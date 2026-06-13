# 배포 가이드 — 자동 수집 구조

## 전체 구조

```
                    ┌──────────────────────────────────────────────┐
                    │   GitHub Actions (3시간마다 cron / 수동 실행)   │
                    │                                              │
  RSS·Google News ─▶│ ① collect.mjs                                │
  (24개 소스 피드)    │    · 피드 수집 → 구단 키워드 매칭              │
                    │    · URL 중복 제거 · 48시간 내 기사만           │
  Claude API ──────▶│    · 한국어 제목·2문장 요약 생성 (Haiku)        │
                    │    · 기사 페이지에서 og:image 추출              │
                    │    · 30일 경과 기사 자동 정리                   │
                    │ ② build-standalone.mjs → index.html          │
                    │ ③ articles.json 커밋 (데이터 히스토리 보존)     │
                    └───────────────┬──────────────────────────────┘
                                    ▼
                          GitHub Pages (정적 호스팅)
                          https://<계정>.github.io/<repo>/
```

핵심: **개발 단계에서 Claude(Cowork)가 하던 일 — 검색·번역·요약·이미지 추출 — 을
서버 파이프라인이 그대로 대신합니다.** 번역·요약은 Claude API(Haiku) 호출로,
이미지는 GitHub Actions 러너에서 직접 og:image를 읽어옵니다
(러너는 네트워크 제약이 없어 Cowork 샌드박스에서 막혔던 부분이 해결됩니다).

## 이미지 폴백 체인

```
기사 페이지 og:image 추출 시도
  └─ 실패 → Gemini 이미지 생성 (GEMINI_API_KEY 설정 시)
              · 구단 컬러 기반 에디토리얼 일러스트
              · 실존 인물·로고·텍스트 생성 금지 프롬프트
              · genimg/ 폴더에 저장·커밋, 카드에 "AI IMAGE" 배지 표시
       └─ 그것도 실패 → 구단 컬러 그라데이션 + 로고 (기본 비주얼)
```

AI 생성 이미지에 배지를 붙이는 이유: 뉴스 사이트에서 생성 이미지를 실제 보도사진처럼
보이게 하면 오해를 부를 수 있어, 팩트 전달이라는 사이트 정체성에 맞게 투명하게 표시합니다.

## 설정 순서 (1회)

1. GitHub 저장소 생성 후 이 폴더 전체 push
2. 저장소 Settings → Secrets and variables → Actions에 등록:
   - `ANTHROPIC_API_KEY` — 한국어 요약용 (console.anthropic.com에서 발급)
   - `GEMINI_API_KEY` — 이미지 생성 폴백용 (aistudio.google.com에서 발급, 선택)
     ※ Gemini 앱 구독과는 별개로 AI Studio에서 API 키를 만들어야 합니다
3. Settings → Pages → Source: **GitHub Actions** 선택
4. Actions 탭 → "Update & Deploy" → Run workflow로 첫 실행

이후 3시간마다 자동으로 수집→빌드→배포가 반복됩니다.

## 로컬/개발 모드와의 관계

- Cowork 예약 작업(`football-press-update`)은 **개발용**입니다. 배포 후에는 둘 다
  돌릴 필요 없이 GitHub Actions만 두면 됩니다 (둘 다 URL 중복 제거를 하므로 충돌은 없음).
- 로컬 테스트: `node scripts/collect.mjs --dry` (수집 후보만 출력, 파일 수정 없음)
- API 키 없이 실행하면 번역 없이 `[EN]` 표시로 추가됩니다 — 동작 확인용.

## 파일별 역할

| 파일 | 역할 |
|---|---|
| `scripts/sources.config.mjs` | 24개 소스의 피드 URL·구단 별칭. 소스 추가는 여기만 수정 |
| `scripts/collect.mjs` | 수집→분류→번역→이미지→정리 파이프라인 본체 |
| `scripts/build-standalone.mjs` | 데이터 → 정적 페이지(index.html) 생성 |
| `.github/workflows/update.yml` | 3시간 cron + Pages 배포 |

## 한계와 다음 단계

- X(트위터) 원문 직접 수집은 유료 API가 필요해서, 기자 발 보도는 Google News에
  잡히는 2차 보도로 수집됩니다 (보도 시점이 다소 늦을 수 있음).
- 일부 피드(특히 해외 지역지)는 정책이 바뀌면 죽을 수 있습니다 — 실패해도
  전체 파이프라인은 계속 돌고, Actions 로그에서 어떤 피드가 죽었는지 보입니다.
- 트래픽이 커지면: Vercel + cron, 또는 DB(Supabase) + 검수용 어드민 페이지로 확장.
- 언론사 이미지 핫링크는 데모용으로는 동작하지만, 정식 서비스 시 라이선스 확인 필요.
