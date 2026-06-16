import { TabPlaceholder } from '@/components/layout/TabPlaceholder'

export function WorkspacePage() {
  return (
    <TabPlaceholder
      title="워크스페이스 & 본문 에디터"
      description="실제 집필 공간. 타 탭 데이터와 유기적으로 상호작용하는 중심."
      todo={[
        '3분할 레이아웃 (회차 리스트 · TipTap 에디터 · 플로팅 사이드바)',
        'TipTap 마크다운 단축키 에디터 · 자동 저장',
        '플로팅 사이드바 위젯 (스크랩/캐릭터 설정 호출)',
        '드롭앤드롭 데이터 귀속 (카드 → 캐릭터/세계관, card_links 생성)',
      ]}
    />
  )
}
