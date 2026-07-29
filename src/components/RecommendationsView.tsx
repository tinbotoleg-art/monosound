import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Disc, Heart, BarChart3, Radio, Play, Users } from 'lucide-react';
import { Track, PreferenceProfile, RecommendationReason, Playlist } from '../types';
import { getRecommendations } from '../lib/recommendationEngine';
import { TrackCard } from './TrackCard';

interface RecommendationsViewProps {
  userId: string;
  allTracks: Track[];
  preferenceProfile: PreferenceProfile;
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => Promise<void>;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
}

const CATEGORY_LABELS: Record<RecommendationReason['category'], string> = {
  like_based: 'Избранное',
  genre_match: 'Жанр',
  artist_affinity: 'Артист',
  similar_user: 'Похожие слушатели',
  discovery: 'Открытие',
};

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  userId,
  allTracks,
  preferenceProfile,
  currentTrack,
  isPlaying,
  playlists,
  onPlayTrack,
  onPlayAll,
  onToggleLike,
  onToggleDownload,
  onAddToPlaylist,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationReason[]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [moodInput, setMoodInput] = useState('');

  const loadRecommendations = async (mood?: string) => {
    setIsLoading(true);
    try {
      const res = await getRecommendations(userId, preferenceProfile, allTracks, mood);
      setRecommendations(res.recommendations);
      setSummaryText(res.summaryText);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recommendedTracks = recommendations
    .map(r => ({
      track: allTracks.find(t => t.id === r.trackId),
      reasonInfo: r
    }))
    .filter((item): item is { track: Track; reasonInfo: RecommendationReason } => item.track !== undefined);

  const topGenres = Object.entries(preferenceProfile.favoriteGenres || {})
    .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-mono uppercase text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
            <span>Рекомендательная система</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Персональные рекомендации
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Подборка строится по трём правилам: любимые жанры, любимые артисты и вкусы пользователей, которые слушают похожую музыку (совпадение 70–100% по трекам).
          </p>

          {/* User Profile Mini Stats */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Топовый Жанр</span>
              <p className="text-sm font-bold text-white mt-0.5">{topGenres[0]?.[0] || 'Lo-fi / Ambient / Chillout'}</p>
            </div>
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Любимых треков</span>
              <p className="text-sm font-bold text-white mt-0.5">{preferenceProfile.likedTrackIds.length}</p>
            </div>
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500">История сессий</span>
              <p className="text-sm font-bold text-white mt-0.5">{preferenceProfile.history.length} прослушиваний</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Filter Box (keyword-based, no external calls) */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
        <label className="block text-xs font-mono uppercase text-zinc-400">
          Уточнить подборку по настроению (по жанрам)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={moodInput}
            onChange={(e) => setMoodInput(e.target.value)}
            placeholder="Например: Спокойное вечернее чтение, Концентрация на кодинге..."
            className="flex-1 bg-zinc-950 border border-zinc-800 text-white text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-zinc-600"
          />
          <button
            onClick={() => loadRecommendations(moodInput)}
            disabled={isLoading}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Сформировать микс</span>
          </button>
        </div>
      </div>

      {/* Summary Insights */}
      {summaryText && (
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-start space-x-3">
          <Users className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-300 italic">{summaryText}</p>
        </div>
      )}

      {/* Recommended Track List with Reason Badges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white tracking-tight">Рекомендованные треки</h3>
          {recommendedTracks.length > 0 && (
            <button
              onClick={() => onPlayAll(recommendedTracks.map(r => r.track), false)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Включить микс</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {recommendedTracks.map(({ track, reasonInfo }) => (
            <div key={track.id} className="space-y-1">
              <div className="flex items-center space-x-2 px-2 text-[10px] font-mono text-zinc-400">
                <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-semibold">
                  {reasonInfo.matchScore}% · {CATEGORY_LABELS[reasonInfo.category]}
                </span>
                <span>— {reasonInfo.reason}</span>
              </div>
              <TrackCard
                track={track}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                isCurrent={currentTrack?.id === track.id}
                playlists={playlists}
                onPlay={onPlayTrack}
                onToggleLike={onToggleLike}
                onToggleDownload={onToggleDownload}
                onAddToPlaylist={onAddToPlaylist}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
