import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Sparkles, 
  Check, 
  X, 
  LogOut, 
  ShieldCheck, 
  Coins, 
  Lock,
  ArrowRight,
  Send,
  Loader2
} from 'lucide-react';
import { User } from '../types';
import { getSubscribeDeepLink, SUBSCRIPTION_STARS_PRICE, cancelMySubscription } from '../lib/subscription';

interface ProfileViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSubscriptionCancelled: () => void;
  onNavigateToEarn: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onSubscriptionCancelled,
  onNavigateToEarn,
}) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Как только вебхук после реальной оплаты активирует подписку в базе,
  // currentUser.isSubscribed обновится через Supabase Realtime (см. App.tsx)
  // — закрываем модалку оплаты автоматически, без участия пользователя.
  useEffect(() => {
    if (currentUser?.isSubscribed) {
      setIsPaymentModalOpen(false);
    }
  }, [currentUser?.isSubscribed]);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await cancelMySubscription();
      onSubscriptionCancelled();
    } catch (err) {
      console.error('Cancel subscription failed:', err);
      alert('Не удалось отключить подписку. Попробуйте ещё раз.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Личный Кабинет MonoSound</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Авторизуйтесь в системе для управления премиум-подпиской ({SUBSCRIPTION_STARS_PRICE} ⭐/мес), отслеживания дневных лимитов и загрузки собственной музыки.
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-xl transition-colors shadow-lg"
        >
          <UserIcon className="w-4 h-4" />
          <span>Войти с почтой и паролем</span>
        </button>
      </div>
    );
  }

  const isSubscribed = currentUser.isSubscribed;
  const todayPlays = currentUser.dailyPlaysCount || 0;
  const remainingPlays = Math.max(0, 10 - todayPlays);
  const deepLink = getSubscribeDeepLink(currentUser.id);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Account Info Header */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{currentUser.name}</h2>
              {isSubscribed ? (
                <span className="px-2 py-0.5 bg-white text-black font-mono font-bold text-[10px] rounded-full uppercase">
                  Премиум
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] rounded-full uppercase">
                  Бесплатный тариф
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Выйти из аккаунта</span>
        </button>
      </div>

      {/* Subscription Status Card */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Управление сервисом</span>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Подписка MonoSound Премиум
            </h3>
          </div>
          <span className="text-sm font-mono font-extrabold text-white">{SUBSCRIPTION_STARS_PRICE} ⭐ / месяц</span>
        </div>

        {isSubscribed ? (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Подписка активна</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Вам доступно безлимитное прослушивание, оффлайн-скачивание и поддержка независимых музыкантов.
                </p>
                {currentUser.subscriptionExpiresAt && (
                  <p className="text-[11px] font-mono text-zinc-500 mt-2">
                    Действует до: {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isCancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Отключить подписку</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Дневной лимит бесплатного тарифа</span>
                <span className="font-mono text-zinc-300">{todayPlays} из 10 треков</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${Math.min(100, (todayPlays / 10) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                {remainingPlays > 0
                  ? `Осталось ${remainingPlays} прослушиваний на сегодня.`
                  : 'Дневной лимит исчерпан. Оформите подписку для снятия всех ограничений.'}
              </p>
            </div>

            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Полный доступ ко всей медиатеке</h4>
                <p className="text-xs text-zinc-400">Слушайте без ограничений, скачивайте в offline и создавайте свои треки.</p>
              </div>

              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-md flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Оформить за {SUBSCRIPTION_STARS_PRICE} ⭐</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creator Hub Portal Link */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Coins className="w-4 h-4 text-white" />
            <span>Кабинет Музыканта</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Загружайте свои композиции и получайте отчисления с подписок пользователей.
          </p>
        </div>

        <button
          onClick={onNavigateToEarn}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
        >
          <span>Заработать</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Security Section */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-white" />
          <h3 className="text-base font-bold text-white">Безопасность</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Смена пароля — через ссылку восстановления на email со страницы входа
          («Забыли пароль?»).
        </p>
      </div>

      {/* Telegram Stars Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Оплата через Telegram</h3>
              <p className="text-xs text-zinc-400">{SUBSCRIPTION_STARS_PRICE} ⭐ Telegram Stars — 1 месяц подписки</p>
            </div>

            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3 text-xs text-zinc-300">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Нажмите кнопку ниже — откроется Telegram и чат с нашим ботом</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Бот пришлёт счёт на {SUBSCRIPTION_STARS_PRICE} ⭐ — подтвердите оплату</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                <span>Вернитесь на сайт — подписка активируется автоматически, эта страница обновится сама</span>
              </div>
            </div>

            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors shadow-md flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Открыть Telegram и оплатить {SUBSCRIPTION_STARS_PRICE} ⭐</span>
            </a>

            <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center space-x-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Ожидаем подтверждение оплаты...</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
