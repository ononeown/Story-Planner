import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Worldbuilding, WorldCategory } from '@/types/database'

/** 세계관 항목 조회 + 생성/수정/삭제 (낙관적 업데이트) */
export function useWorldbuilding(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['worldbuilding', workspaceId]

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worldbuilding')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as Worldbuilding[]
    },
  })

  const create = useMutation({
    mutationFn: async ({
      category,
      title = '',
    }: {
      category: WorldCategory
      title?: string
    }) => {
      const { data, error } = await supabase
        .from('worldbuilding')
        .insert({ workspace_id: workspaceId, category, title })
        .select()
        .single()
      if (error) throw error
      return data as Worldbuilding
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Worldbuilding> }) => {
      const { error } = await supabase.from('worldbuilding').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Worldbuilding[]>(key)
      qc.setQueryData<Worldbuilding[]>(key, (old) =>
        old?.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('worldbuilding').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { list, create, update, remove }
}
