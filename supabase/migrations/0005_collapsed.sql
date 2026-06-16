-- =============================================================
-- Migration 0005 — collapsed (포스트잇/장면 조각 접기 상태 저장)
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- =============================================================

alter table public.scrap_cards
  add column if not exists collapsed boolean not null default false;

alter table public.fragments
  add column if not exists collapsed boolean not null default false;
