import React from 'react';
import { HardDriveDownload, WifiOff, Check, Trash2, Download, Disc, Play } from 'lucide-react';
import { Track, Playlist } from '../types';
import { TrackList } from './TrackList';

interface OfflineViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  playlists: Playlist[];
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => Promise<void>;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onClearOfflineCache: () => Promise<void>;
}

export const OfflineView: React.FC<OfflineViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  playlists,
  isOfflineMode,
  onToggleOfflineMode,
  onPlayTrack,
  onPlayAll,
  onToggleLike,
  onToggleDownload,
  onAddToPlaylist,
  onClearOfflineCache,
}) => {
  const downloadedTracks = tracks.filter(t => t.isDownloaded);

  // Approximate cache size (each audio pattern WAV is ~2.5MB)
  const totalMB = (downloadedTracks.length * 2.5).toFixed(1);

  const handleDownloadAllCatalog = async () => {
    for (const track of tracks) {
      if (!track.isDownloaded) {
        await onToggleDownload(track);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-mono uppercase text-zinc-300">
            <HardDriveDownload className="w-3.5 h-3.5 text-white" />
            <span>Офлайн Центр Управления</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Скачанные треки и локальный кэш
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Все скачанные треки автоматически сохраняются в локальное хранилище IndexedDB вашего браузера. Они доступны для полного воспроизведения даже без сетевого соединения.
          </p>

          {/* Controls bar inside banner */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg flex items-center space-x-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500">Занятое место</span>
                <p className="text-sm font-bold text-white mt-0.5">{totalMB} МБ ({downloadedTracks.length} треков)</p>
              </div>
            </div>

            <button
              onClick={onToggleOfflineMode}
              className={`px-4 py-3 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all border ${
                isOfflineMode
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              <WifiOff className="w-4 h-4" />
              <span>{isOfflineMode ? 'Офлайн режим включен' : 'Включить автономию (Офлайн)'}</span>
            </button>

            {downloadedTracks.length < tracks.length && (
              <button
                onClick={handleDownloadAllCatalog}
                className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Скачать весь каталог</span>
              </button>
            )}

            {downloadedTracks.length > 0 && (
              <button
                onClick={onClearOfflineCache}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition-colors"
                title="Очистить офлайн кэш"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Downloaded Track List */}
      <TrackList
        tracks={downloadedTracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        playlists={playlists}
        onPlayTrack={onPlayTrack}
        onPlayAll={onPlayAll}
        onToggleLike={onToggleLike}
        onToggleDownload={onToggleDownload}
        onAddToPlaylist={onAddToPlaylist}
        title={`Скачано для офлайн-доступа (${downloadedTracks.length})`}
        subtitle="Эти треки сохранены локально и воспроизводятся при любых условиях."
      />
    </div>
  );
};
