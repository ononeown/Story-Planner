import JSZip from 'jszip'
import { supabase } from '@/lib/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

const uid = () => crypto.randomUUID()

async function insert(table: string, rows: any[]) {
  if (rows.length === 0) return
  const { error } = await supabase.from(table).insert(rows)
  if (error) throw new Error(`${table} 삽입 실패: ${error.message}`)
}

/**
 * 내보내기 zip(project.json)을 읽어 **새 작품**으로 복원한다.
 * 모든 엔티티에 새 UUID를 부여하고 FK를 재매핑 → 원본과 독립된 사본(브랜치).
 * @returns 새 workspace id
 */
export async function importProject(file: File, userId: string): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const jsonFile = zip.file('project.json')
  if (!jsonFile) {
    throw new Error('project.json 이 없습니다. 이 앱의 "내보내기"로 만든 zip 을 업로드하세요.')
  }
  const data = JSON.parse(await jsonFile.async('string'))

  // 새 작품
  const { data: ws, error: wErr } = await supabase
    .from('workspaces')
    .insert({
      user_id: userId,
      title: `${data.workspace?.title ?? '가져온 작품'} (사본)`,
      genre: data.workspace?.genre ?? null,
      expected_length: data.workspace?.expected_length ?? null,
      canvas_viewport: data.workspace?.canvas_viewport ?? { x: 0, y: 0, zoom: 1 },
    })
    .select()
    .single()
  if (wErr) throw new Error(`작품 생성 실패: ${wErr.message}`)
  const wsId = ws.id as string

  const charMap = new Map<string, string>()
  const epMap = new Map<string, string>()
  const sceneMap = new Map<string, string>()
  const worldMap = new Map<string, string>()

  // characters
  await insert(
    'characters',
    (data.characters ?? []).map((c: any) => {
      const id = uid()
      charMap.set(c.id, id)
      return {
        id, workspace_id: wsId, name: c.name ?? '', age: c.age, gender: c.gender,
        appearance: c.appearance, strengths: c.strengths, weaknesses: c.weaknesses,
        values_text: c.values_text, trauma: c.trauma, lack: c.lack, desire: c.desire,
        signature_line: c.signature_line, portrait_url: c.portrait_url,
        pos_x: c.pos_x ?? 0, pos_y: c.pos_y ?? 0, sort_order: c.sort_order ?? 0,
      }
    }),
  )

  // episodes
  await insert(
    'episodes',
    (data.episodes ?? []).map((e: any) => {
      const id = uid()
      epMap.set(e.id, id)
      return {
        id, workspace_id: wsId, season: e.season ?? 1, episode_no: e.episode_no ?? 1,
        title: e.title, summary: e.summary, idea_memo: e.idea_memo,
        progress_percent: e.progress_percent ?? 0, content: e.content ?? null,
        sort_order: e.sort_order ?? 0,
      }
    }),
  )

  // scenes
  await insert(
    'scenes',
    (data.scenes ?? []).map((s: any) => {
      const id = uid()
      sceneMap.set(s.id, id)
      return {
        id, workspace_id: wsId,
        episode_id: s.episode_id ? epMap.get(s.episode_id) ?? null : null,
        end_episode_id: s.end_episode_id ? epMap.get(s.end_episode_id) ?? null : null,
        title: s.title ?? '', detail: s.detail, location: s.location,
        purpose: s.purpose, result: s.result, pos_x: s.pos_x ?? 0, pos_y: s.pos_y ?? 0,
      }
    }),
  )

  // worldbuilding (parent_id 재매핑 — 먼저 모든 id 확보)
  const worldRows: any[] = data.worldbuilding ?? []
  worldRows.forEach((w) => worldMap.set(w.id, uid()))
  await insert(
    'worldbuilding',
    worldRows.map((w) => ({
      id: worldMap.get(w.id), workspace_id: wsId,
      parent_id: w.parent_id ? worldMap.get(w.parent_id) ?? null : null,
      category: w.category, field_key: w.field_key, title: w.title ?? '',
      content: w.content, sort_order: w.sort_order ?? 0,
    })),
  )

  // scrap_cards
  await insert(
    'scrap_cards',
    (data.scrap_cards ?? []).map((c: any) => ({
      id: uid(), workspace_id: wsId, kind: c.kind ?? 'memo', url: c.url, title: c.title,
      description: c.description, image_url: c.image_url, body: c.body, color: c.color ?? 'yellow',
      pinned: c.pinned ?? false, collapsed: c.collapsed ?? false,
      pos_x: c.pos_x ?? 0, pos_y: c.pos_y ?? 0, width: c.width ?? 240, height: c.height ?? 160,
    })),
  )

  // fragments
  await insert(
    'fragments',
    (data.fragments ?? []).map((f: any) => ({
      id: uid(), workspace_id: wsId, title: f.title, content: f.content,
      color: f.color ?? 'yellow', collapsed: f.collapsed ?? false, sort_order: f.sort_order ?? 0,
    })),
  )

  // synopsis (1:1)
  if (data.synopsis) {
    const s = data.synopsis
    await insert('synopsis', [{
      workspace_id: wsId, logline: s.logline, intention: s.intention,
      plot_intro: s.plot_intro, plot_rising: s.plot_rising, plot_crisis: s.plot_crisis,
      plot_climax: s.plot_climax, plot_resolution: s.plot_resolution,
    }])
  }

  // foreshadowings
  await insert(
    'foreshadowings',
    (data.foreshadowings ?? [])
      .map((f: any) => ({
        id: uid(), episode_id: epMap.get(f.episode_id), content: f.content ?? '',
        resolved: f.resolved ?? false,
        resolved_episode_id: f.resolved_episode_id ? epMap.get(f.resolved_episode_id) ?? null : null,
      }))
      .filter((f: any) => f.episode_id),
  )

  // scene_characters / scene_links
  await insert(
    'scene_characters',
    (data.scene_characters ?? [])
      .map((r: any) => ({ scene_id: sceneMap.get(r.scene_id), character_id: charMap.get(r.character_id) }))
      .filter((r: any) => r.scene_id && r.character_id),
  )
  await insert(
    'scene_links',
    (data.scene_links ?? [])
      .map((r: any) => ({ scene_id: sceneMap.get(r.scene_id), next_scene_id: sceneMap.get(r.next_scene_id) }))
      .filter((r: any) => r.scene_id && r.next_scene_id),
  )

  return wsId
}
