-- ============================================================
-- MonoSound — лайки треков по пользователям.
-- Выполните ПОСЛЕ supabase/schema.sql в Supabase Dashboard → SQL Editor.
-- ============================================================

-- track_id — text, а не uuid: встроенные демо-треки (track-1, track-2...)
-- не являются строками в public.tracks (это хардкод на клиенте), поэтому
-- жёсткий foreign key сюда поставить нельзя — лайки на них всё равно
-- нужно уметь сохранять по пользователю.
create table if not exists public.track_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.track_likes enable row level security;

-- Свои лайки пользователь видит (нужно, чтобы после логина на новом
-- устройстве подтянуть "какие треки я лайкал").
drop policy if exists "Users read own likes" on public.track_likes;
create policy "Users read own likes"
on public.track_likes for select
using (auth.uid() = user_id);

-- Лайкать/дизлайкать можно только от своего имени
drop policy if exists "Users can like tracks" on public.track_likes;
create policy "Users can like tracks"
on public.track_likes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can unlike own likes" on public.track_likes;
create policy "Users can unlike own likes"
on public.track_likes for delete
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Держим общий рейтинг (tracks.likes_count) синхронным со всеми лайками
-- всех пользователей — это то, что видно в "Чарт музыки (ТОП по лайкам)".
-- Сравнение через id::text, чтобы безопасно обрабатывать и uuid реальных
-- треков, и текстовые id демо-треков (для них просто не найдётся строк —
-- обновление затронет 0 строк, без ошибки).
-- ------------------------------------------------------------
create or replace function public.sync_track_likes_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.tracks set likes_count = likes_count + 1 where id::text = new.track_id;
  elsif (tg_op = 'DELETE') then
    update public.tracks set likes_count = greatest(0, likes_count - 1) where id::text = old.track_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_track_like_change on public.track_likes;
create trigger on_track_like_change
  after insert or delete on public.track_likes
  for each row execute procedure public.sync_track_likes_count();
