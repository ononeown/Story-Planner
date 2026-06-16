-- =============================================================
-- Migration 0004 — fragments (장면 조각 / 조각글)
-- 보고 싶은 장면을 자유롭게 적어두고 사건으로 디벨롭하는 메모.
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- =============================================================

create table if not exists public.fragments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text,
  content      text,
  color        text not null default 'yellow',
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_fragments_ws on public.fragments(workspace_id);

alter table public.fragments enable row level security;
create policy "fragments_owner_all" on public.fragments
  for all using (public.owns_workspace(workspace_id))
  with check (public.owns_workspace(workspace_id));
