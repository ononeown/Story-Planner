import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * 인물별 등장 횟수 = 해당 인물이 연결된 씬(scene_characters) 수.
 * 위계(주연/조연/단역) 산정에 사용.
 */
export function useCharacterAppearances(workspaceId: string) {
  return useQuery({
    queryKey: ['character-appearances', workspaceId],
    queryFn: async (): Promise<Record<string, number>> => {
      // 이 작품의 씬 id 목록
      const { data: scenes, error: sErr } = await supabase
        .from('scenes')
        .select('id')
        .eq('workspace_id', workspaceId)
      if (sErr) throw sErr

      const ids = (scenes ?? []).map((s) => s.id)
      if (ids.length === 0) return {}

      const { data, error } = await supabase
        .from('scene_characters')
        .select('character_id')
        .in('scene_id', ids)
      if (error) throw error

      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        counts[row.character_id] = (counts[row.character_id] ?? 0) + 1
      }
      return counts
    },
  })
}

export type Tier = 'lead' | 'supporting' | 'minor' | 'none'

export const TIER_LABEL: Record<Tier, string> = {
  lead: '주연',
  supporting: '조연',
  minor: '단역',
  none: '미등장',
}

/** 작품 내 최대 등장수 대비 상대적으로 위계 산정 */
export function tierOf(count: number, max: number): Tier {
  if (count <= 0) return 'none'
  if (max <= 0) return 'minor'
  const ratio = count / max
  if (ratio >= 0.66) return 'lead'
  if (ratio >= 0.33) return 'supporting'
  return 'minor'
}
