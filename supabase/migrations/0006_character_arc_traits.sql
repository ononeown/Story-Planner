-- =============================================================
-- Migration 0006 — 인물 변화표용 고정/변동 축 필드
-- constant_traits: 변하지 않는 부분 / variable_traits: 스토리에 따라 변하는 부분
-- (회차별 변동값은 기존 character_arcs 테이블 사용)
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- =============================================================

alter table public.characters
  add column if not exists constant_traits text,
  add column if not exists variable_traits text;
