import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Character } from '@/types/database'

/** 캐릭터 목록 조회 + 생성/수정/삭제 (낙관적 업데이트) */
export function useCharacters(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['characters', workspaceId]

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Character[]
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      const current = qc.getQueryData<Character[]>(key) ?? []
      const nextOrder = current.reduce((m, c) => Math.max(m, c.sort_order), -1) + 1
      const { data, error } = await supabase
        .from('characters')
        .insert({ workspace_id: workspaceId, name: '새 인물', sort_order: nextOrder })
        .select()
        .single()
      if (error) throw error
      return data as Character
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  /** 카드 순서 변경: 주어진 id 순서대로 sort_order 재부여 */
  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('characters').update({ sort_order: index }).eq('id', id),
        ),
      )
    },
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Character[]>(key)
      qc.setQueryData<Character[]>(key, (old) => {
        if (!old) return old
        const byId = new Map(old.map((c) => [c.id, c]))
        return orderedIds
          .map((id, index) => {
            const c = byId.get(id)
            return c ? { ...c, sort_order: index } : null
          })
          .filter((c): c is Character => c !== null)
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Character> }) => {
      const { error } = await supabase.from('characters').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Character[]>(key)
      qc.setQueryData<Character[]>(key, (old) =>
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
      const { error } = await supabase.from('characters').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('characters').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { list, create, update, remove, removeMany, reorder }
}
