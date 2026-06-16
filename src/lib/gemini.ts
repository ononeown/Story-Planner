// Gemini API 호출 레이어 (클라이언트 직접 호출 — MVP).
// 주의: VITE_ 키는 브라우저에 노출됩니다. 운영에서는 Supabase Edge Function 프록시를 권장.

const KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isGeminiConfigured = Boolean(KEY)

export interface GenOptions {
  model: string
  temperature?: number
  maxOutputTokens?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 고정 시스템 프롬프트(system) + 사용자 입력(user)로 1회 응답.
 * 역할별 model/생성 파라미터를 opts 로 받는다. 429/503 은 1회 자동 재시도.
 */
export async function askGemini(system: string, user: string, opts: GenOptions): Promise<string> {
  if (!KEY) throw new Error('VITE_GEMINI_API_KEY 가 설정되지 않았습니다. (.env.local)')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${KEY}`
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.9,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
    },
  })

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (res.ok) {
      const data = await res.json()
      const text: string =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? '')
          .join('') ?? ''
      if (!text) throw new Error('응답이 비어 있습니다. (안전 필터 또는 토큰 한도일 수 있어요)')
      return text
    }

    // 분당 한도/일시적 과부하 → 1회 재시도
    if ((res.status === 429 || res.status === 503) && attempt === 0) {
      await sleep(2500)
      continue
    }

    if (res.status === 429) {
      throw new Error(
        'Gemini 무료 할당량을 초과했습니다(분당/일일 요청 한도). 잠시 후 다시 시도하거나 ' +
          'Google AI Studio에서 결제를 설정하세요.',
      )
    }
    const msg = await res.text().catch(() => '')
    throw new Error(`Gemini 오류 ${res.status}: ${msg.slice(0, 200)}`)
  }
  throw new Error('Gemini 요청에 실패했습니다.')
}
