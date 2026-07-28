import React, { useState } from 'react';
import { Play, Pause, Heart, ThumbsDown, Download, Check, Plus, MoreHorizontal, Disc } from 'lucide-react';
import { Track, Playlist } from '../types';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  isCurrent: boolean;
  playlists: Playlist[];
  onPlay: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDislike?: (trackId: string) => void;
  onToggleDownload: (track: Track) => Promise<void>;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  index?: number;
  showRankingBadge?: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isPlaying,
  isCurrent,
  playlists,
  onPlay,
  onToggleLike,
  onToggleDislike,
  onToggleDownload,
  onAddToPlaylist,
  index,
  showRankingBadge = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await onToggleDownload(track);
    } finally {
      setIsDownloading(false);
    }
  };

  const likesDisplay = track.likesCount !== undefined ? track.likesCount : (track.isLiked ? 1 : 0);

  return (
    <div
      onClick={() => onPlay(track)}
      className={`group relative flex items-center justify-between p-3 rounded-lg transition-all duration-200 border cursor-pointer ${
        isCurrent
          ? 'bg-zinc-900 border-zinc-700 text-white shadow-lg'
          : 'bg-zinc-950/60 hover:bg-zinc-900/80 border-zinc-900 hover:border-zinc-800 text-zinc-300'
      }`}
    >
      {/* Left section: Index or Rank Badge / Cover / Title & Artist */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {showRankingBadge && index !== undefined ? (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
            index === 0 ? 'bg-amber-400 text-black shadow-md' :
            index === 1 ? 'bg-zinc-200 text-black' :
            index === 2 ? 'bg-amber-700 text-white' :
            'bg-zinc-900 border border-zinc-800 text-zinc-400'
          }`}>
            #{index + 1}
          </div>
        ) : index !== undefined ? (
          <span className="w-6 text-xs text-zinc-500 font-mono text-right group-hover:hidden">
            {(index + 1).toString().padStart(2, '0')}
          </span>
        ) : null}

        {/* Cover / Vinyl Thumbnail */}
        <div className="relative w-11 h-11 rounded-md overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800 group-hover:border-zinc-700">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-105 transition-transform duration-300"
          />
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h4
              className={`text-sm font-medium truncate ${
                isCurrent ? 'text-white font-semibold' : 'text-zinc-200 group-hover:text-white'
              }`}
            >
              {track.title}
            </h4>
            {track.isDownloaded && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full shrink-0">
                <Check className="w-2.5 h-2.5 mr-0.5 text-white" />
                Офлайн
              </span>
            )}
            {track.isDisliked && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-red-950 text-red-300 border border-red-800/80 rounded-full shrink-0">
                Дизлайкнут
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {track.artist} <span className="text-zinc-600">·</span> {track.album}
          </p>
        </div>
      </div>

      {/* Center: Genre Badge & Likes count */}
      <div className="hidden md:flex items-center justify-center space-x-3 px-3">
        <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
          {track.genre}
        </span>
        <span className="text-xs font-mono text-zinc-400 flex items-center space-x-1" title="Количество лайков">
          <Heart className="w-3 h-3 text-white fill-white inline" />
          <span>{likesDisplay}</span>
        </span>
      </div>

      {/* Right Controls: Duration, Like, Dislike, Download, Playlist Menu */}
      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
        <span className="text-xs font-mono text-zinc-500 mr-2 hidden sm:inline">
          {formatTime(track.duration)}
        </span>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(track.id);
          }}
          className={`p-1.5 rounded-full hover:bg-zinc-800 transition-colors flex items-center space-x-1 ${
            track.isLiked ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title={track.isLiked ? 'Убрать из избранного' : 'Поставить лайк'}
        >
          <Heart className={`w-4 h-4 ${track.isLiked ? 'fill-white text-white' : ''}`} />
        </button>

        {/* Dislike Button */}
        {onToggleDislike && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDislike(track.id);
            }}
            className={`p-1.5 rounded-full hover:bg-zinc-800 transition-colors ${
              track.isDisliked ? 'text-red-400 bg-red-950/60 border border-red-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={track.isDisliked ? 'Убрать из дизлайков' : 'Скрыть из рекомендаций (дизлайк)'}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        )}

        {/* Offline Download Button */}
        <button
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className={`p-1.5 rounded-full transition-colors ${
            track.isDownloaded
              ? 'text-white bg-zinc-800 border border-zinc-700'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
          }`}
          title={
            track.isDownloaded
              ? 'Сохранено для офлайн-доступа'
              : 'Скачать для офлайн-доступа'
          }
        >
          {isDownloading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : track.isDownloaded ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Playlist Menu Popover */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
            title="Добавить в плейлист"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
            >
              <p className="px-2 py-1 text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                Добавить в плейлист
              </p>
              {playlists.filter(p => !p.isSystem).length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-zinc-400 italic">Нет плейлистов</p>
              ) : (
                playlists
                  .filter(p => !p.isSystem)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onAddToPlaylist(p.id, track.id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded flex items-center justify-between transition-colors"
                    >
                      <span className="truncate">{p.title}</span>
                      <Plus className="w-3 h-3 text-zinc-500" />
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

