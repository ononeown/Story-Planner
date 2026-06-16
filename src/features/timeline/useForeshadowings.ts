import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Foreshadowing } from '@/types/database'

/** 복선(foreshadowings) CRUD — 작품 범위(회차 id 경유)로 조회 */
export function useForeshadowings(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['foreshadowings', workspaceId]
  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: episodes, error: eErr } = await supabase
        .from('episodes')
        .select('id')
        .eq('workspace_id', workspaceId)
      if (eErr) throw eErr

      const ids = (episodes ?? []).map((e) => e.id)
      if (ids.length === 0) return [] as Foreshadowing[]

      const { data, error } = await supabase
        .from('foreshadowings')
        .select('*')
        .in('episode_id', ids)
      if (error) throw error
      return data as Foreshadowing[]
    },
  })

  const create = useMutation({
    mutationFn: async (episodeId: string) => {
      const { data, error } = await supabase
        .from('foreshadowings')
        .insert({ episode_id: episodeId, content: '' })
        .select()
        .single()
      if (error) throw error
      return data as Foreshadowing
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Foreshadowing> }) => {
      const { error } = await supabase.from('foreshadowings').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Foreshadowing[]>(key)
      qc.setQueryData<Foreshadowing[]>(key, (old) =>
        old?.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('foreshadowings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { list, create, update, remove }
}
