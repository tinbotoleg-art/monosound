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
  const { error: insertError } = await supabase
    .from('track_likes')
    .insert({ user_id: userId, track_id: trackId });

  // 23505 = unique_violation — трек уже лайкнут (например, двойной клик),
  // не считаем ошибкой и всё равно досчитываем счётчик ниже.
  if (insertError && insertError.code !== '23505') {
    console.error('[likesApi] insert into track_likes failed:', insertError.message);
    throw insertError;
  }

  const { error: rpcError } = await supabase.rpc('increment_track_likes', {
    p_track_id: trackId,
    p_delta: 1,
  });
  if (rpcError) {
    console.error('[likesApi] increment_track_likes(+1) failed:', rpcError.message);
    throw rpcError;
  }
}

export async function unlikeTrackRemote(userId: string, trackId: string): Promise<void> {
  const { error: deleteError } = await supabase
    .from('track_likes')
    .delete()
    .eq('user_id', userId)
    .eq('track_id', trackId);

  if (deleteError) {
    console.error('[likesApi] delete from track_likes failed:', deleteError.message);
    throw deleteError;
  }

  const { error: rpcError } = await supabase.rpc('increment_track_likes', {
    p_track_id: trackId,
    p_delta: -1,
  });
  if (rpcError) {
    console.error('[likesApi] increment_track_likes(-1) failed:', rpcError.message);
    throw rpcError;
  }
}
