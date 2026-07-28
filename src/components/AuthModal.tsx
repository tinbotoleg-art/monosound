import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, X, Check, ArrowRight, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  // Password reset result
  const [resetSuccessState, setResetSuccessState] = useState<{ email: string; newPassword: string } | null>(null);

  // Helper to get stored password for an email
  const getStoredPassword = (targetEmail: string): string => {
    const key = `monosound_pwd_${targetEmail.trim().toLowerCase()}`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    if (targetEmail.trim().toLowerCase() === 'tinbotoleg@gmail.com') {
      return '18fhghdjghgn3ef';
    }
    return '';
  };

  // Helper to save password for an email
  const savePassword = (targetEmail: string, pwd: string) => {
    const key = `monosound_pwd_${targetEmail.trim().toLowerCase()}`;
    localStorage.setItem(key, pwd);
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = 'Ms-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'forgot') {
      if (!cleanEmail) {
        setError('Укажите вашу электронную почту');
        return;
      }
      const newPwd = generateRandomPassword();
      savePassword(cleanEmail, newPwd);
      setResetSuccessState({
        email: cleanEmail,
        newPassword: newPwd,
      });
      return;
    }

    if (!cleanEmail || !password) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (mode === 'register' && !name) {
      setError('Укажите ваше имя или никнейм');
      return;
    }

    // Check if logging in as Admin (tinbotoleg@gmail.com)
    if (cleanEmail === 'tinbotoleg@gmail.com') {
      const requiredAdminPwd = getStoredPassword('tinbotoleg@gmail.com');
      if (password !== requiredAdminPwd) {
        setError(`Неверный пароль для администратора. Для входа требуется пароль "${requiredAdminPwd}".`);
        return;
      }

      // Admin Login Success
      savePassword(cleanEmail, password);
      const todayStr = new Date().toISOString().slice(0, 10);
      const adminUser: User = {
        id: 'admin-oleg',
        email: 'tinbotoleg@gmail.com',
        name: name || 'Олег (Администратор)',
        isSubscribed: true,
        subscriptionExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        dailyPlaysCount: 0,
        lastPlayDate: todayStr,
        artistEarnings: 0,
        isAdmin: true,
      };

      onLoginSuccess(adminUser);
      onClose();
      return;
    }

    // Standard User Login / Registration
    savePassword(cleanEmail, password);
    const todayStr = new Date().toISOString().slice(0, 10);
    const userObj: User = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      isSubscribed: false,
      subscriptionExpiresAt: null,
      dailyPlaysCount: 0,
      lastPlayDate: todayStr,
      artistEarnings: 0,
      isAdmin: false, // Strict: only tinbotoleg@gmail.com is admin
    };

    onLoginSuccess(userObj);
    onClose();
  };

  const handleAdminQuickLogin = () => {
    const adminPwd = getStoredPassword('tinbotoleg@gmail.com');
    setEmail('tinbotoleg@gmail.com');
    setPassword(adminPwd);
    setMode('login');

    const todayStr = new Date().toISOString().slice(0, 10);
    const adminUser: User = {
      id: 'admin-oleg',
      email: 'tinbotoleg@gmail.com',
      name: 'Олег (Администратор)',
      isSubscribed: true,
      subscriptionExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      dailyPlaysCount: 0,
      lastPlayDate: todayStr,
      artistEarnings: 0,
      isAdmin: true,
    };

    onLoginSuccess(adminUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login'
              ? 'Вход в MonoSound'
              : mode === 'register'
              ? 'Создать аккаунт'
              : 'Сброс и восстановление пароля'}
          </h3>
          <p className="text-xs text-zinc-400">
            {mode === 'login'
              ? 'Войдите для управления подпиской и публикации треков'
              : mode === 'register'
              ? 'Зарегистрируйтесь для подписки за 59 ₽/мес и заработка на музыке'
              : 'Укажите email — мы отправим вам письмо с новым сгенерированным паролем'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Reset Password Success Email Simulation */}
        {mode === 'forgot' && resetSuccessState ? (
          <div className="p-4 bg-emerald-950/70 border border-emerald-800/90 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
              <Mail className="w-4 h-4 shrink-0" />
              <span>Письмо успешно отправлено на {resetSuccessState.email}!</span>
            </div>

            <div className="text-xs text-emerald-100 font-mono bg-emerald-900/40 p-3 rounded-lg border border-emerald-800/80 space-y-2">
              <p className="text-[10px] text-emerald-400 font-sans uppercase font-bold tracking-wider">
                Входящее письмо: Восстановление доступа MonoSound
              </p>
              <p className="text-emerald-200">
                Ваш пароль был изменен. Новый автоматически сгенерированный пароль:
              </p>
              <div className="text-white text-base tracking-widest font-bold select-all bg-black/50 p-2 rounded border border-emerald-700/80 text-center my-1 font-mono">
                {resetSuccessState.newPassword}
              </div>
              <p className="text-[11px] text-emerald-300 font-sans">
                Используйте этот пароль для входа в личный кабинет.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEmail(resetSuccessState.email);
                setPassword(resetSuccessState.newPassword);
                setMode('login');
                setResetSuccessState(null);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Подставить пароль и войти</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase">Имя / Псевдоним</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400 uppercase">Электронная почта</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Пароль</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('forgot');
                      }}
                      className="text-[11px] text-zinc-400 hover:text-white transition-colors underline"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2"
            >
              <span>
                {mode === 'login'
                  ? 'Войти'
                  : mode === 'register'
                  ? 'Зарегистрироваться'
                  : 'Отправить новый пароль на почту'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-zinc-900 flex flex-col space-y-2 text-xs text-zinc-400">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setError('');
                setResetSuccessState(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="hover:text-white underline underline-offset-4"
            >
              {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>

            {mode === 'forgot' && (
              <button
                onClick={() => {
                  setError('');
                  setResetSuccessState(null);
                  setMode('login');
                }}
                className="text-zinc-400 hover:text-white font-mono text-[11px]"
              >
                Вернуться ко входу
              </button>
            )}
          </div>

          <button
            onClick={handleAdminQuickLogin}
            className="w-full py-2 bg-zinc-900 hover:bg-amber-950/40 hover:border-amber-700/80 border border-zinc-800 text-amber-300 text-[11px] font-mono rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Вход Администратора (tinbotoleg@gmail.com)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
