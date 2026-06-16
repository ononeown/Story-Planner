import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Synopsis } from '@/types/database'

/**
 * 시놉시스 행(workspace 당 1개) 조회 + 부분 저장.
 * 시놉시스 탭(로그라인/기획의도)과 플롯 탭(5단 플롯)이 같은 행을 공유한다.
 */
export function useSynopsis(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['synopsis', workspaceId]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('synopsis')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (error) throw error
      return (data as Synopsis | null) ?? null
    },
  })

  const update = useMutation({
    mutationFn: async (patch: Partial<Synopsis>) => {
      const { error } = await supabase
        .from('synopsis')
        .upsert({ workspace_id: workspaceId, ...patch })
      if (error) throw error
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Synopsis | null>(key)
      qc.setQueryData<Synopsis | null>(key, (old) => ({
        ...(old ?? ({ workspace_id: workspaceId } as Synopsis)),
        ...patch,
      }))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev)
    },
  })

  return { query, update }
}
