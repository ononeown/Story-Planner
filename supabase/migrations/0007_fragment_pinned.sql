-- =============================================================
-- Migration 0007 — 장면 조각 핀 고정
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- =============================================================

alter table public.fragments
  add column if not exists pinned boolean not null default false;
