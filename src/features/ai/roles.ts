export type AiRoleKey = 'brainstorm' | 'outline' | 'rewrite' | 'polish'

// 무료 할당량에 무난한 기본 모델. 필요 시 역할별로 교체 가능.
const FLASH = 'gemini-2.5-flash'

export interface AiRole {
  key: AiRoleKey
  label: string
  hint: string
  /** 작품 전체 설정 컨텍스트가 필요한 역할인지 */
  needsContext: boolean
  /** 역할별 모델 */
  model: string
  /** 창의성(0~1+) */
  temperature: number
  /** 최대 출력 토큰 */
  maxOutputTokens: number
  /** 고정 시스템 프롬프트 */
  system: string
  /** 사용자 메시지 구성 */
  buildUser: (selection: string, context: string) => string
}

export const AI_ROLES: AiRole[] = [
  {
    key: 'brainstorm',
    label: '장면 구상',
    hint: '이어질 세밀한 장면·감정 아이디어',
    needsContext: true,
    model: FLASH,
    temperature: 1.0,
    maxOutputTokens: 1024,
    system:
      '당신은 초장편 웹소설 연재를 함께 쓰는 파트너입니다. 지금 다루는 것은 완결된 단편이 아니라 ' +
      '거대한 서사의 아주 작은 한 조각입니다. 절대 기승전결을 완성하거나 갈등을 마무리하지 마세요.\n' +
      '작품 설정·맥락을 바탕으로, 지금 이 지점에서 이어질 만한 "세밀한 장면/비트" 아이디어를 3~5개 제안하세요. ' +
      '큰 사건의 완결이 아니라 감정의 미세한 변화·인물 사이의 긴장·내면의 흔들림을 만드는 작은 장면 단위로. ' +
      '각 아이디어는 한두 문장, 진부하지 않게, 다음 흐름으로 이어질 여지를 남기세요.',
    buildUser: (sel, ctx) =>
      `[작품 설정]\n${ctx}\n\n[지금 지점/요청]\n${sel?.trim() || '위 설정을 바탕으로, 지금 이어질 세밀한 장면 아이디어를 제안해줘.'}`,
  },
  {
    key: 'outline',
    label: '구간 설계',
    hint: '지금 구간을 장면 단위로 흐름 설계',
    needsContext: true,
    model: FLASH,
    temperature: 0.9,
    maxOutputTokens: 1536,
    system:
      '당신은 초장편 웹소설 연재의 한 구간을 함께 설계하는 파트너입니다. 완결 구조(기승전결)를 만들지 마세요. ' +
      '지금은 거대한 이야기의 작은 한 구간일 뿐입니다.\n' +
      '주어진 설정을 바탕으로, 지금 구간(몇 개의 장면 ~ 1회차 분량)을 "장면 단위"로 흐르게 설계하세요. ' +
      '각 장면마다 (1) 무슨 일이 일어나는지 (2) 감정선이 어떻게 움직이는지 (3) 다음 장면으로 어떻게 이어지는지를 짧게. ' +
      '전체 갈등을 해소하지 말고, 떡밥과 감정의 여운을 남겨 다음으로 이어지게 하세요.',
    buildUser: (sel, ctx) =>
      `[작품 설정]\n${ctx}\n\n[지금 구간/요청]\n${sel?.trim() || '지금 구간을 장면 단위로 설계해줘.'}`,
  },
  {
    key: 'rewrite',
    label: '문장 보조',
    hint: '장면 문장 다듬기·감정선 살리기',
    needsContext: false,
    model: FLASH,
    temperature: 0.8,
    maxOutputTokens: 1024,
    system:
      '당신은 초장편 연재의 한 장면을 함께 다듬는 집필 보조입니다. 선택된 문장은 완결된 글이 아니라 ' +
      '계속 이어지는 장면의 일부입니다. 결말짓거나 요약하지 말고, 흐름을 끊지 마세요.\n' +
      '선택된 문장을 더 생생하고 감정의 결이 살아있게 2~3가지로 다시 쓰세요. 의미·톤·인물 시점은 유지하고, ' +
      '감각 묘사·인물 내면·여백을 활용해 몰입을 높이되, 각 버전의 차이를 짧게 덧붙이세요.',
    buildUser: (sel) => `[원문(이어지는 장면의 일부)]\n${sel}`,
  },
  {
    key: 'polish',
    label: '퇴고',
    hint: '맞춤법·문맥·첨삭·몰입도',
    needsContext: false,
    model: FLASH,
    temperature: 0.4,
    maxOutputTokens: 1536,
    system:
      '당신은 퇴고 전문 편집자입니다. 선택된 글의 맞춤법·띄어쓰기·문맥을 교정하고, 가독성과 ' +
      '독자의 다음 회차 욕구(몰입도, "도파민")를 높이는 첨삭을 제안하세요. ' +
      '(1) 교정본 (2) 주요 개선 포인트 목록 순서로 제시하세요.',
    buildUser: (sel) => `[원문]\n${sel}`,
  },
]
