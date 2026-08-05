import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, X, Check, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

const ADMIN_EMAIL = 'tinbotoleg@gmail.com';

function buildAppUser(supabaseUser: { id: string; email?: string | null; user_metadata?: any }): User {
  const email = (supabaseUser.email || '').trim().toLowerCase();
  const todayStr = new Date().toISOString().slice(0, 10);
  const isAdmin = email === ADMIN_EMAIL;

  return {
    id: supabaseUser.id,
    email,
    name: supabaseUser.user_metadata?.name || email.split('@')[0],
    isSubscribed: isAdmin, // админ по умолчанию с полным доступом
    subscriptionExpiresAt: isAdmin ? Date.now() + 365 * 24 * 60 * 60 * 1000 : null,
    dailyPlaysCount: 0,
    lastPlayDate: todayStr,
    artistEarnings: 0,
    isAdmin,
  };
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'forgot') {
      if (!cleanEmail) {
        setError('Укажите вашу электронную почту');
        return;
      }
      setIsSubmitting(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      setIsSubmitting(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setResetEmailSent(true);
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

    setIsSubmitting(true);

    if (mode === 'register') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name } },
      });
      setIsSubmitting(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Если в проекте включено подтверждение email, сессии на этом шаге
      // ещё не будет — сообщаем пользователю проверить почту.
      if (!data.session || !data.user) {
        setError('Проверьте почту и подтвердите регистрацию, затем войдите.');
        setMode('login');
        return;
      }

      onLoginSuccess(buildAppUser(data.user));
      onClose();
      return;
    }

    // mode === 'login'
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setIsSubmitting(false);

    if (signInError) {
      setError('Неверный email или пароль.');
      return;
    }

    onLoginSuccess(buildAppUser(data.user));
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
              : 'Восстановление пароля'}
          </h3>
          <p className="text-xs text-zinc-400">
            {mode === 'login'
              ? 'Войдите для управления подпиской и публикации треков'
              : mode === 'register'
              ? 'Зарегистрируйтесь для подписки за 50 ⭐/мес и заработка на музыке'
              : 'Укажите email — мы отправим ссылку для сброса пароля'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        {mode === 'forgot' && resetEmailSent ? (
          <div className="p-4 bg-emerald-950/70 border border-emerald-800/90 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
              <Mail className="w-4 h-4 shrink-0" />
              <span>Письмо со ссылкой для сброса пароля отправлено на {email.trim().toLowerCase()}</span>
            </div>
            <p className="text-[11px] text-emerald-300/90">
              Перейдите по ссылке из письма, задайте новый пароль и вернитесь ко входу.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setResetEmailSent(false);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Вернуться ко входу</span>
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
                    minLength={6}
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
              disabled={isSubmitting}
              className="w-full py-3 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Войти'
                      : mode === 'register'
                      ? 'Зарегистрироваться'
                      : 'Отправить ссылку для сброса'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-zinc-900 flex flex-col space-y-2 text-xs text-zinc-400">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setError('');
                setResetEmailSent(false);
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
                  setResetEmailSent(false);
                  setMode('login');
                }}
                className="text-zinc-400 hover:text-white font-mono text-[11px]"
              >
                Вернуться ко входу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
