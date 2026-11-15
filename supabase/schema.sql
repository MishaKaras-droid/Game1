-- Кря и Буль: общая таблица рекордов и достижений.
-- Вставьте весь файл в Supabase → SQL Editor → Run. Повторный запуск безопасен.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  nick       text    not null check (char_length(nick) between 2 and 16),
  mode       text    not null check (mode in ('duck', 'fish')),
  level      int     not null check (level between 1 and 30),
  score      int     not null check (score between 0 and 10000000),
  won        boolean not null default false,
  stars      int     not null default 0 check (stars between 0 and 3),
  created_at timestamptz not null default now()
);
create index if not exists scores_mode_score on public.scores (mode, score desc);

create table if not exists public.achievements (
  nick       text not null check (char_length(nick) between 2 and 16),
  code       text not null check (char_length(code) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key (nick, code)
);

-- Доступ без входа: всем можно читать и добавлять, менять и удалять нельзя.
alter table public.scores       enable row level security;
alter table public.achievements enable row level security;

drop policy if exists "scores read"   on public.scores;
drop policy if exists "scores add"    on public.scores;
drop policy if exists "ach read"      on public.achievements;
drop policy if exists "ach add"       on public.achievements;
create policy "scores read" on public.scores       for select to anon, authenticated using (true);
create policy "scores add"  on public.scores       for insert to anon, authenticated with check (true);
create policy "ach read"    on public.achievements for select to anon, authenticated using (true);
create policy "ach add"     on public.achievements for insert to anon, authenticated with check (true);

grant select, insert on public.scores, public.achievements to anon, authenticated;
