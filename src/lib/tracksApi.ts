import { supabase } from './supabaseClient';
import { Track } from '../types';

/**
 * Слой работы с треками через Supabase (Postgres + Storage).
 *
 * Видимость строк регулируется исключительно RLS-политиками на сервере
 * (см. supabase/schema.sql):
 *  - гости и обычные пользователи видят только moderation_status='approved'
 *  - автор дополнительно видит свои собственные треки в любом статусе
 *  - админ (tinbotoleg@gmail.com) видит вообще все треки
 *
 * Поэтому один и тот же fetchTracks() отдаёт разный набор строк в
 * зависимости от того, кто сейчас залогинен — ничего дополнительно
 * фильтровать на клиенте не нужно.
 */

interface TrackRow {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  year: number;
  cover_url: string | null;
  audio_url: string | null;
  audio_pattern: Track['audioPattern'] | null;
  play_count: number;
  earnings_count: number;
  likes_count: number;
  uploaded_by: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

function mapRowToTrack(row: TrackRow): Track {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    duration: row.duration,
    genre: row.genre as Track['genre'],
    year: row.year,
    coverUrl: row.cover_url || '',
    audioUrl: row.audio_url || undefined,
    audioPattern: row.audio_pattern || undefined,
    playCount: row.play_count,
    earningsCount: row.earnings_count,
    likesCount: row.likes_count,
    uploadedBy: row.uploaded_by,
    moderationStatus: row.moderation_status,
    rejectionReason: row.rejection_reason || undefined,
  };
}

/** Загружает список треков, видимых текущей сессии (см. RLS выше). */
export async function fetchTracks(): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tracksApi] fetchTracks failed:', error.message);
    return [];
  }
  return (data as TrackRow[]).map(mapRowToTrack);
}

/** Загружает аудиофайл в Storage и возвращает публичный URL. */
export async function uploadAudioFile(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from('track-audio').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('track-audio').getPublicUrl(path);
  return data.publicUrl;
}

/** Загружает обложку в Storage и возвращает публичный URL. */
export async function uploadCoverFile(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from('track-covers').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('track-covers').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Отправляет метаданные трека на модерацию.
 * uploaderEmail ДОЛЖЕН совпадать с email текущей Supabase-сессии —
 * это проверяется политикой INSERT на сервере.
 */
export async function submitTrack(
  track: Omit<Track, 'id' | 'playCount'>,
  uploaderEmail: string
): Promise<Track> {
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      genre: track.genre,
      year: track.year,
      cover_url: track.coverUrl || null,
      audio_url: track.audioUrl || null,
      audio_pattern: track.audioPattern || null,
      uploaded_by: uploaderEmail,
      moderation_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToTrack(data as TrackRow);
}

export async function approveTrackRemote(trackId: string): Promise<void> {
  const { error } = await supabase
    .from('tracks')
    .update({ moderation_status: 'approved', rejection_reason: null })
    .eq('id', trackId);
  if (error) throw error;
}

export async function rejectTrackRemote(trackId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('tracks')
    .update({ moderation_status: 'rejected', rejection_reason: reason })
    .eq('id', trackId);
  if (error) throw error;
}
