import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CharacterRelation } from '@/types/database'

/** 인물 관계(화살표) CRUD */
export function useCharacterRelations(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['character-relations', workspaceId]
  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_relations')
        .select('*')
        .eq('workspace_id', workspaceId)
      if (error) throw error
      return data as CharacterRelation[]
    },
  })

  const create = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const { data, error } = await supabase
        .from('character_relations')
        .insert({ workspace_id: workspaceId, from_character_id: from, to_character_id: to, label: '' })
        .select()
        .single()
      if (error) throw error
      return data as CharacterRelation
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CharacterRelation> }) => {
      const { error } = await supabase.from('character_relations').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CharacterRelation[]>(key)
      qc.setQueryData<CharacterRelation[]>(key, (old) =>
        old?.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('character_relations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { list, create, update, remove }
}
