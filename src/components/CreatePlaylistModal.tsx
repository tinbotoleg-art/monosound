import React, { useState } from 'react';
import { X, Wand2, Plus, Disc } from 'lucide-react';
import { Track } from '../types';
import { generateLocalPlaylist } from '../lib/recommendationEngine';

interface CreatePlaylistModalProps {
  allTracks: Track[];
  onClose: () => void;
  onCreatePlaylist: (playlist: { title: string; description: string; trackIds: string[] }) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  allTracks,
  onClose,
  onCreatePlaylist,
}) => {
  const [tab, setTab] = useState<'manual' | 'smart'>('manual');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [moodPrompt, setMoodPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreatePlaylist({
      title: title.trim(),
      description: description.trim() || 'Пользовательский плейлист',
      trackIds: [],
    });
    onClose();
  };

  const handleSmartGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = generateLocalPlaylist(moodPrompt.trim(), allTracks);
      onCreatePlaylist({
        title: res.title,
        description: res.description,
        trackIds: res.trackIds,
      });
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Disc className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold text-white tracking-tight">Новый плейлист</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-1.5 bg-zinc-900 mx-5 mt-4 rounded-lg flex space-x-1 border border-zinc-800">
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'manual' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Вручную
          </button>
          <button
            onClick={() => setTab('smart')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center space-x-1.5 transition-colors ${
              tab === 'smart' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>По настроению</span>
          </button>
        </div>

        {/* Form Body */}
        {tab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Название плейлиста
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Поздний вечер, Фокус для работы"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Описание (опционально)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание настроения плейлиста..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-zinc-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors shadow-md"
              >
                Создать
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSmartGenerate} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Настроение или ситуация
              </label>
              <textarea
                required
                value={moodPrompt}
                onChange={(e) => setMoodPrompt(e.target.value)}
                placeholder="Например: 'Ночной кодинг', 'Спокойное чтение вечером', 'Тренировка'..."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
              <p className="text-[10px] text-zinc-500 mt-1.5">
                Плейлист собирается по ключевым словам и жанрам каталога — без внешних сервисов.
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-zinc-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors shadow-md flex items-center space-x-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Сборка микса...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Сгенерировать</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
