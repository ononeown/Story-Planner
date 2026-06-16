-- =============================================================
-- Migration 0002 — characters.sort_order (인물 카드 수동 정렬)
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- =============================================================

alter table public.characters
  add column if not exists sort_order int not null default 0;

-- 기존 인물에 초기 정렬값 부여 (작품별 생성순)
with ordered as (
  select
    id,
    row_number() over (partition by workspace_id order by created_at) - 1 as rn
  from public.characters
)
update public.characters c
set sort_order = o.rn
from ordered o
where o.id = c.id;
