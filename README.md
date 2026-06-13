# ⚽ Football Press Matrix

세계 공신력 있는 축구 기자·언론사의 리포트(기사·X 게시물)를 **기자 × 구단 매트릭스**로 한눈에 보는 웹사이트.
의견이 아닌 팩트 전달이 목표이며, 모든 항목은 한국어 요약 + 원문 링크로 제공됩니다.

## 바로 보기 (설치 불필요)

`standalone.html` 파일을 더블클릭하면 브라우저에서 바로 열립니다.
React 프로젝트와 동일한 데이터/디자인의 무설치 버전입니다. (로고·폰트는 온라인 상태에서 로드)

## React 개발 모드 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 배포용 빌드 (dist/)
```

## 페이지 구성

- **Home** — 히어로 + 3개 카드(Articles/Transfers/Team Info) + 월드컵 2026 캘린더
- **Press Matrix** — 기자 16곳 × 4대 리그 전 구단(78개) 매트릭스. 리그 탭, 통합 검색(검색 시 전 리그),
  셀 호버 확장(이미지+요약+이전 소식), 48시간 내 보도 NEW 배지, 기자별 공신력 도트·리포트 수.
  기자 헤더 위에서 휠 = 가로 스크롤, 본문 휠 = 세로 스크롤.
- **Transfer Tracker** — 가격 티커, 상태 필터(All/Done/In talks/Rumour), 선수명 세로 아치 다이얼,
  소속팀→사진→링크팀 로고 연결 다이어그램(실선=확정·합의, 점선=협상·루머), 날짜별 가로 타임라인.
- **Schedule** — 월드컵 2026 조별리그 캘린더 + 리그 개막일.
- **Sources** — 기자·언론사 신뢰도 가이드(Tier 1 / Trusted / Solid / Tabloid).
- Player Stats — 준비 중.

## 구조

```
src/
  data/
    journalists.js   # 기자/언론사 16곳 (credibility 1~5 자체 평가 포함)
    clubs.js         # 4대 리그 전 구단 (2025-26 시즌) + 로고
    articles.json    # 수집 리포트 (기자id × 구단id)
    transfers.json   # 이적 트래커 (선수·상태·가격·이벤트 타임라인)
    fixtures.json    # 월드컵·리그 일정 (+국기)
  components/
    MatrixGrid.jsx   # 매트릭스 (확장 셀, NEW 배지, 휠 가로스크롤)
    Transfers.jsx    # 이적 트래커 (다이얼·다이어그램·필터)
    Calendar.jsx     # 일정 캘린더 (홈/Schedule 공용)
    Sources.jsx      # 신뢰도 가이드
    Sidebar.jsx, Home.jsx
  App.jsx            # 라우팅 · 검색 · 30일 보존 필터
  styles.css         # 화이트 + 프로스트 글래스 테마, 축구공 커서
scripts/
  build-standalone.mjs  # 데이터를 읽어 standalone.html 재생성
```

## 데이터 운영

- **30일 보존**: 게시 30일이 지난 기사는 화면에서 자동으로 사라짐 (렌더 시 필터)
- **자동 수집**: 예약 작업 `football-press-update`가 3시간마다 16개 소스를 검색해
  새 기사를 한국어로 요약·추가(URL 중복 제거)하고 만료 기사를 정리한 뒤 standalone을 재생성
- 수동 추가: `src/data/articles.json`에 항목 추가 후 `node scripts/build-standalone.mjs`

```json
{
  "journalist": "romano",
  "club": "arsenal",
  "date": "2026-06-12",
  "sourceType": "x",
  "outlet": "X",
  "titleKo": "한국어 헤드라인",
  "summaryKo": "한국어 2~3문장 팩트 요약",
  "url": "https://원문링크"
}
```

## 로드맵

- Player Stats: 시즌 중 선발 횟수, 평점, 평균 포지션(Opta/FotMob류 데이터)
- 기사 썸네일 이미지 연동 (현재 플레이스홀더 박스)
- 메인 로고·광고 배너 교체 (현재 점선 자리)
