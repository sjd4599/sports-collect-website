# 배포 가이드 (비개발자용) — 이미지 자동 채우기 + 인터넷 공개

이 문서대로 따라 하면, 서버(GitHub Actions)가 **기사 이미지를 전부 자동으로 채우고** 사이트를 인터넷 주소로 띄웁니다.
로컬(내 컴퓨터 standalone.html)에서 이미지가 안 채워지던 이유는 이 컴퓨터의 실행 환경(Node·네트워크)이 막혀 있어서예요. 깃허브 서버에서는 정상 동작합니다.

소요 시간: 처음 1회 약 15~20분. 이후엔 10분마다 자동.

---

## 1단계 — GitHub 계정 만들기 (이미 있으면 건너뛰기)
1. https://github.com 접속 → **Sign up** → 이메일·비밀번호로 가입.

## 2단계 — GitHub Desktop 설치 (코드 올리기용, 가장 쉬움)
1. https://desktop.github.com 에서 다운로드 → 설치 → 1단계 계정으로 로그인.

## 3단계 — 이 폴더를 깃허브에 올리기
1. GitHub Desktop 상단 메뉴 **File → Add local repository**.
2. 이 폴더 선택: `sports collect website`
   - "이 폴더는 Git 저장소가 아닙니다" 안내가 뜨면 → **create a repository** 클릭 → **Create repository** 버튼.
3. 왼쪽 아래 **Commit to main** 클릭 (메시지는 아무거나).
4. 오른쪽 위 **Publish repository** 클릭.
   - **Keep this code private** 체크는 풀어도(공개) 됩니다. (공개여야 GitHub Pages 무료)
   - **Publish repository** 클릭.

## 4단계 — API 키 등록 (한국어 요약·AI 이미지용)
> 기존 기사 이미지는 키 없이도 og:image로 채워집니다. 키는 "새 기사 번역"과 "AI 이미지"에만 필요해요.

1. 깃허브 웹에서 방금 만든 저장소로 이동.
2. **Settings**(상단 탭) → 왼쪽 **Secrets and variables → Actions** → **New repository secret**.
3. 다음을 등록:
   - 이름 `ANTHROPIC_API_KEY` → 값: console.anthropic.com 에서 발급한 키 (새 기사 한국어 요약용, 권장)
   - 이름 `GEMINI_API_KEY` → 값: aistudio.google.com 에서 발급한 키 (og:image 없는 X 글에 AI 이미지 생성용, 선택)

## 5단계 — GitHub Pages 켜기
1. **Settings → Pages**.
2. **Source** 를 **GitHub Actions** 로 선택.

## 6단계 — 첫 실행
1. 상단 **Actions** 탭 → 왼쪽 **Update & Deploy** → 오른쪽 **Run workflow** → **Run workflow**.
2. 2~5분 기다리면 초록 체크. 이때 backfill 단계가 **모든 기사 이미지를 채웁니다.**
3. **Settings → Pages** 상단에 표시되는 주소(`https://<내아이디>.github.io/<저장소이름>/`)를 열면 완성된 사이트가 보입니다.

---

## 이후 자동 운영
- 10분마다 자동으로: 새 기사 수집 → 한국어 요약 → **이미지 채우기(og:image, 없으면 Gemini)** → 빌드 → 배포.
- 더 손댈 필요 없이 주소만 열면 항상 최신 상태입니다.

## 자주 막히는 곳
- Actions가 빨간 X: 대부분 `ANTHROPIC_API_KEY` 누락. 키 없이 돌리려면 collect 단계는 `[EN]` 표시로만 추가되고 나머지는 정상 동작합니다.
- Pages 주소가 404: Settings → Pages에서 Source가 **GitHub Actions** 인지, Actions 1회 성공했는지 확인.
- 이미지가 일부 비어있음: og:image가 없는 X(트위터) 글입니다. `GEMINI_API_KEY` 등록 시 AI 이미지로 채워집니다.
