import React, { useState } from 'react';
import { Search, Filter, Disc, Check } from 'lucide-react';
import { Track, Playlist, Genre } from '../types';
import { TrackList } from './TrackList';

interface SearchViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: Playlist[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDislike?: (trackId: string) => void;
  onToggleDownload: (track: Track) => Promise<void>;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
}

const GENRES: Genre[] = [
  'Pop',
  'K-Pop / J-Pop',
  'Hip-Hop / Rap',
  'R&B / Soul / Funk',
  'Rock / Alternative / Indie',
  'Metal / Punk',
  'Jazz / Blues',
  'Electronic / EDM',
  'Lo-fi / Ambient / Chillout',
  'Country / Folk',
  'Reggae / Ska',
  'Latin / Afrobeats',
  'Classical',
  'Phonk / Synthwave / Retro'
];

export const SearchView: React.FC<SearchViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  playlists,
  searchQuery,
  setSearchQuery,
  onPlayTrack,
  onPlayAll,
  onToggleLike,
  onToggleDislike,
  onToggleDownload,
  onAddToPlaylist,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'all'>('all');
  const [downloadedOnly, setDownloadedOnly] = useState(false);

  const filteredTracks = tracks.filter((track) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album.toLowerCase().includes(query);

    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
    const matchesDownloaded = !downloadedOnly || track.isDownloaded;

    return matchesQuery && matchesGenre && matchesDownloaded;
  });

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-mono uppercase text-zinc-400">
            <Search className="w-3 h-3 text-white" />
            <span>Интеллектуальный Поиск</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Поиск по трекам и артистам
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Введите имя исполнителя или название песни. Быстро фильтруйте по жанрам и офлайн-доступности.
          </p>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите название трека или артиста (напр. Noir Soundscape, Midnight...)..."
              className="w-full bg-zinc-900/90 border border-zinc-700 text-white text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-zinc-400 hover:text-white"
              >
                Очистить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Genre Filter Badges & Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase text-zinc-500 font-semibold tracking-wider">
            Фильтр по жанрам
          </p>
          <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={downloadedOnly}
              onChange={(e) => setDownloadedOnly(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 accent-white"
            />
            <span>Только офлайн треки</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              selectedGenre === 'all'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`}
          >
            Все жанры
          </button>
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedGenre === genre
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <TrackList
        tracks={filteredTracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        playlists={playlists}
        onPlayTrack={onPlayTrack}
        onPlayAll={onPlayAll}
        onToggleLike={onToggleLike}
        onToggleDislike={onToggleDislike}
        onToggleDownload={onToggleDownload}
        onAddToPlaylist={onAddToPlaylist}
        title={searchQuery ? `Результаты поиска (${filteredTracks.length})` : `Все треки (${filteredTracks.length})`}
        subtitle={
          searchQuery
            ? `По запросу «${searchQuery}»`
            : selectedGenre !== 'all'
            ? `Отфильтровано по жанру: ${selectedGenre}`
            : 'Каталог аудио'
        }
      />
    </div>
  );
};
