// DB 엔티티 타입 — supabase/schema.sql 와 1:1 대응.
// (추후 `supabase gen types typescript` 로 자동 생성 대체 가능)

export type StickyColor = 'yellow' | 'pink' | 'green' | 'blue' | 'gray'
export type ScrapKind = 'link' | 'memo'
export type WorldCategory = 'spacetime' | 'society' | 'mind'
export type CardLinkTarget = 'character' | 'worldbuilding' | 'episode'

export interface Workspace {
  id: string
  user_id: string
  title: string
  genre: string | null
  expected_length: string | null
  canvas_viewport: { x: number; y: number; zoom: number }
  created_at: string
  updated_at: string
}

export interface Synopsis {
  workspace_id: string
  logline: string | null
  intention: string | null
  plot_intro: string | null
  plot_rising: string | null
  plot_crisis: string | null
  plot_climax: string | null
  plot_resolution: string | null
  updated_at: string
}

export interface ScrapCard {
  id: string
  workspace_id: string
  kind: ScrapKind
  url: string | null
  title: string | null
  description: string | null
  image_url: string | null
  body: string | null
  color: StickyColor
  pinned: boolean
  pos_x: number
  pos_y: number
  width: number
  height: number
  created_at: string
}

export interface Tag {
  id: string
  workspace_id: string
  name: string
}

export interface Worldbuilding {
  id: string
  workspace_id: string
  parent_id: string | null
  category: WorldCategory
  field_key: string | null
  title: string
  content: string | null
  sort_order: number
}

export interface Character {
  id: string
  workspace_id: string
  name: string
  age: string | null
  gender: string | null
  appearance: string | null
  strengths: string | null
  weaknesses: string | null
  values_text: string | null
  trauma: string | null
  lack: string | null
  desire: string | null
  signature_line: string | null
  portrait_url: string | null
  pos_x: number
  pos_y: number
  created_at: string
}

export interface CharacterRelation {
  id: string
  workspace_id: string
  from_character_id: string
  to_character_id: string
  relation_type: string | null
  label: string | null
}

export interface Episode {
  id: string
  workspace_id: string
  season: number
  episode_no: number
  title: string | null
  summary: string | null
  idea_memo: string | null
  progress_percent: number
  content: unknown | null // TipTap JSON
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Foreshadowing {
  id: string
  episode_id: string
  content: string
  resolved: boolean
  resolved_episode_id: string | null
}

export interface CharacterArc {
  id: string
  character_id: string
  episode_id: string
  task: string | null
  goal: string | null
  emotion: string | null
  action: string | null
  result: string | null
}

export interface Scene {
  id: string
  workspace_id: string
  episode_id: string | null
  title: string
  detail: string | null
  location: string | null
  purpose: string | null
  result: string | null
  pos_x: number
  pos_y: number
}

export interface CardLink {
  id: string
  scrap_card_id: string
  target_type: CardLinkTarget
  target_id: string
}
