import { Track, PreferenceProfile, RecommendationReason } from '../types';

/**
 * MonoSound Recommendation Engine (no AI).
 *
 * Три источника рекомендаций:
 *  1. По жанрам      — на основе favoriteGenres в профиле пользователя
 *  2. По артистам    — на основе favoriteArtists в профиле пользователя
 *  3. По похожим пользователям — сравнение множества лайкнутых треков
 *     с профилями других пользователей (Jaccard-схожесть). Берём только
 *     тех, чья схожесть 70–100%, и рекомендуем то, что нравится им.
 *
 * Профили других пользователей читаются с вашего собственного музыкального
 * сервера (см. VITE_API_BASE_URL). Если сервер недоступен или адрес не
 * задан — просто используются рекомендации по жанрам/артистам.
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export interface RecommendationResult {
  recommendations: RecommendationReason[];
  summaryText: string;
}

export interface RemoteUserProfile {
  userId: string;
  likedTrackIds: string[];
  favoriteGenres?: Record<string, number>;
  favoriteArtists?: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* API contract expected on YOUR music server (implement these two):  */
/*                                                                     */
/*  POST {API_BASE}/profiles/:userId                                  */
/*    body: { likedTrackIds, favoriteGenres, favoriteArtists }        */
/*    -> upserts this user's taste profile                            */
/*                                                                     */
/*  GET  {API_BASE}/profiles                                          */
/*    -> [{ userId, likedTrackIds, favoriteGenres, favoriteArtists }] */
/*       (profiles of all other users)                                */
/* ------------------------------------------------------------------ */

export async function syncUserProfile(userId: string, profile: PreferenceProfile): Promise<void> {
  if (!API_BASE || !userId) return;
  try {
    await fetch(`${API_BASE}/profiles/${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        likedTrackIds: profile.likedTrackIds,
        favoriteGenres: profile.favoriteGenres,
        favoriteArtists: profile.favoriteArtists,
      }),
    });
  } catch (err) {
    console.warn('[recommendationEngine] Profile sync skipped (server unreachable):', err);
  }
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((id) => {
    if (setB.has(id)) intersection += 1;
  });
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : (intersection / union) * 100;
}

async function fetchSimilarUsers(
  userId: string,
  myProfile: PreferenceProfile
): Promise<{ userId: string; similarity: number; likedTrackIds: string[] }[]> {
  if (!API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/profiles`);
    if (!res.ok) return [];
    const allProfiles: RemoteUserProfile[] = await res.json();

    return allProfiles
      .filter((p) => p.userId && p.userId !== userId)
      .map((p) => ({
        userId: p.userId,
        likedTrackIds: p.likedTrackIds || [],
        similarity: jaccardSimilarity(myProfile.likedTrackIds || [], p.likedTrackIds || []),
      }))
      // Точное требование продукта: похожесть 70–100%
      .filter((p) => p.similarity >= 70 && p.similarity <= 100);
  } catch (err) {
    console.warn('[recommendationEngine] Could not fetch similar users:', err);
    return [];
  }
}

function scoreByGenre(track: Track, profile: PreferenceProfile): number {
  const values = Object.values(profile.favoriteGenres || {}).map(Number);
  const max = Math.max(1, ...values);
  const score = (profile.favoriteGenres || {})[track.genre] || 0;
  return Math.round((score / max) * 100);
}

function scoreByArtist(track: Track, profile: PreferenceProfile): number {
  const values = Object.values(profile.favoriteArtists || {}).map(Number);
  const max = Math.max(1, ...values);
  const score = (profile.favoriteArtists || {})[track.artist] || 0;
  return Math.round((score / max) * 100);
}

/**
 * Опциональная фильтрация по "настроению": сопоставляем ключевые слова
 * запроса с жанрами каталога. Никакого ИИ — просто словарь соответствий.
 */
const MOOD_GENRE_MAP: Record<string, string[]> = {
  'фокус': ['Lo-fi / Ambient / Chillout', 'Classical'],
  'концентрац': ['Lo-fi / Ambient / Chillout', 'Classical'],
  'работ': ['Lo-fi / Ambient / Chillout'],
  'учеб': ['Lo-fi / Ambient / Chillout', 'Classical'],
  'вечер': ['Jazz / Blues', 'Lo-fi / Ambient / Chillout'],
  'ноч': ['Phonk / Synthwave / Retro', 'Electronic / EDM'],
  'спорт': ['Electronic / EDM', 'Hip-Hop / Rap'],
  'бег': ['Electronic / EDM', 'Hip-Hop / Rap'],
  'трениров': ['Electronic / EDM', 'Hip-Hop / Rap', 'Metal / Punk'],
  'спокой': ['Lo-fi / Ambient / Chillout', 'Classical'],
  'чтени': ['Classical', 'Lo-fi / Ambient / Chillout'],
  'вечеринк': ['Pop', 'Electronic / EDM', 'Latin / Afrobeats'],
  'танц': ['Pop', 'Electronic / EDM', 'Latin / Afrobeats', 'K-Pop / J-Pop'],
  'груст': ['Jazz / Blues', 'R&B / Soul / Funk'],
  'дожд': ['Lo-fi / Ambient / Chillout'],
  'рэп': ['Hip-Hop / Rap'],
  'хип-хоп': ['Hip-Hop / Rap'],
  'рок': ['Rock / Alternative / Indie', 'Metal / Punk'],
  'метал': ['Metal / Punk'],
  'кантри': ['Country / Folk'],
  'регги': ['Reggae / Ska'],
  'классик': ['Classical'],
  'дорог': ['Country / Folk', 'Rock / Alternative / Indie'],
};

function genresForMood(mood?: string): Set<string> {
  const result = new Set<string>();
  if (!mood) return result;
  const lower = mood.trim().toLowerCase();
  Object.entries(MOOD_GENRE_MAP).forEach(([keyword, genres]) => {
    if (lower.includes(keyword)) genres.forEach((g) => result.add(g));
  });
  return result;
}

export async function getRecommendations(
  userId: string,
  profile: PreferenceProfile,
  allTracks: Track[],
  mood?: string
): Promise<RecommendationResult> {
  const moodGenres = genresForMood(mood);

  let candidates = allTracks.filter(
    (t) => !profile.likedTrackIds.includes(t.id) && !(profile.dislikedTrackIds || []).includes(t.id)
  );

  if (moodGenres.size > 0) {
    const filtered = candidates.filter((t) => moodGenres.has(t.genre));
    if (filtered.length > 0) candidates = filtered;
  }

  const similarUsers = await fetchSimilarUsers(userId, profile);

  const similarUserVotes: Record<string, { count: number; totalSimilarity: number }> = {};
  similarUsers.forEach((u) => {
    u.likedTrackIds.forEach((trackId) => {
      if (!similarUserVotes[trackId]) similarUserVotes[trackId] = { count: 0, totalSimilarity: 0 };
      similarUserVotes[trackId].count += 1;
      similarUserVotes[trackId].totalSimilarity += u.similarity;
    });
  });

  const recommendations: RecommendationReason[] = candidates.map((track) => {
    const genreScore = scoreByGenre(track, profile);
    const artistScore = scoreByArtist(track, profile);
    const vote = similarUserVotes[track.id];
    const similarScore = vote ? Math.round(vote.totalSimilarity / vote.count) : 0;

    let category: RecommendationReason['category'] = 'discovery';
    let reason = 'Подходит для знакомства с новым материалом в каталоге.';
    let matchScore = 35;

    if (similarScore > 0 && similarScore >= Math.max(genreScore, artistScore)) {
      category = 'similar_user';
      matchScore = Math.min(100, similarScore);
      reason = `Трек нравится ${vote!.count} пользователю(ям) со схожим вкусом (совпадение ~${Math.round(similarScore)}%).`;
    } else if (artistScore > 0 && artistScore >= genreScore) {
      category = 'artist_affinity';
      matchScore = artistScore;
      reason = `Вы часто слушаете артиста ${track.artist}.`;
    } else if (genreScore > 0) {
      category = 'genre_match';
      matchScore = genreScore;
      reason = `Соответствует вашему любимому жанру — ${track.genre}.`;
    } else if (track.isLiked || profile.likedTrackIds.includes(track.id)) {
      category = 'like_based';
      matchScore = 60;
      reason = 'Похоже на треки из вашей коллекции избранного.';
    }

    return {
      trackId: track.id,
      reason,
      score: matchScore,
      matchScore,
      category,
    };
  });

  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  const top = recommendations.slice(0, 8);

  const summaryText =
    similarUsers.length > 0
      ? `Найдено ${similarUsers.length} пользовател${similarUsers.length === 1 ? 'ь' : 'ей'} со схожим вкусом (70–100% совпадения по трекам). Микс собран из жанров, артистов и вкусов похожих слушателей.`
      : 'Микс собран на основе ваших любимых жанров и артистов.';

  return { recommendations: top, summaryText };
}

/**
 * Локальная генерация плейлиста по текстовому описанию настроения.
 * Замена AI-эндпоинту /api/ai-playlist — работает полностью на клиенте.
 */
export function generateLocalPlaylist(
  prompt: string,
  allTracks: Track[]
): { title: string; description: string; trackIds: string[] } {
  const moodGenres = genresForMood(prompt);

  let matched =
    moodGenres.size > 0
      ? allTracks.filter((t) => moodGenres.has(t.genre))
      : [...allTracks].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));

  if (matched.length < 4) {
    const rest = allTracks.filter((t) => !matched.includes(t));
    matched = [...matched, ...rest];
  }

  const trackIds = matched.slice(0, 6).map((t) => t.id);

  return {
    title: prompt.trim() ? `Микс: ${prompt.trim()}` : 'Персональная подборка',
    description:
      moodGenres.size > 0
        ? `Подборка в жанрах: ${[...moodGenres].join(', ')}`
        : 'Подборка из самых популярных треков каталога',
    trackIds,
  };
}
