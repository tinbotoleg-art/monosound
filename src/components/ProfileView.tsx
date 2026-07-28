import React, { useState } from 'react';
import { 
  User as UserIcon, 
  CreditCard, 
  Sparkles, 
  Check, 
  X, 
  LogOut, 
  ShieldCheck, 
  Coins, 
  Calendar,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';

interface ProfileViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleSubscription: (activate: boolean) => void;
  onNavigateToEarn: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onToggleSubscription,
  onNavigateToEarn,
}) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [passwordSentMsg, setPasswordSentMsg] = useState<{ email: string; pwd: string } | null>(null);

  const handleChangePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let newPwd = 'Ms-';
    for (let i = 0; i < 6; i++) {
      newPwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    if (currentUser?.email) {
      localStorage.setItem(`monosound_pwd_${currentUser.email.trim().toLowerCase()}`, newPwd);
      setPasswordSentMsg({ email: currentUser.email, pwd: newPwd });
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
            Авторизуйтесь в системе для управления премиум-подпиской (59 ₽/мес), отслеживания дневных лимитов и загрузки собственной музыки.
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

  const handleConfirmPayment = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      onToggleSubscription(true);
      setPaymentSuccess(false);
      setIsPaymentModalOpen(false);
    }, 1800);
  };

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
          <span className="text-sm font-mono font-extrabold text-white">59 ₽ / месяц</span>
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
                    Следующее списание: {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('ru-RU')} (59 ₽)
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onToggleSubscription(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-colors"
              >
                Отключить подписку
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
                <p className="text-xs text-zinc-400">Слушайте без рекламы, скачивайте в offline и создавайте свои треки.</p>
              </div>

              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-md flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Активировать за 59 ₽ / мес</span>
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

      {/* Security & Password Reset Section */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-white" />
              <span>Безопасность и сброс пароля</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Сгенерировать и выслать новый случайный пароль на вашу почту ({currentUser.email}).
            </p>
          </div>

          <button
            onClick={handleChangePassword}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Сменить пароль по почте</span>
          </button>
        </div>

        {passwordSentMsg && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-200 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Письмо отправлено на {passwordSentMsg.email}!</span>
              </span>
              <button
                onClick={() => setPasswordSentMsg(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-emerald-300 font-mono text-[11px]">
              Новый сгенерированный пароль: <strong className="text-white text-sm bg-black/40 px-2 py-0.5 rounded border border-emerald-700">{passwordSentMsg.pwd}</strong>
            </p>
            <p className="text-[11px] text-emerald-400/80">
              Вы можете использовать этот пароль при следующем входе в систему.
            </p>
          </div>
        )}
      </div>

      {/* Payment Activation Modal */}
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
              <h3 className="text-lg font-bold text-white">Оформление подписки MonoSound</h3>
              <p className="text-xs text-zinc-400">Стоимость: 59 ₽ / месяц (автопродление)</p>
            </div>

            {paymentSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center space-x-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Оплата провайдера прошла успешно! Премиум подписка активирована.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span>Тариф:</span>
                    <span className="font-bold text-white">Полный доступ (Безлимит)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span>Период:</span>
                    <span className="font-mono text-white">1 месяц</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-zinc-800 pt-2 font-bold text-white">
                    <span>К оплате:</span>
                    <span>59 ₽</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Способ оплаты</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 bg-zinc-900 border border-white text-white text-xs rounded-lg font-medium text-left flex items-center justify-between">
                      <span>Банковская карта</span>
                      <CreditCard className="w-4 h-4" />
                    </button>
                    <button className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg font-medium text-left">
                      <span>СБП (Быстрый платеж)</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  className="w-full py-3.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors shadow-md"
                >
                  Оплатить 59 ₽ и включить Премиум
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
