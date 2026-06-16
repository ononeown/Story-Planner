// Supabase Edge Function: OG 메타 스크래퍼
// 배포: supabase functions deploy og-scrape
// 호출: supabase.functions.invoke('og-scrape', { body: { url } })
//
// 브라우저는 CORS 때문에 외부 URL 을 직접 fetch 할 수 없으므로
// 이 함수가 프록시로 대상 페이지를 받아 og:title/og:image/og:description 을 파싱한다.

// @ts-expect-error: Deno 런타임 전역 (로컬 TS 서버에는 타입 없음)
const handler = async (req: Request): Promise<Response> => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return json({ error: 'url 이 필요합니다.' }, 400, cors)
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 StoryPlannerBot' },
      redirect: 'follow',
    })
    const html = await res.text()

    const og = {
      title: meta(html, 'og:title') ?? title(html) ?? url,
      image: meta(html, 'og:image'),
      description: meta(html, 'og:description') ?? meta(html, 'description'),
      url,
    }
    return json(og, 200, cors)
  } catch (e) {
    return json({ error: String(e) }, 500, cors)
  }
}

function meta(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
    'i',
  )
  return html.match(re)?.[1] ?? null
}

function title(html: string): string | null {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

// @ts-expect-error: Deno 전역
Deno.serve(handler)
