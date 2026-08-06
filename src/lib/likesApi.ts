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
  console.log('[likesApi] saving like', {
    userId,
    trackId
  });

  const { error } = await supabase
    .from('track_likes')
    .insert({
      user_id: userId,
      track_id: trackId
    });

  // 23505 = лайк уже существует, это не критичная ошибка
  if (error && error.code !== '23505') {
    console.error('[likesApi] likeTrackRemote failed:', error);
    throw error;
  }
}


export async function unlikeTrackRemote(userId: string, trackId: string): Promise<void> {
  console.log('[likesApi] removing like', {
    userId,
    trackId
  });

  const { error } = await supabase
    .from('track_likes')
    .delete()
    .eq('user_id', userId)
    .eq('track_id', trackId);

  if (error) {
    console.error('[likesApi] unlikeTrackRemote failed:', error);
    throw error;
  }
}
