import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CharacterArc } from '@/types/database'

/** 인물 변화표 — 회차별 변동값(character_arcs). (character_id, episode_id) 유니크 → upsert */
export function useCharacterArcs(characterId: string) {
  const qc = useQueryClient()
  const key = ['character-arcs', characterId]

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_arcs')
        .select('*')
        .eq('character_id', characterId)
      if (error) throw error
      return data as CharacterArc[]
    },
  })

  const upsert = useMutation({
    mutationFn: async ({ episodeId, patch }: { episodeId: string; patch: Partial<CharacterArc> }) => {
      const { error } = await supabase
        .from('character_arcs')
        .upsert(
          { character_id: characterId, episode_id: episodeId, ...patch },
          { onConflict: 'character_id,episode_id' },
        )
      if (error) throw error
    },
    onMutate: async ({ episodeId, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CharacterArc[]>(key)
      qc.setQueryData<CharacterArc[]>(key, (old) => {
        const arr = old ? [...old] : []
        const i = arr.findIndex((a) => a.episode_id === episodeId)
        if (i >= 0) arr[i] = { ...arr[i], ...patch }
        else
          arr.push({
            id: `temp-${episodeId}`,
            character_id: characterId,
            episode_id: episodeId,
            task: null, goal: null, emotion: null, action: null, result: null,
            ...patch,
          } as CharacterArc)
        return arr
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
  })

  return { list, upsert }
}
