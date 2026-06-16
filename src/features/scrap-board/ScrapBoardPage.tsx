import { TabPlaceholder } from '@/components/layout/TabPlaceholder'

export function ScrapBoardPage() {
  return (
    <TabPlaceholder
      title="스크랩 보드"
      description="자료조사 링크/메모를 포스트잇처럼 배치하는 무한 캔버스 (React Flow)."
      todo={[
        'React Flow 무한 캔버스 (휠 줌 · 스페이스+드래그 패닝)',
        'URL 입력 시 OG 파싱 → 카드 자동 생성 (Edge Function)',
        '컬러칩 5종 · 핀 고정',
        '실시간 키워드 검색 (비매칭 카드 블러/페이드)',
        '#태그 필터링',
        '카드 좌표 디바운스 DB 동기화 · 표 뷰 전환',
      ]}
    />
  )
}
