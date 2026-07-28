import React, { useState } from 'react';
import { Track, Playlist } from '../types';
import { TrackCard } from './TrackCard';
import { Download, Play, Shuffle, ArrowUpDown } from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDislike?: (trackId: string) => void;
  onToggleDownload: (track: Track) => Promise<void>;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  title?: string;
  subtitle?: string;
  showHeaders?: boolean;
  showRankingBadge?: boolean;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  playlists,
  onPlayTrack,
  onPlayAll,
  onToggleLike,
  onToggleDislike,
  onToggleDownload,
  onAddToPlaylist,
  title,
  subtitle,
  showHeaders = true,
  showRankingBadge = false,
}) => {
  const [sortBy, setSortBy] = useState<'default' | 'likes' | 'title' | 'artist' | 'genre'>('default');

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortBy === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'genre') return a.genre.localeCompare(b.genre);
    return 0;
  });

  const handleDownloadAll = async () => {
    for (const track of tracks) {
      if (!track.isDownloaded) {
        await onToggleDownload(track);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* List Header Controls */}
      {(title || tracks.length > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
          <div>
            {title && <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>}
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {tracks.length > 0 && (
              <>
                <button
                  onClick={() => onPlayAll(sortedTracks, false)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-md transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Слушать все</span>
                </button>

                <button
                  onClick={() => onPlayAll(sortedTracks, true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-medium rounded-md transition-colors"
                  title="Перемешать"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Микс</span>
                </button>

                <button
                  onClick={handleDownloadAll}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-medium rounded-md transition-colors"
                  title="Скачать все треки списка"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Скачать все</span>
                </button>

                {/* Sort selector */}
                <div className="relative inline-block">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-md px-2.5 py-1.5 appearance-none pr-6 cursor-pointer hover:border-zinc-700 focus:outline-none"
                  >
                    <option value="default">Сортировка: По умолчанию</option>
                    <option value="title">По названию</option>
                    <option value="artist">По исполнителю</option>
                    <option value="genre">По жанру</option>
                  </select>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Track Cards Stack */}
      {sortedTracks.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40">
          <p className="text-zinc-500 text-sm">Треки не найдены</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedTracks.map((track, idx) => (
            <TrackCard
              key={track.id}
              track={track}
              index={idx}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              isCurrent={currentTrack?.id === track.id}
              playlists={playlists}
              onPlay={onPlayTrack}
              onToggleLike={onToggleLike}
              onToggleDislike={onToggleDislike}
              onToggleDownload={onToggleDownload}
              onAddToPlaylist={onAddToPlaylist}
              showRankingBadge={showRankingBadge}
            />
          ))}
        </div>
      )}
    </div>
  );
};
