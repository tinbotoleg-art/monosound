import React from 'react';
import { X, Play, Trash2, ListOrdered, Disc } from 'lucide-react';
import { Track } from '../types';

interface QueueDrawerProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onClose,
}) => {
  return (
    <div className="fixed right-0 top-16 bottom-20 w-full sm:w-80 bg-black/95 border-l border-zinc-800 backdrop-blur-xl z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListOrdered className="w-4 h-4 text-white" />
          <h3 className="text-sm font-bold text-white tracking-tight">Очередь треков</h3>
          <span className="text-xs text-zinc-500 font-mono">({queue.length})</span>
        </div>
        <div className="flex items-center space-x-2">
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-xs text-zinc-500 hover:text-white flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-900 transition-colors"
              title="Очистить очередь"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Track List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {currentTrack && (
          <div className="mb-4">
            <p className="px-2 py-1 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              Сейчас играет
            </p>
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center space-x-3">
              <div className="relative w-9 h-9 rounded bg-zinc-800 overflow-hidden shrink-0">
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover filter grayscale" />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Disc className="w-4 h-4 text-white animate-spin-slow" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        <p className="px-2 py-1 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
          Далее в очереди
        </p>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 italic">
            Очередь воспроизведения пуста
          </div>
        ) : (
          queue.map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              className="group p-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 flex items-center justify-between transition-colors"
            >
              <div 
                onClick={() => onPlayTrack(track)}
                className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer"
              >
                <span className="text-[10px] font-mono text-zinc-600 w-4 text-center">
                  {idx + 1}
                </span>
                <img src={track.coverUrl} alt={track.title} className="w-8 h-8 rounded object-cover filter grayscale shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">{track.title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
                </div>
              </div>

              <button
                onClick={() => onRemoveFromQueue(idx)}
                className="p-1 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить из очереди"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
