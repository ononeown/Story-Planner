import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Episode } from '@/types/database'

/** 회차(Episode) 계획표 CRUD */
export function useEpisodes(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['episodes', workspaceId]

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('episode_no', { ascending: true })
      if (error) throw error
      return data as Episode[]
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      const current = qc.getQueryData<Episode[]>(key) ?? []
      const nextNo = current.reduce((m, e) => Math.max(m, e.episode_no), 0) + 1
      const { data, error } = await supabase
        .from('episodes')
        .insert({ workspace_id: workspaceId, episode_no: nextNo, sort_order: nextNo })
        .select()
        .single()
      if (error) throw error
      return data as Episode
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Episode> }) => {
      const { error } = await supabase.from('episodes').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Episode[]>(key)
      qc.setQueryData<Episode[]>(key, (old) =>
        old?.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('episodes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { list, create, update, remove }
}
