-- =============================================================
-- Migration 0003 — scenes.end_episode_id (사건 지속 범위)
-- 사건이 시작 회차(episode_id)부터 종료 회차(end_episode_id)까지 지속됨을 표현.
-- null 이면 단발성(시작 회차에서 끝남).
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- =============================================================

alter table public.scenes
  add column if not exists end_episode_id uuid
    references public.episodes(id) on delete set null;
