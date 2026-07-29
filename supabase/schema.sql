-- ============================================================
-- MonoSound — Supabase schema for track moderation
-- Выполните этот файл целиком в Supabase Dashboard → SQL Editor
-- ============================================================

-- 1) Таблица треков ------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  album text not null default 'Сингл',
  duration integer not null default 180,
  genre text not null,
  year integer not null default extract(year from now()),
  cover_url text,
  audio_url text,
  audio_pattern jsonb,
  play_count integer not null default 0,
  earnings_count numeric(10,2) not null default 0,
  likes_count integer not null default 0,
  uploaded_by text not null,               -- email автора
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now()
);

alter table public.tracks enable row level security;

-- 2) Кто что видит (SELECT) -----------------------------------------

-- Все видят одобренные треки
drop policy if exists "Public read approved tracks" on public.tracks;
create policy "Public read approved tracks"
on public.tracks for select
using (moderation_status = 'approved');

-- Автор видит свои треки в любом статусе (в т.ч. "на модерации")
drop policy if exists "Owner can read own tracks" on public.tracks;
create policy "Owner can read own tracks"
on public.tracks for select
using (uploaded_by = auth.jwt() ->> 'email');

-- Админ видит вообще всё (нужно для модерации)
drop policy if exists "Admin can read all tracks" on public.tracks;
create policy "Admin can read all tracks"
on public.tracks for select
using (auth.jwt() ->> 'email' = 'tinbotoleg@gmail.com');

-- 3) Кто может отправлять треки на модерацию (INSERT) ----------------

-- Любой авторизованный пользователь может добавить трек,
-- но ТОЛЬКО от своего email и ТОЛЬКО со статусом pending
-- (то есть сам себя одобрить он не может).
drop policy if exists "Authenticated users can submit tracks" on public.tracks;
create policy "Authenticated users can submit tracks"
on public.tracks for insert
with check (
  auth.role() = 'authenticated'
  and uploaded_by = auth.jwt() ->> 'email'
  and moderation_status = 'pending'
);

-- 4) Кто может менять статус модерации (UPDATE) ----------------------

-- Только админ может одобрять/отклонять
drop policy if exists "Admin can moderate tracks" on public.tracks;
create policy "Admin can moderate tracks"
on public.tracks for update
using (auth.jwt() ->> 'email' = 'tinbotoleg@gmail.com')
with check (auth.jwt() ->> 'email' = 'tinbotoleg@gmail.com');

-- ============================================================
-- 5) Storage: бакеты для аудио и обложек
-- ============================================================

insert into storage.buckets (id, name, public)
values ('track-audio', 'track-audio', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('track-covers', 'track-covers', true)
on conflict (id) do nothing;

-- Загружать файлы могут только авторизованные пользователи
drop policy if exists "Authenticated upload audio" on storage.objects;
create policy "Authenticated upload audio"
on storage.objects for insert
with check (bucket_id = 'track-audio' and auth.role() = 'authenticated');

drop policy if exists "Authenticated upload covers" on storage.objects;
create policy "Authenticated upload covers"
on storage.objects for insert
with check (bucket_id = 'track-covers' and auth.role() = 'authenticated');

-- Читать (слушать / показывать обложку) файлы может кто угодно —
-- сами файлы называются случайными UUID, угадать имя нельзя.
-- Приватность решается на уровне таблицы tracks (см. выше), а не файлов.
drop policy if exists "Public read audio" on storage.objects;
create policy "Public read audio"
on storage.objects for select
using (bucket_id = 'track-audio');

drop policy if exists "Public read covers" on storage.objects;
create policy "Public read covers"
on storage.objects for select
using (bucket_id = 'track-covers');
