import { Track, PreferenceProfile, RecommendationReason } from '../types';

export interface RecommendationResponse {
  recommendations: RecommendationReason[];
  summaryText: string;
  source: string;
}

export async function fetchAiRecommendations(
  profile: PreferenceProfile,
  allTracks: Track[],
  currentMood?: string
): Promise<RecommendationResponse> {
  try {
    const likedTracks = allTracks.filter(t => t.isLiked || profile.likedTrackIds.includes(t.id));
    const historyTrackIds = profile.history.slice(-10).map(h => h.trackId);
    const historyTracks = allTracks.filter(t => historyTrackIds.includes(t.id));

    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        likedTracks,
        favoriteGenres: profile.favoriteGenres,
        historyTracks,
        allTracks,
        currentMood
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('Falling back to local recommendation logic:', err);
    return {
      recommendations: generateFallback(allTracks, profile),
      summaryText: 'Рекомендации сформированы автоматически на основе вашей истории прослушиваний.',
      source: 'local_fallback'
    };
  }
}

export async function generateAiPlaylist(
  prompt: string,
  allTracks: Track[]
): Promise<{ title: string; description: string; trackIds: string[] }> {
  try {
    const response = await fetch('/api/ai-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, allTracks })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('AI Playlist fallback:', err);
    return {
      title: `Микс: ${prompt}`,
      description: `Персональный плейлист по запросу «${prompt}»`,
      trackIds: allTracks.slice(0, 4).map(t => t.id)
    };
  }
}

function generateFallback(allTracks: Track[], profile: PreferenceProfile): RecommendationReason[] {
  const topGenre = Object.entries(profile.favoriteGenres || {}).sort((a, b) => b[1] - a[1])[0]?.[0];

  return allTracks.map(track => {
    let score = 60;
    let reason = 'Подходит для знакомства с новым материалом.';
    let category: RecommendationReason['category'] = 'discovery';

    if (topGenre && track.genre === topGenre) {
      score += 30;
      reason = `Вы часто слушаете ${topGenre}. Этот трек соответствует вашей волне.`;
      category = 'genre_match';
    } else if (track.isLiked || profile.likedTrackIds.includes(track.id)) {
      score += 25;
      reason = 'Основано на вашей коллекции любимых треков.';
      category = 'like_based';
    }

    return {
      trackId: track.id,
      reason,
      score: Math.min(98, score),
      matchScore: Math.min(98, score),
      category
    };
  }).slice(0, 5);
}
