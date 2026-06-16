import { TabPlaceholder } from '@/components/layout/TabPlaceholder'

export function CharactersPage() {
  return (
    <TabPlaceholder
      title="캐릭터 데이터베이스"
      description="인물 프로필 설정 및 인과적 서사 추적 모듈."
      todo={[
        '그리드 캐릭터 리스트 + 슬라이드아웃 상세 패널',
        '프로필: 외적 요소 / 내적 요소 구분 저장',
        '관계도 매핑 (React Flow 선 연결 + 관계 오버레이)',
        '인물 변화표 Arc Matrix (회차×캐릭터)',
        '인물 등장표 Presence Grid (회차 On/Off 체크박스)',
      ]}
    />
  )
}
