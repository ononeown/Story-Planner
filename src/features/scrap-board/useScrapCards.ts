import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ScrapCard } from '@/types/database'

export function useScrapCards(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['scrap-cards', workspaceId]

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scrap_cards')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as ScrapCard[]
    },
  })

  const create = useMutation({
    mutationFn: async (card: Partial<ScrapCard>) => {
      const { data, error } = await supabase
        .from('scrap_cards')
        .insert({ workspace_id: workspaceId, ...card })
        .select()
        .single()
      if (error) throw error
      return data as ScrapCard
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ScrapCard> }) => {
      const { error } = await supabase.from('scrap_cards').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ScrapCard[]>(key)
      qc.setQueryData<ScrapCard[]>(key, (old) =>
        old?.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scrap_cards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { list, create, update, remove }
}
