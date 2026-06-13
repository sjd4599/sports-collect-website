// 배포용 자동 수집 — 소스별 피드 설정
// 두 종류의 피드를 섞어 씁니다:
//  1) rss: 매체 공식 RSS (안정적, 해당 매체 기사만)
//  2) gnews: Google News RSS 검색 (X 기반 기자처럼 공식 RSS가 없는 소스용)
// 피드가 죽어도 파이프라인은 해당 소스만 건너뛰고 계속 동작합니다.

const gnews = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`

export const SOURCES = [
  // ── X 기반 1티어 기자: Google News 검색 피드 ──
  { id: 'romano', feeds: [gnews('"Fabrizio Romano" transfer when:1d')] },
  { id: 'ornstein', feeds: [gnews('"David Ornstein" when:1d')] },
  { id: 'stone', feeds: [gnews('"Simon Stone" BBC football when:1d')] },
  { id: 'plettenberg', feeds: [gnews('"Plettenberg" Bayern OR Dortmund OR Sky when:1d')] },
  { id: 'dimarzio', feeds: [gnews('"Di Marzio" calcio OR transfer when:1d')] },
  { id: 'moretto', feeds: [gnews('"Matteo Moretto" when:1d')] },
  { id: 'pearce', feeds: [gnews('"James Pearce" Liverpool when:1d')] },
  { id: 'samlee', feeds: [gnews('"Sam Lee" "Manchester City" when:1d')] },
  { id: 'watts', feeds: [gnews('"Charles Watts" Arsenal when:1d')] },
  { id: 'falk', feeds: [gnews('"Christian Falk" OR "BILD" Bayern when:1d')] },

  // ── 매체: 공식 RSS ──
  { id: 'skysports', feeds: ['https://www.skysports.com/rss/12040'] },
  { id: 'thesun', feeds: ['https://www.thesun.co.uk/sport/football/feed/'] },
  { id: 'dailymail', feeds: ['https://www.dailymail.co.uk/sport/football/index.rss'] },
  { id: 'marca', feeds: [gnews('site:marca.com "Real Madrid" when:1d')] },
  { id: 'mundodeportivo', feeds: [gnews('site:mundodeportivo.com Barcelona when:1d')] },
  { id: 'gazzetta', feeds: ['https://www.gazzetta.it/rss/calcio.xml'] },

  // ── 지역지: Reach PLC 계열은 태그 페이지 ?service=rss 지원 ──
  {
    id: 'liverpoolecho',
    feeds: [
      'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss',
      'https://www.liverpoolecho.co.uk/all-about/everton-fc?service=rss',
    ],
  },
  {
    id: 'men',
    feeds: [
      'https://www.manchestereveningnews.co.uk/all-about/manchester-united-fc?service=rss',
      'https://www.manchestereveningnews.co.uk/all-about/manchester-city-fc?service=rss',
    ],
  },
  {
    id: 'footballlondon',
    feeds: ['https://www.football.london/?service=rss'],
  },
  {
    id: 'chronicle',
    feeds: ['https://www.chroniclelive.co.uk/all-about/newcastle-united-fc?service=rss'],
  },
  { id: 'as', feeds: [gnews('site:as.com "Real Madrid" OR "Atlético" when:1d')] },
  { id: 'sport', feeds: [gnews('site:sport.es Barcelona when:1d')] },
  { id: 'tuttosport', feeds: [gnews('site:tuttosport.com Juventus when:1d')] },
  { id: 'kicker', feeds: ['https://newsfeed.kicker.de/news/bundesliga'] },

  // ── 종합·캐치올 ──
  { id: 'espn', feeds: ['https://www.espn.com/espn/rss/soccer/news'] },
  { id: 'goal', feeds: [gnews('site:goal.com transfer when:1d')] },
  { id: 'teamtalk', feeds: ['https://www.teamtalk.com/feed'] },
  // wire: 등록 매체 외 보도를 받아내는 캐치올 (구단 키워드 매칭으로 걸러짐)
  { id: 'wire', feeds: [gnews('football transfer "Manchester United" OR "Real Madrid" OR Liverpool OR Arsenal OR Bayern when:1d')] },
]

// 구단 매칭 키워드 (영문 구단명 외 별칭)
export const CLUB_ALIASES = {
  manutd: ['Manchester United', 'Man Utd', 'Man United', '#MUFC'],
  mancity: ['Manchester City', 'Man City', '#MCFC'],
  liverpool: ['Liverpool', '#LFC'],
  arsenal: ['Arsenal', '#AFC'],
  chelsea: ['Chelsea', '#CFC'],
  tottenham: ['Tottenham', 'Spurs', '#THFC'],
  newcastle: ['Newcastle', '#NUFC'],
  astonvilla: ['Aston Villa', '#AVFC'],
  westham: ['West Ham'],
  everton: ['Everton'],
  leeds: ['Leeds United', 'Leeds'],
  forest: ['Nottingham Forest', "Nott'm Forest"],
  realmadrid: ['Real Madrid', '#RealMadrid'],
  barcelona: ['Barcelona', 'Barça', '#FCB'],
  atletico: ['Atlético', 'Atletico Madrid'],
  sevilla: ['Sevilla'],
  athletic: ['Athletic Club', 'Athletic Bilbao'],
  bayern: ['Bayern', '#FCBayern'],
  dortmund: ['Dortmund', '#BVB'],
  leverkusen: ['Leverkusen'],
  leipzig: ['RB Leipzig', 'Leipzig'],
  frankfurt: ['Eintracht Frankfurt'],
  juventus: ['Juventus', 'Juve'],
  inter: ['Inter Milan', 'Inter', '#Inter'],
  milan: ['AC Milan', '#ACMilan'],
  napoli: ['Napoli'],
  roma: ['Roma', '#ASRoma'],
  lazio: ['Lazio'],
  atalanta: ['Atalanta'],
  torino: ['Torino'],
  // 월드컵 국가대표팀
  kor: ['South Korea', 'Korea Republic', 'Son Heung-min', 'Kim Min-jae', 'Lee Kang-in'],
  arg: ['Argentina national', 'Argentina vs', 'vs Argentina', 'Messi'],
  fra: ['France national', 'France vs', 'vs France', 'Mbappé', 'Mbappe'],
  eng: ['England national', 'England vs', 'vs England', 'England squad'],
  bra: ['Brazil national', 'Brazil vs', 'vs Brazil', 'Seleção'],
  esp: ['Spain national', 'Spain vs', 'vs Spain', 'Spain squad'],
  ger: ['Germany national', 'Germany vs', 'vs Germany', 'DFB team'],
  por: ['Portugal national', 'Portugal vs', 'vs Portugal'],
  ned: ['Netherlands national', 'Netherlands vs', 'vs Netherlands'],
  jpn: ['Japan national', 'Japan vs', 'vs Japan'],
  usa: ['USMNT', 'USA vs', 'vs USA'],
  can: ['Canada national', 'Canada vs', 'vs Canada'],
  uru: ['Uruguay vs', 'vs Uruguay'],
  col: ['Colombia vs', 'vs Colombia'],
  mar: ['Morocco vs', 'vs Morocco'],
  cro: ['Croatia vs', 'vs Croatia'],
  bel: ['Belgium vs', 'vs Belgium'],
  sui: ['Switzerland vs', 'vs Switzerland'],
  sen: ['Senegal vs', 'vs Senegal'],
  nor: ['Norway vs', 'vs Norway', 'Haaland Norway'],
  sco: ['Scotland vs', 'vs Scotland'],
  aus: ['Australia vs', 'vs Australia', 'Socceroos'],
  egy: ['Egypt vs', 'vs Egypt'],
  tur: ['Turkey vs', 'vs Turkey', 'Türkiye'],
}
