import { TabPlaceholder } from '@/components/layout/TabPlaceholder'

export function SynopsisPage() {
  return (
    <TabPlaceholder
      title="마스터 시놉시스"
      description="작품의 거시적 정보와 핵심 뼈대를 정의하는 정형 폼 스페이스."
      todo={[
        '기본 메타데이터 폼 (작품명 · 장르 · 예상 분량)',
        '로그라인 · 기획의도 텍스트 필드',
        '5단 플롯 카드 대시보드 (발단 · 전개 · 위기 · 절정 · 결말)',
        'workspace 단위 자동 저장',
      ]}
    />
  )
}
