export type AiRoleKey = 'brainstorm' | 'outline' | 'rewrite' | 'polish'

export interface AiRole {
  key: AiRoleKey
  label: string
  hint: string
  /** 작품 전체 설정 컨텍스트가 필요한 역할인지 */
  needsContext: boolean
  /** 고정 시스템 프롬프트 */
  system: string
  /** 사용자 메시지 구성 */
  buildUser: (selection: string, context: string) => string
}

export const AI_ROLES: AiRole[] = [
  {
    key: 'brainstorm',
    label: '사건 구상',
    hint: '설정을 바탕으로 사건 아이디어를 함께',
    needsContext: true,
    system:
      '당신은 장르소설 작가의 사건 구상 파트너입니다. 작품 설정·플롯을 바탕으로 ' +
      '흥미로운 사건/전개 아이디어를 3~5개 제안하세요. 각 아이디어는 한두 문장으로 간결하게, ' +
      '갈등·반전·훅 중심으로. 진부한 전개는 피하고, 기존 설정과 인물의 욕구를 적극 활용하세요.',
    buildUser: (sel, ctx) =>
      `[작품 설정]\n${ctx}\n\n[요청]\n${sel?.trim() || '위 설정을 바탕으로 다음 사건 아이디어를 제안해줘.'}`,
  },
  {
    key: 'outline',
    label: '회차 개요',
    hint: '앞으로 1~3회차 뼈대 개요 설계',
    needsContext: true,
    system:
      '당신은 웹소설 연재 구조 설계자입니다. 주어진 설정을 바탕으로 앞으로의 1~3회차 뼈대 개요를 ' +
      '구성하세요. 회차별로 (1) 핵심 사건 (2) 갈등 (3) 회차 끝의 훅(절단신공)을 제시하세요. ' +
      '전체 서사의 완급과 떡밥 회수도 고려하세요.',
    buildUser: (sel, ctx) =>
      `[작품 설정]\n${ctx}\n\n[요청]\n${sel?.trim() || '다음 1~3회차의 개요를 설계해줘.'}`,
  },
  {
    key: 'rewrite',
    label: '문장 보조',
    hint: '문장 다듬기·표현 추천',
    needsContext: false,
    system:
      '당신은 집필 보조 편집자입니다. 선택된 문장을 더 생생하고 몰입감 있게 2~3가지 버전으로 ' +
      '바꿔 제안하세요. 원문의 의미와 톤은 유지하되 표현·리듬을 개선하고, 각 버전의 차이를 짧게 덧붙이세요.',
    buildUser: (sel) => `[원문]\n${sel}`,
  },
  {
    key: 'polish',
    label: '퇴고',
    hint: '맞춤법·문맥·첨삭·몰입도',
    needsContext: false,
    system:
      '당신은 퇴고 전문 편집자입니다. 선택된 글의 맞춤법·띄어쓰기·문맥을 교정하고, 가독성과 ' +
      '독자의 다음 회차 욕구(몰입도, "도파민")를 높이는 첨삭을 제안하세요. ' +
      '(1) 교정본 (2) 주요 개선 포인트 목록 순서로 제시하세요.',
    buildUser: (sel) => `[원문]\n${sel}`,
  },
]
