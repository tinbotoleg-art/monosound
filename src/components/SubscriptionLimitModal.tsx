import React from 'react';
import { Lock, Sparkles, Check, X, ShieldAlert } from 'lucide-react';

interface SubscriptionLimitModalProps {
  onClose: () => void;
  onActivateSubscription: () => void;
}

export const SubscriptionLimitModal: React.FC<SubscriptionLimitModalProps> = ({
  onClose,
  onActivateSubscription,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-mono text-zinc-300 uppercase">
            <span>Лимит прослушиваний</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Достигнут дневной лимит (10/10 треков)
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            В бесплатной версии доступно не более 10 прослушиваний в день. Оформите подписку, чтобы слушать музыку без ограничений и поддерживать любимых авторов.
          </p>
        </div>

        {/* Subscription perk list */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-sm font-bold text-white">MonoSound Премиум</span>
            <span className="text-sm font-bold text-white">59 ₽ / мес</span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li className="flex items-center space-x-2">
              <Check className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Безлимитное прослушивание всех треков</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Скачивание для оффлайн-доступа</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Прямая поддержка артистов и независимых авторов</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Отмена подписки в любой момент в 1 клик</span>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onActivateSubscription();
              onClose();
            }}
            className="w-full py-3 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors shadow-md flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Подключить за 59 ₽ / месяц</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
          >
            Вернуться позже
          </button>
        </div>
      </div>
    </div>
  );
};
