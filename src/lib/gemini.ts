// Gemini API 호출 레이어 (클라이언트 직접 호출 — MVP).
// 주의: VITE_ 키는 브라우저에 노출됩니다. 운영에서는 Supabase Edge Function 프록시를 권장.

const KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const MODEL = 'gemini-2.0-flash'

export const isGeminiConfigured = Boolean(KEY)

/**
 * 고정 시스템 프롬프트(system) + 사용자 입력(user)로 1회 응답을 받는다.
 * 역할별 system 은 고정이므로 호출마다 user 만 바뀐다.
 */
export async function askGemini(system: string, user: string): Promise<string> {
  if (!KEY) throw new Error('VITE_GEMINI_API_KEY 가 설정되지 않았습니다. (.env.local)')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.9 },
      }),
    },
  )

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`Gemini 오류 ${res.status}: ${msg.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  if (!text) throw new Error('응답이 비어 있습니다.')
  return text
}
