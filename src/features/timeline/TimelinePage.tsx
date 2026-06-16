import { TabPlaceholder } from '@/components/layout/TabPlaceholder'

export function TimelinePage() {
  return (
    <TabPlaceholder
      title="타임라인 플래너 & 씬 디자이너"
      description="스토리 전개 흐름 제어 및 개별 사건의 인과관계 설계."
      todo={[
        '스토리 진행률 매핑 바 (10%~100% 볼륨 완급)',
        '시즌/회차 계획표 (주요 사건 · 아이디어 메모)',
        '복선 입력 + 회수 체크박스',
        '인과관계 씬 디자이너 (사건 상세 · 인물 · 공간 · 목적 · 결과)',
        '이어지는 사건 링크 그래프 (scene_links)',
      ]}
    />
  )
}
