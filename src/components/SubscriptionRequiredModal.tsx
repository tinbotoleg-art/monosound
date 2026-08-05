import React from 'react';
import { X, HardDriveDownload, Sparkles, Check } from 'lucide-react';
import { SUBSCRIPTION_STARS_PRICE } from '../lib/subscription';

interface SubscriptionRequiredModalProps {
  onClose: () => void;
  onSubscribeClick: () => void;
}

export const SubscriptionRequiredModal: React.FC<SubscriptionRequiredModalProps> = ({
  onClose,
  onSubscribeClick,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <HardDriveDownload className="w-6 h-6 text-white" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Офлайн-режим доступен по подписке
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Скачивание треков для прослушивания без интернета — часть
            MonoSound Премиум. Оформите подписку, чтобы сохранять
            любимую музыку офлайн.
          </p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-sm font-bold text-white">MonoSound Премиум</span>
            <span className="text-sm font-bold text-white">{SUBSCRIPTION_STARS_PRICE} ⭐ / мес</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li className="flex items-center space-x-2">
              <Check className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Скачивание треков для офлайн-доступа</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Безлимитное прослушивание без дневных лимитов</span>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <button
            onClick={onSubscribeClick}
            className="w-full py-3 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors shadow-md flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Оформить подписку</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
          >
            Может быть позже
          </button>
        </div>
      </div>
    </div>
  );
};
