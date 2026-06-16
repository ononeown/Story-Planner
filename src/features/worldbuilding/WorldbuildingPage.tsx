import { TabPlaceholder } from '@/components/layout/TabPlaceholder'

export function WorldbuildingPage() {
  return (
    <TabPlaceholder
      title="다차원 세계관 위키"
      description="배경 설정을 구조화해 보관하는 아코디언/토글 아카이브."
      todo={[
        '카테고리 아코디언 (시공간 · 사회/인프라 · 정신/제약)',
        '시공간: 주요 장소 · 시대/연호',
        '사회: 환경 · 언어 · 역사 · 정치 · 경제 · 관습',
        '정신: 종교 · 신화 · 규율 · 금기(Taboo)',
        '토글 트리 (parent_id 계층) · 항목 CRUD',
      ]}
    />
  )
}
