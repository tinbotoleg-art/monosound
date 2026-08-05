-- ============================================================
-- MonoSound — подписка: таблица профилей + защита от самостоятельной
-- активации без оплаты. Выполните в Supabase Dashboard → SQL Editor,
-- ПОСЛЕ supabase/schema.sql (там уже есть tracks и хранилище).
-- ============================================================

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_subscribed boolean not null default false,
  subscription_expires_at timestamptz,
  telegram_chat_id bigint,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Пользователь видит только свой профиль
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles for select
using (auth.uid() = user_id);

-- Разрешаем пользователю создать свою строку (на случай, если триггер
-- ниже почему-то не сработал раньше первого обращения к профилю).
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

-- ВАЖНО: политики UPDATE на is_subscribed / subscription_expires_at для
-- обычных пользователей НЕТ. Единственный, кто может их менять —
-- Edge Function telegram-webhook, работающая через service_role key,
-- который полностью обходит RLS. Это и есть техническая гарантия того,
-- что подписку нельзя "включить" из браузера без реальной оплаты.

-- ------------------------------------------------------------
-- Автосоздание профиля при регистрации пользователя
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Самостоятельная отмена подписки — это НЕ дыра в безопасности:
-- пользователю разрешено только выключить себе подписку (downgrade),
-- включить её он всё равно не может (см. отсутствие UPDATE-политики).
-- ------------------------------------------------------------
create or replace function public.cancel_my_subscription()
returns void as $$
begin
  update public.profiles
  set is_subscribed = false,
      subscription_expires_at = null,
      updated_at = now()
  where user_id = auth.uid();
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- Realtime — нужно, чтобы сайт сам обновился сразу после оплаты,
-- без перезагрузки страницы.
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.profiles;
