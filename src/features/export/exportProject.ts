import JSZip from 'jszip'
import { supabase } from '@/lib/supabase'
import type {
  Character,
  Episode,
  Foreshadowing,
  Scene,
  ScrapCard,
  Synopsis,
  Workspace,
  Worldbuilding,
} from '@/types/database'

// ── 마크다운 헬퍼 ───────────────────────────────────────────
const nl = '\n'
function section(title: string, body?: string | null): string {
  if (!body || !body.trim()) return ''
  return `## ${title}${nl}${nl}${body.trim()}${nl}${nl}`
}
function field(label: string, value?: string | null): string {
  return `- **${label}:** ${value?.trim() ? value.trim() : '—'}${nl}`
}

const WORLD_CATEGORY: Record<string, string> = {
  spacetime: '시공간',
  society: '사회 · 인프라',
  mind: '정신 · 제약',
}

function buildSynopsis(ws: Workspace, syn: Synopsis | null): string {
  let md = `# ${ws.title || '제목 없는 작품'}${nl}${nl}`
  md += field('장르', ws.genre)
  md += field('예상 분량', ws.expected_length)
  md += nl
  md += section('로그라인', syn?.logline)
  md += section('기획 의도', syn?.intention)
  md += `## 5단 플롯${nl}${nl}`
  md += section('발단', syn?.plot_intro)
  md += section('전개', syn?.plot_rising)
  md += section('위기', syn?.plot_crisis)
  md += section('절정', syn?.plot_climax)
  md += section('결말', syn?.plot_resolution)
  return md
}

function buildScrapTable(cards: ScrapCard[]): string {
  let md = `# 스크랩 링크 표${nl}${nl}`
  if (cards.length === 0) return md + '_스크랩이 없습니다._' + nl
  md += `| 종류 | 제목 | 링크 | 설명 | 색상 | 핀 |${nl}`
  md += `| --- | --- | --- | --- | --- | --- |${nl}`
  for (const c of cards) {
    const title = (c.title ?? '').replace(/\|/g, '\\|')
    const desc = (c.description ?? c.body ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
    const link = c.url ? `[열기](${c.url})` : '—'
    md += `| ${c.kind === 'link' ? '링크' : '메모'} | ${title || '—'} | ${link} | ${desc || '—'} | ${c.color} | ${c.pinned ? '📌' : ''} |${nl}`
  }
  return md
}

function buildWorld(items: Worldbuilding[]): string {
  let md = `# 세계관${nl}${nl}`
  for (const cat of ['spacetime', 'society', 'mind']) {
    const group = items.filter((w) => w.category === cat)
    if (group.length === 0) continue
    md += `## ${WORLD_CATEGORY[cat]}${nl}${nl}`
    for (const w of group) {
      md += `### ${w.title || '제목 없음'}${nl}${nl}`
      if (w.content?.trim()) md += `${w.content.trim()}${nl}${nl}`
    }
  }
  return md
}

function buildCharacters(chars: Character[]): string {
  let md = `# 인물${nl}${nl}`
  for (const c of chars) {
    md += `## ${c.name || '이름 없는 인물'}${nl}${nl}`
    md += field('나이', c.age)
    md += field('성별', c.gender)
    md += field('외모', c.appearance)
    md += field('장점', c.strengths)
    md += field('단점', c.weaknesses)
    md += field('가치관', c.values_text)
    md += field('트라우마', c.trauma)
    md += field('결핍', c.lack)
    md += field('욕구 / 목적', c.desire)
    md += field('시그니처 대사', c.signature_line)
    md += nl
  }
  return md
}

function buildTimeline(eps: Episode[], foreshadows: Foreshadowing[]): string {
  let md = `# 타임라인${nl}${nl}## 회차 개요${nl}${nl}`
  md += `| 회차 | 제목 | 진행률 | 주요 사건 |${nl}| --- | --- | --- | --- |${nl}`
  for (const e of eps) {
    const summary = (e.summary ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
    md += `| ${e.episode_no} | ${(e.title ?? '').replace(/\|/g, '\\|') || '—'} | ${e.progress_percent}% | ${summary || '—'} |${nl}`
  }
  md += nl
  if (foreshadows.length > 0) {
    const epNo = new Map(eps.map((e) => [e.id, e.episode_no]))
    md += `## 복선${nl}${nl}| 복선 | 심은 회차 | 회수 | 회수 회차 |${nl}| --- | --- | --- | --- |${nl}`
    for (const f of foreshadows) {
      const planted = epNo.get(f.episode_id) ?? '?'
      const resolved = f.resolved_episode_id ? `${epNo.get(f.resolved_episode_id) ?? '?'}화` : '—'
      md += `| ${(f.content ?? '').replace(/\|/g, '\\|') || '—'} | ${planted}화 | ${f.resolved ? '✅' : '⬜'} | ${resolved} |${nl}`
    }
  }
  return md
}

function buildEpisode(
  e: Episode,
  scenes: Scene[],
  charNamesByScene: Map<string, string[]>,
  nextTitlesByScene: Map<string, string[]>,
  foreshadows: Foreshadowing[],
  epNo: Map<string, number>,
): string {
  let md = `# ${e.episode_no}화 — ${e.title || '제목 없음'}${nl}${nl}`
  md += field('진행률', `${e.progress_percent}%`)
  md += nl
  md += section('주요 사건', e.summary)
  md += section('아이디어 메모', e.idea_memo)

  if (scenes.length > 0) {
    md += `## 사건(씬)${nl}${nl}`
    for (const s of scenes) {
      md += `### ${s.title || '제목 없는 사건'}${nl}${nl}`
      md += field('상세', s.detail)
      md += field('공간', s.location)
      md += field('목적', s.purpose)
      md += field('결과', s.result)
      const chars = charNamesByScene.get(s.id) ?? []
      md += field('관련 인물', chars.join(', '))
      if (s.end_episode_id) md += field('지속', `~ ${epNo.get(s.end_episode_id) ?? '?'}화`)
      const next = nextTitlesByScene.get(s.id) ?? []
      if (next.length) md += field('이어지는 사건', next.join(', '))
      md += nl
    }
  }

  if (foreshadows.length > 0) {
    md += `## 복선${nl}${nl}`
    for (const f of foreshadows) {
      const status = f.resolved
        ? `회수됨${f.resolved_episode_id ? ` (${epNo.get(f.resolved_episode_id) ?? '?'}화)` : ''}`
        : '미회수'
      md += `- ${f.content || '내용 없음'} — ${status}${nl}`
    }
  }
  return md
}

function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '무제'
}

/** 작품 전체를 섹션별 .md 로 정리해 zip 으로 다운로드 */
export async function exportProject(ws: Workspace): Promise<void> {
  const id = ws.id

  const [synRes, scrapRes, worldRes, charRes, epRes, sceneRes] = await Promise.all([
    supabase.from('synopsis').select('*').eq('workspace_id', id).maybeSingle(),
    supabase.from('scrap_cards').select('*').eq('workspace_id', id).order('created_at'),
    supabase.from('worldbuilding').select('*').eq('workspace_id', id).order('sort_order'),
    supabase.from('characters').select('*').eq('workspace_id', id).order('sort_order'),
    supabase.from('episodes').select('*').eq('workspace_id', id).order('episode_no'),
    supabase.from('scenes').select('*').eq('workspace_id', id),
  ])

  const synopsis = (synRes.data as Synopsis | null) ?? null
  const scraps = (scrapRes.data as ScrapCard[]) ?? []
  const world = (worldRes.data as Worldbuilding[]) ?? []
  const chars = (charRes.data as Character[]) ?? []
  const eps = (epRes.data as Episode[]) ?? []
  const scenes = (sceneRes.data as Scene[]) ?? []

  const sceneIds = scenes.map((s) => s.id)
  const epIds = eps.map((e) => e.id)

  const [scCharRes, scLinkRes, foreRes] = await Promise.all([
    sceneIds.length
      ? supabase.from('scene_characters').select('*').in('scene_id', sceneIds)
      : Promise.resolve({ data: [] }),
    sceneIds.length
      ? supabase.from('scene_links').select('*').in('scene_id', sceneIds)
      : Promise.resolve({ data: [] }),
    epIds.length
      ? supabase.from('foreshadowings').select('*').in('episode_id', epIds)
      : Promise.resolve({ data: [] }),
  ])

  const charName = new Map(chars.map((c) => [c.id, c.name || '이름 없는 인물']))
  const sceneTitle = new Map(scenes.map((s) => [s.id, s.title || '제목 없는 사건']))
  const epNo = new Map(eps.map((e) => [e.id, e.episode_no]))

  const charNamesByScene = new Map<string, string[]>()
  for (const r of (scCharRes.data ?? []) as { scene_id: string; character_id: string }[]) {
    const arr = charNamesByScene.get(r.scene_id) ?? []
    arr.push(charName.get(r.character_id) ?? '?')
    charNamesByScene.set(r.scene_id, arr)
  }
  const nextTitlesByScene = new Map<string, string[]>()
  for (const r of (scLinkRes.data ?? []) as { scene_id: string; next_scene_id: string }[]) {
    const arr = nextTitlesByScene.get(r.scene_id) ?? []
    arr.push(sceneTitle.get(r.next_scene_id) ?? '?')
    nextTitlesByScene.set(r.scene_id, arr)
  }
  const foreshadows = (foreRes.data ?? []) as Foreshadowing[]

  // ── zip 구성 ──
  const zip = new JSZip()
  zip.file('시놉시스.md', buildSynopsis(ws, synopsis))
  zip.file('스크랩 링크 표.md', buildScrapTable(scraps))
  zip.file('세계관.md', buildWorld(world))
  zip.file('인물.md', buildCharacters(chars))
  zip.file('타임라인.md', buildTimeline(eps, foreshadows))

  const epFolder = zip.folder('회차')!
  for (const e of eps) {
    const epScenes = scenes.filter((s) => s.episode_id === e.id)
    const epFores = foreshadows.filter((f) => f.episode_id === e.id)
    const md = buildEpisode(e, epScenes, charNamesByScene, nextTitlesByScene, epFores, epNo)
    epFolder.file(`${sanitize(`${e.episode_no}화 ${e.title ?? ''}`)}.md`, md)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitize(ws.title)}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
