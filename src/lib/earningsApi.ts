import { supabase } from './supabaseClient';

// Держите в синхроне с v_rate в supabase/schema_earnings.sql —
// это одно и то же число, просто в двух местах (SQL проверяет баланс
// при выводе, фронтенд — просто отображает его пользователю).
export const EARNINGS_PER_PLAY_STARS = 0.01;
export const MIN_WITHDRAWAL_STARS = 20;

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_email: string;
  telegram_username: string;
  amount_stars: number;
  status: 'pending' | 'paid' | 'rejected';
  created_at: string;
  processed_at: string | null;
}

/** Засчитывает прослушивание в заработок автора (реально пишет в БД). */
export async function incrementTrackPlays(trackId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_track_plays', { p_track_id: trackId });
  if (error) {
    console.warn('[earningsApi] increment_track_plays failed:', error.message);
  }
}

export async function fetchMyWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[earningsApi] fetchMyWithdrawalRequests failed:', error.message);
    return [];
  }
  return (data ?? []) as WithdrawalRequest[];
}

/** Создаёт заявку на вывод. Сервер сам проверяет лимит (20 ⭐) и реальный баланс. */
export async function requestWithdrawal(amountStars: number, telegramUsername: string): Promise<void> {
  const { error } = await supabase.rpc('request_withdrawal', {
    p_amount: amountStars,
    p_telegram_username: telegramUsername,
  });
  if (error) throw error;
}

/** Для админки: все заявки на вывод (видно только tinbotoleg@gmail.com — ограничено RLS). */
export async function fetchAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[earningsApi] fetchAllWithdrawalRequests failed:', error.message);
    return [];
  }
  return (data ?? []) as WithdrawalRequest[];
}

export async function markWithdrawalPaid(id: string): Promise<void> {
  const { error } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'paid', processed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markWithdrawalRejected(id: string): Promise<void> {
  const { error } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'rejected', processed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Живое обновление статуса заявки (например, когда админ отметит "выплачено"). */
export function subscribeToMyWithdrawals(
  userId: string,
  onChange: (request: WithdrawalRequest) => void
): () => void {
  const channel = supabase
    .channel(`withdrawals-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'withdrawal_requests', filter: `user_id=eq.${userId}` },
      (payload) => onChange(payload.new as WithdrawalRequest)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
