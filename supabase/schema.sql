-- =============================================================
-- Story Planner Web — Database Schema
-- Supabase (PostgreSQL). 실행: Supabase Dashboard > SQL Editor 에 붙여넣기.
-- 문서: docs/DATA_MODEL.md
-- =============================================================

-- 확장
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- 공통: updated_at 자동 갱신 트리거 함수
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- =============================================================
-- 1. workspaces (작품)
-- =============================================================
create table if not exists public.workspaces (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null default '제목 없는 작품',
  genre           text,
  expected_length text,
  canvas_viewport jsonb not null default '{"x":0,"y":0,"zoom":1}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_workspaces_user on public.workspaces(user_id);
create trigger trg_workspaces_updated before update on public.workspaces
  for each row execute function public.set_updated_at();

-- RLS 헬퍼: 해당 workspace를 현재 사용자가 소유하는가
create or replace function public.owns_workspace(ws uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = ws and w.user_id = auth.uid()
  );
$$;

-- =============================================================
-- 2. synopsis (Tab1, 1:1)
-- =============================================================
create table if not exists public.synopsis (
  workspace_id    uuid primary key references public.workspaces(id) on delete cascade,
  logline         text,
  intention       text,
  plot_intro      text,
  plot_rising     text,
  plot_crisis     text,
  plot_climax     text,
  plot_resolution text,
  updated_at      timestamptz not null default now()
);
create trigger trg_synopsis_updated before update on public.synopsis
  for each row execute function public.set_updated_at();

-- =============================================================
-- 3. scrap_cards / tags (Tab2)
-- =============================================================
create table if not exists public.scrap_cards (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind         text not null default 'memo' check (kind in ('link','memo')),
  url          text,
  title        text,
  description  text,
  image_url    text,
  body         text,
  color        text not null default 'yellow',
  pinned       boolean not null default false,
  collapsed    boolean not null default false,
  pos_x        numeric not null default 0,
  pos_y        numeric not null default 0,
  width        numeric not null default 240,
  height       numeric not null default 160,
  created_at   timestamptz not null default now()
);
create index if not exists idx_scrap_cards_ws on public.scrap_cards(workspace_id);

create table if not exists public.tags (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  unique (workspace_id, name)
);
create index if not exists idx_tags_ws on public.tags(workspace_id);

create table if not exists public.scrap_card_tags (
  scrap_card_id uuid not null references public.scrap_cards(id) on delete cascade,
  tag_id        uuid not null references public.tags(id) on delete cascade,
  primary key (scrap_card_id, tag_id)
);

-- =============================================================
-- 4. worldbuilding (Tab3, 자기참조 트리)
-- =============================================================
create table if not exists public.worldbuilding (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id    uuid references public.worldbuilding(id) on delete cascade,
  category     text not null check (category in ('spacetime','society','mind')),
  field_key    text,
  title        text not null default '',
  content      text,
  sort_order   int not null default 0
);
create index if not exists idx_wb_ws on public.worldbuilding(workspace_id);
create index if not exists idx_wb_parent on public.worldbuilding(parent_id);

-- =============================================================
-- 5. characters (Tab4)
-- =============================================================
create table if not exists public.characters (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  name           text not null default '',
  age            text,
  gender         text,
  appearance     text,
  strengths      text,
  weaknesses     text,
  values_text    text,
  trauma         text,
  lack           text,
  desire         text,
  signature_line text,
  portrait_url   text,
  pos_x          numeric not null default 0,
  pos_y          numeric not null default 0,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_characters_ws on public.characters(workspace_id);

create table if not exists public.character_relations (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null references public.workspaces(id) on delete cascade,
  from_character_id  uuid not null references public.characters(id) on delete cascade,
  to_character_id    uuid not null references public.characters(id) on delete cascade,
  relation_type      text,
  label              text
);
create index if not exists idx_char_rel_ws on public.character_relations(workspace_id);

-- =============================================================
-- 6. episodes / foreshadowings / character_arcs (Tab5/Tab4/Tab6)
-- =============================================================
create table if not exists public.episodes (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  season           int not null default 1,
  episode_no       int not null default 1,
  title            text,
  summary          text,
  idea_memo        text,
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  content          jsonb,          -- TipTap 본문
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_episodes_ws on public.episodes(workspace_id);
create trigger trg_episodes_updated before update on public.episodes
  for each row execute function public.set_updated_at();

create table if not exists public.foreshadowings (
  id                  uuid primary key default gen_random_uuid(),
  episode_id          uuid not null references public.episodes(id) on delete cascade,
  content             text not null default '',
  resolved            boolean not null default false,
  resolved_episode_id uuid references public.episodes(id) on delete set null
);
create index if not exists idx_foreshadow_ep on public.foreshadowings(episode_id);

create table if not exists public.character_arcs (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  episode_id   uuid not null references public.episodes(id) on delete cascade,
  task         text,
  goal         text,
  emotion      text,
  action       text,
  result       text,
  unique (character_id, episode_id)
);
create index if not exists idx_arcs_char on public.character_arcs(character_id);

create table if not exists public.episode_characters (
  episode_id   uuid not null references public.episodes(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  primary key (episode_id, character_id)
);

-- =============================================================
-- 7. scenes (Tab5 씬 디자이너)
-- =============================================================
create table if not exists public.scenes (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  episode_id      uuid references public.episodes(id) on delete set null,
  end_episode_id  uuid references public.episodes(id) on delete set null,
  title           text not null default '',
  detail          text,
  location        text,
  purpose         text,
  result          text,
  pos_x           numeric not null default 0,
  pos_y           numeric not null default 0
);
create index if not exists idx_scenes_ws on public.scenes(workspace_id);

create table if not exists public.scene_characters (
  scene_id     uuid not null references public.scenes(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  primary key (scene_id, character_id)
);

create table if not exists public.scene_links (
  scene_id      uuid not null references public.scenes(id) on delete cascade,
  next_scene_id uuid not null references public.scenes(id) on delete cascade,
  primary key (scene_id, next_scene_id),
  check (scene_id <> next_scene_id)
);

-- =============================================================
-- 7b. fragments (장면 조각 / 조각글)
-- =============================================================
create table if not exists public.fragments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text,
  content      text,
  color        text not null default 'yellow',
  collapsed    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_fragments_ws on public.fragments(workspace_id);

-- =============================================================
-- 8. card_links (스크랩 카드 다형성 귀속, Tab6 드롭)
-- =============================================================
create table if not exists public.card_links (
  id            uuid primary key default gen_random_uuid(),
  scrap_card_id uuid not null references public.scrap_cards(id) on delete cascade,
  target_type   text not null check (target_type in ('character','worldbuilding','episode')),
  target_id     uuid not null,
  unique (scrap_card_id, target_type, target_id)
);
create index if not exists idx_card_links_card on public.card_links(scrap_card_id);
create index if not exists idx_card_links_target on public.card_links(target_type, target_id);

-- =============================================================
-- 9. Row Level Security (RLS)
--    원칙: 본인이 소유한 workspace에 속한 행만 접근 가능.
-- =============================================================
alter table public.workspaces          enable row level security;
alter table public.synopsis            enable row level security;
alter table public.scrap_cards         enable row level security;
alter table public.tags                enable row level security;
alter table public.scrap_card_tags     enable row level security;
alter table public.worldbuilding       enable row level security;
alter table public.characters          enable row level security;
alter table public.character_relations enable row level security;
alter table public.episodes            enable row level security;
alter table public.foreshadowings      enable row level security;
alter table public.character_arcs      enable row level security;
alter table public.episode_characters  enable row level security;
alter table public.scenes              enable row level security;
alter table public.fragments           enable row level security;
alter table public.scene_characters    enable row level security;
alter table public.scene_links         enable row level security;
alter table public.card_links          enable row level security;

-- workspaces: 본인 소유 행만
create policy "ws_owner_all" on public.workspaces
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- workspace_id 컬럼을 직접 가진 테이블들: owns_workspace()로 검사
do $$
declare t text;
begin
  foreach t in array array[
    'synopsis','scrap_cards','tags','worldbuilding','characters',
    'character_relations','episodes','scenes','fragments'
  ] loop
    execute format($f$
      create policy "%1$s_owner_all" on public.%1$I
        for all using (public.owns_workspace(workspace_id))
        with check (public.owns_workspace(workspace_id));
    $f$, t);
  end loop;
end $$;

-- 손자 테이블: 상위 FK를 거쳐 owns_workspace() 확인
create policy "scrap_card_tags_owner" on public.scrap_card_tags for all
  using (exists (select 1 from public.scrap_cards c
    where c.id = scrap_card_id and public.owns_workspace(c.workspace_id)))
  with check (exists (select 1 from public.scrap_cards c
    where c.id = scrap_card_id and public.owns_workspace(c.workspace_id)));

create policy "card_links_owner" on public.card_links for all
  using (exists (select 1 from public.scrap_cards c
    where c.id = scrap_card_id and public.owns_workspace(c.workspace_id)))
  with check (exists (select 1 from public.scrap_cards c
    where c.id = scrap_card_id and public.owns_workspace(c.workspace_id)));

create policy "foreshadowings_owner" on public.foreshadowings for all
  using (exists (select 1 from public.episodes e
    where e.id = episode_id and public.owns_workspace(e.workspace_id)))
  with check (exists (select 1 from public.episodes e
    where e.id = episode_id and public.owns_workspace(e.workspace_id)));

create policy "character_arcs_owner" on public.character_arcs for all
  using (exists (select 1 from public.characters c
    where c.id = character_id and public.owns_workspace(c.workspace_id)))
  with check (exists (select 1 from public.characters c
    where c.id = character_id and public.owns_workspace(c.workspace_id)));

create policy "episode_characters_owner" on public.episode_characters for all
  using (exists (select 1 from public.episodes e
    where e.id = episode_id and public.owns_workspace(e.workspace_id)))
  with check (exists (select 1 from public.episodes e
    where e.id = episode_id and public.owns_workspace(e.workspace_id)));

create policy "scene_characters_owner" on public.scene_characters for all
  using (exists (select 1 from public.scenes s
    where s.id = scene_id and public.owns_workspace(s.workspace_id)))
  with check (exists (select 1 from public.scenes s
    where s.id = scene_id and public.owns_workspace(s.workspace_id)));

create policy "scene_links_owner" on public.scene_links for all
  using (exists (select 1 from public.scenes s
    where s.id = scene_id and public.owns_workspace(s.workspace_id)))
  with check (exists (select 1 from public.scenes s
    where s.id = scene_id and public.owns_workspace(s.workspace_id)));
