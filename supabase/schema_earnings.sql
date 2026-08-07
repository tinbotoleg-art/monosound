-- ============================================================
-- MonoSound — заработок в звёздах: реальный счётчик прослушиваний
-- + заявки на вывод. Выполните в Supabase Dashboard → SQL Editor,
-- ПОСЛЕ schema.sql / schema_subscriptions.sql / schema_likes.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Реальный счётчик прослушиваний.
--    Раньше play_count/earnings менялись только в памяти браузера
--    (App.tsx делал setTracks локально) и никогда не писались в
--    Supabase — поэтому пропадали при каждой перезагрузке/пересборке
--    списка треков. Теперь это явная RPC, как и с лайками.
-- ------------------------------------------------------------
create or replace function public.increment_track_plays(p_track_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tracks
  set play_count = play_count + 1
  where id::text = p_track_id;
end;
$$;

-- Разрешаем и гостям (anon), и залогиненным — прослушивание засчитывается
-- в заработок автора независимо от того, вошёл ли слушатель в аккаунт.
grant execute on function public.increment_track_plays(text) to authenticated, anon;

-- ------------------------------------------------------------
-- 2) Заявки на вывод звёзд.
--    Бот не может сам отправлять звёзды пользователям — это делаете вы
--    вручную со своего кошелька. Заявка — это просто запись "кто, сколько
--    и куда (Telegram username) перевести", которую видно в админке.
-- ------------------------------------------------------------
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  telegram_username text not null,
  amount_stars numeric not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.withdrawal_requests enable row level security;

drop policy if exists "Users read own withdrawal requests" on public.withdrawal_requests;
create policy "Users read own withdrawal requests"
on public.withdrawal_requests for select
using (auth.uid() = user_id);

drop policy if exists "Admin can read all withdrawal requests" on public.withdrawal_requests;
create policy "Admin can read all withdrawal requests"
on public.withdrawal_requests for select
using (auth.jwt() ->> 'email' = 'tinbotoleg@gmail.com');

drop policy if exists "Admin can update withdrawal requests" on public.withdrawal_requests;
create policy "Admin can update withdrawal requests"
on public.withdrawal_requests for update
using (auth.jwt() ->> 'email' = 'tinbotoleg@gmail.com');

-- ВАЖНО: обычные пользователи НЕ могут напрямую делать INSERT в эту
-- таблицу (нет соответствующей политики) — заявка создаётся только через
-- функцию ниже, которая сама всё проверяет (лимит 20 ⭐ и реальный баланс).

-- Ставка за одно прослушивание. Если поменяете здесь — поменяйте и
-- EARNINGS_PER_PLAY_STARS в lib/earningsApi.ts на фронтенде (то же число).
create or replace function public.request_withdrawal(p_amount numeric, p_telegram_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_rate constant numeric := 0.01; -- ⭐ за одно прослушивание
  v_min_withdrawal constant numeric := 20;
  v_total_earned numeric;
  v_already_claimed numeric;
  v_available numeric;
begin
  if p_telegram_username is null or length(trim(p_telegram_username)) = 0 then
    raise exception 'Укажите Telegram username для получения звёзд';
  end if;

  if p_amount < v_min_withdrawal then
    raise exception 'Минимальная сумма для вывода — % ⭐', v_min_withdrawal;
  end if;

  select coalesce(sum(play_count), 0) * v_rate
    into v_total_earned
    from public.tracks
    where uploaded_by = v_email;

  select coalesce(sum(amount_stars), 0)
    into v_already_claimed
    from public.withdrawal_requests
    where user_id = auth.uid() and status in ('pending', 'paid');

  v_available := v_total_earned - v_already_claimed;

  if p_amount > v_available then
    raise exception 'Недостаточно звёзд для вывода. Доступно: % ⭐', round(v_available, 2);
  end if;

  insert into public.withdrawal_requests (user_id, user_email, telegram_username, amount_stars)
  values (auth.uid(), v_email, trim(p_telegram_username), p_amount);
end;
$$;

grant execute on function public.request_withdrawal(numeric, text) to authenticated;

-- Realtime — чтобы в кабинете сумма и статус заявки обновлялись сами,
-- без перезагрузки (например, когда админ отметит "выплачено").
alter publication supabase_realtime add table public.withdrawal_requests;
