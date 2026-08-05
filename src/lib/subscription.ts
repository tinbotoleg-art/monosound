import { supabase } from './supabaseClient';

const BOT_USERNAME = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || '';

export const SUBSCRIPTION_STARS_PRICE = 50;

export interface ProfileRow {
  user_id: string;
  is_subscribed: boolean;
  subscription_expires_at: string | null;
}

/**
 * Диплинк, открывающий чат с ботом и сразу передающий ему, для какого
 * пользователя сайта нужно выставить счёт (см. supabase/functions/telegram-webhook).
 */
export function getSubscribeDeepLink(userId: string): string {
  if (!BOT_USERNAME) {
    console.warn('[subscription] VITE_TELEGRAM_BOT_USERNAME не задан в .env');
  }
  return `https://t.me/${BOT_USERNAME}?start=sub_${userId}`;
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, is_subscribed, subscription_expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[subscription] fetchProfile failed:', error.message);
    return null;
  }
  return data;
}

/**
 * Слушает изменения строки профиля текущего пользователя в реальном
 * времени — как только вебхук после оплаты обновит is_subscribed,
 * сайт узнает об этом без перезагрузки страницы.
 */
export function subscribeToProfileChanges(
  userId: string,
  onChange: (profile: ProfileRow) => void
): () => void {
  const channel = supabase
    .channel(`profile-changes-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` },
      (payload) => onChange(payload.new as ProfileRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Самостоятельная отмена подписки — разрешена (в отличие от активации). */
export async function cancelMySubscription(): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_subscription');
  if (error) throw error;
}
