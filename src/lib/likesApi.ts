import { supabase } from './supabaseClient';

/** Возвращает id всех треков, которые лайкнул этот пользователь. */
export async function fetchMyLikedTrackIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('track_likes')
    .select('track_id')
    .eq('user_id', userId);

  if (error) {
    console.warn('[likesApi] fetchMyLikedTrackIds failed:', error.message);
    return [];
  }
  return (data ?? []).map((row) => row.track_id as string);
}

export async function likeTrackRemote(userId: string, trackId: string): Promise<void> {
  const { error } = await supabase.from('track_likes').insert({ user_id: userId, track_id: trackId });
  // 23505 = unique_violation — трек уже лайкнут (например, двойной клик), не считаем ошибкой
  if (error && error.code !== '23505') {
    console.warn('[likesApi] likeTrackRemote failed:', error.message);
  }
}

export async function unlikeTrackRemote(userId: string, trackId: string): Promise<void> {
  const { error } = await supabase.from('track_likes').delete().eq('user_id', userId).eq('track_id', trackId);
  if (error) {
    console.warn('[likesApi] unlikeTrackRemote failed:', error.message);
  }
}
