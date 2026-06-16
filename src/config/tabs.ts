// 6개 핵심 탭 정의 (기획서 §2). 라우팅 + 사이드바 내비에서 공용 사용.

export interface TabDef {
  path: string
  label: string
  short: string
  description: string
}

export const TABS: TabDef[] = [
  {
    path: '/synopsis',
    label: '시놉시스',
    short: '시놉시스',
    description: '작품 메타데이터 · 로그라인 · 5단 플롯',
  },
  {
    path: '/scrap-board',
    label: '스크랩 보드',
    short: '스크랩',
    description: '무한 캔버스 포스트잇 · OG 링크 스크랩',
  },
  {
    path: '/worldbuilding',
    label: '세계관',
    short: '세계관',
    description: '시공간 · 사회/인프라 · 정신/제약 설정 아카이브',
  },
  {
    path: '/characters',
    label: '인물',
    short: '인물',
    description: '프로필 · 관계도 · 인물 변화표 · 등장표',
  },
  {
    path: '/timeline',
    label: '타임라인',
    short: '타임라인',
    description: '진행률 · 회차/복선 · 인과관계 씬 디자이너',
  },
  {
    path: '/workspace',
    label: '워크스페이스',
    short: '집필',
    description: '본문 에디터 · 플로팅 사이드바 · 데이터 귀속',
  },
]
