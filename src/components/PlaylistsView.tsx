import React from 'react';
import { Plus, ListMusic, Download, Trash2, Play, Disc, Music2 } from 'lucide-react';
import { Playlist, Track } from '../types';
import { TrackList } from './TrackList';

interface PlaylistsViewProps {
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string) => void;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => Promise<void>;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, trackId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onCreatePlaylistClick: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  allTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayAll,
  onToggleLike,
  onToggleDownload,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeletePlaylist,
  onCreatePlaylistClick,
}) => {
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  if (selectedPlaylist) {
    const playlistTracks = allTracks.filter(t => selectedPlaylist.trackIds.includes(t.id));

    return (
      <div className="space-y-6">
        {/* Playlist Banner Header */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <ListMusic className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Плейлист</span>
              <h2 className="text-2xl font-bold text-white tracking-tight">{selectedPlaylist.title}</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg">{selectedPlaylist.description}</p>
              <p className="text-[11px] font-mono text-zinc-500 mt-2">
                {playlistTracks.length} треков · {Math.round(playlistTracks.reduce((acc, t) => acc + t.duration, 0) / 60)} мин.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onSelectPlaylist('')}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
            >
              Назад к списку
            </button>

            {!selectedPlaylist.isSystem && (
              <button
                onClick={() => {
                  onDeletePlaylist(selectedPlaylist.id);
                  onSelectPlaylist('');
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
                title="Удалить плейлист"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Playlist Tracks List */}
        <TrackList
          tracks={playlistTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          playlists={playlists}
          onPlayTrack={onPlayTrack}
          onPlayAll={onPlayAll}
          onToggleLike={onToggleLike}
          onToggleDownload={onToggleDownload}
          onAddToPlaylist={onAddToPlaylist}
          title="Треки в плейлисте"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Playlists Hub Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ваши Плейлисты</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Коллекции и музыкальные подборки</p>
        </div>
        <button
          onClick={onCreatePlaylistClick}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Создать плейлист</span>
        </button>
      </div>

      {/* Grid of Playlists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((p) => {
          const count = p.trackIds.length;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPlaylist(p.id)}
              className="group p-5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-colors">
                  <Music2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-mono px-2 py-1 bg-zinc-900 text-zinc-400 rounded-full border border-zinc-800">
                  {count} треков
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-white transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                  {p.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500 font-mono">
                <span>{p.isSystem ? 'Системный' : 'Пользовательский'}</span>
                <span className="group-hover:text-white transition-colors">Открыть →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
