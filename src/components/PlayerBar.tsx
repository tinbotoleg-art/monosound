import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Heart, 
  ThumbsDown,
  Check, 
  ListOrdered,
  Disc
} from 'lucide-react';
import { Track } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleDislike?: (trackId: string) => void;
  onToggleQueue: () => void;
  isQueueOpen: boolean;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleDislike,
  onToggleQueue,
  isQueueOpen,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <footer className="relative h-20 bg-black border-t border-zinc-800/80 px-3 sm:px-6 flex items-center z-30 shrink-0 select-none">
      {/* Тонкий бегунок прогресса поверх бара — только на мобильных,
          на десктопе полноразмерный слайдер ниже в центральной колонке */}
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        disabled={!currentTrack}
        className="sm:hidden absolute top-0 left-0 right-0 w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-white m-0"
      />

      {/* ===== Мобильная компактная раскладка (< sm) ===== */}
      <div className="flex sm:hidden items-center justify-between w-full gap-2">
        <div
          onClick={onToggleQueue}
          className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer"
        >
          {currentTrack ? (
            <>
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover filter grayscale contrast-125"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
                <p className="text-[10px] text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
            </>
          ) : (
            <div className="text-[11px] text-zinc-500 font-mono truncate">Выберите трек</div>
          )}
        </div>

        <div className="flex items-center space-x-0.5 shrink-0">
          {currentTrack && (
            <button
              onClick={() => onToggleLike(currentTrack.id)}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <Heart className={`w-4 h-4 ${currentTrack.isLiked ? 'fill-white text-white' : ''}`} />
            </button>
          )}

          <button
            onClick={onPrev}
            disabled={!currentTrack}
            className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPause}
            disabled={!currentTrack}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 disabled:opacity-30 transition-transform shadow-md shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!currentTrack}
            className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleQueue}
            className={`p-1.5 rounded-lg transition-colors ${
              isQueueOpen ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===== Десктопная раскладка (sm и выше) — без изменений ===== */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {/* Left: Track Info */}
        <div className="flex items-center space-x-4 w-1/4 min-w-[200px]">
          {currentTrack ? (
            <>
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 group">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover filter grayscale contrast-125 ${
                    isPlaying ? 'animate-pulse' : ''
                  }`}
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Disc className="w-6 h-6 text-white animate-spin-slow" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-xs font-bold text-white truncate">
                    {currentTrack.title}
                  </h4>
                  {currentTrack.isDownloaded && (
                    <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" title="Сохранено для офлайн-доступа" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onToggleLike(currentTrack.id)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  title={currentTrack.isLiked ? 'Убрать из избранного' : 'Поставить лайк'}
                >
                  <Heart className={`w-4 h-4 ${currentTrack.isLiked ? 'fill-white text-white' : ''}`} />
                </button>

                {onToggleDislike && (
                  <button
                    onClick={() => onToggleDislike(currentTrack.id)}
                    className={`p-1.5 transition-colors ${
                      currentTrack.isDisliked ? 'text-red-400' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={currentTrack.isDisliked ? 'Убрать из дизлайков' : 'Скрыть из рекомендаций (дизлайк)'}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-xs text-zinc-500 font-mono">
              Выберите трек для прослушивания
            </div>
          )}
        </div>

        {/* Center: Controls & Seek Bar */}
        <div className="flex flex-col items-center max-w-xl w-2/4 px-4 space-y-1.5">
          <div className="flex items-center space-x-4">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded transition-colors ${
                isShuffle ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Перемешать"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={onPrev}
              disabled={!currentTrack}
              className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
              title="Предыдущий трек"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              onClick={onPlayPause}
              disabled={!currentTrack}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 transition-transform shadow-md"
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              disabled={!currentTrack}
              className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
              title="Следующий трек"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={onToggleRepeat}
              className={`p-1.5 rounded transition-colors ${
                repeatMode !== 'off' ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Повтор: ${repeatMode === 'one' ? 'Один трек' : repeatMode === 'all' ? 'Все треки' : 'Выкл'}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center space-x-2.5">
            <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              disabled={!currentTrack}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white hover:bg-zinc-700 transition-all"
            />
            <span className="text-[10px] font-mono text-zinc-500 w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Audio Visualizer & Volume & Queue */}
        <div className="flex items-center justify-end space-x-4 w-1/4 min-w-[200px]">
          {/* Real-time Spectrum Visualizer */}
          <div className="hidden lg:block">
            <AudioVisualizer isPlaying={isPlaying} compact />
          </div>

          {/* Volume Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleMute}
              className="text-zinc-400 hover:text-white transition-colors"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white hover:bg-zinc-700 transition-all"
            />
          </div>

          {/* Queue Drawer Toggle */}
          <button
            onClick={onToggleQueue}
            className={`p-2 rounded-lg transition-colors ${
              isQueueOpen
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title="Очередь воспроизведения"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
