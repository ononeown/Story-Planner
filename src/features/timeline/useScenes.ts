import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Scene } from '@/types/database'

export interface ScenesData {
  scenes: Scene[]
  /** sceneId → 관련 인물 character id[] */
  charMap: Record<string, string[]>
  /** sceneId → 이어지는 사건 scene id[] */
  linkMap: Record<string, string[]>
}

/** 사건 디자이너 — 사건(scenes) CRUD + 관련 인물(scene_characters) + 인과 링크(scene_links) */
export function useScenes(workspaceId: string) {
  const qc = useQueryClient()
  const key = ['scenes', workspaceId]
  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ScenesData> => {
      const { data: scenes, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('id', { ascending: true })
      if (error) throw error

      const ids = (scenes ?? []).map((s) => s.id)
      const charMap: Record<string, string[]> = {}
      const linkMap: Record<string, string[]> = {}

      if (ids.length) {
        const [scChars, scLinks] = await Promise.all([
          supabase.from('scene_characters').select('*').in('scene_id', ids),
          supabase.from('scene_links').select('*').in('scene_id', ids),
        ])
        for (const r of scChars.data ?? []) {
          ;(charMap[r.scene_id] ??= []).push(r.character_id)
        }
        for (const r of scLinks.data ?? []) {
          ;(linkMap[r.scene_id] ??= []).push(r.next_scene_id)
        }
      }

      return { scenes: (scenes ?? []) as Scene[], charMap, linkMap }
    },
  })

  const create = useMutation({
    mutationFn: async (episodeId: string | null) => {
      const { data, error } = await supabase
        .from('scenes')
        .insert({ workspace_id: workspaceId, episode_id: episodeId, title: '새 사건' })
        .select()
        .single()
      if (error) throw error
      return data as Scene
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Scene> }) => {
      const { error } = await supabase.from('scenes').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ScenesData>(key)
      qc.setQueryData<ScenesData>(key, (old) =>
        old
          ? { ...old, scenes: old.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) }
          : old,
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scenes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const toggleCharacter = useMutation({
    mutationFn: async ({
      sceneId,
      characterId,
      on,
    }: {
      sceneId: string
      characterId: string
      on: boolean
    }) => {
      if (on) {
        const { error } = await supabase
          .from('scene_characters')
          .insert({ scene_id: sceneId, character_id: characterId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('scene_characters')
          .delete()
          .eq('scene_id', sceneId)
          .eq('character_id', characterId)
        if (error) throw error
      }
    },
    onSuccess: invalidate,
  })

  const toggleLink = useMutation({
    mutationFn: async ({
      sceneId,
      nextSceneId,
      on,
    }: {
      sceneId: string
      nextSceneId: string
      on: boolean
    }) => {
      if (on) {
        const { error } = await supabase
          .from('scene_links')
          .insert({ scene_id: sceneId, next_scene_id: nextSceneId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('scene_links')
          .delete()
          .eq('scene_id', sceneId)
          .eq('next_scene_id', nextSceneId)
        if (error) throw error
      }
    },
    onSuccess: invalidate,
  })

  return { query, create, update, remove, toggleCharacter, toggleLink }
}
