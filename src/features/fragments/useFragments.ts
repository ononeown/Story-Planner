import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Fragment } from '@/types/database'

/** 장면 조각(조각글) CRUD */
export function useFragments(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['fragments', workspaceId]

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fragments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Fragment[]
    },
  })

  const create = useMutation({
    mutationFn: async (color: string = 'yellow') => {
      const { data, error } = await supabase
        .from('fragments')
        .insert({ workspace_id: workspaceId, color })
        .select()
        .single()
      if (error) throw error
      return data as Fragment
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Fragment> }) => {
      const { error } = await supabase.from('fragments').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Fragment[]>(key)
      qc.setQueryData<Fragment[]>(key, (old) =>
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
      const { error } = await supabase.from('fragments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { list, create, update, remove }
}
