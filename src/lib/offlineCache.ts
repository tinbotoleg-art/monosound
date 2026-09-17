import { Track } from '../types';

/**
 * Последний успешно загруженный с сервера каталог треков — используется
 * как запасной вариант, если приложение открыли офлайн (сеть недоступна).
 * Хранит только метаданные (без аудио), поэтому безопасно держать в
 * localStorage — сами аудиофайлы для офлайн-прослушивания лежат отдельно
 * в IndexedDB (см. offlineDb.ts) и сюда не относятся.
 */

const CACHE_KEY = 'monosound_tracks_cache_v1';

export function saveTracksCache(tracks: Track[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tracks));
  } catch (err) {
    console.warn('[offlineCache] Failed to save tracks cache:', err);
  }
}

export function loadTracksCache(): Track[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Track[]) : [];
  } catch (err) {
    console.warn('[offlineCache] Failed to load tracks cache:', err);
    return [];
  }
}
