import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Coins, 
  Music, 
  TrendingUp, 
  Check, 
  Play, 
  Sparkles, 
  Send,
  X, 
  AlertCircle,
  Volume2,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Track, Genre, User } from '../types';
import { uploadAudioFile, uploadCoverFile } from '../lib/tracksApi';
import {
  EARNINGS_PER_PLAY_STARS,
  MIN_WITHDRAWAL_STARS,
  WithdrawalRequest,
  fetchMyWithdrawalRequests,
  requestWithdrawal,
  subscribeToMyWithdrawals,
} from '../lib/earningsApi';

interface EarnViewProps {
  currentUser: User | null;
  uploadedTracks: Track[];
  onUploadTrack: (newTrack: Omit<Track, 'id' | 'playCount'>) => Promise<void>;
  onOpenAuth: () => void;
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

const GENRES: Genre[] = [
  'Pop',
  'K-Pop / J-Pop',
  'Hip-Hop / Rap',
  'R&B / Soul / Funk',
  'Rock / Alternative / Indie',
  'Metal / Punk',
  'Jazz / Blues',
  'Electronic / EDM',
  'Lo-fi / Ambient / Chillout',
  'Country / Folk',
  'Reggae / Ska',
  'Latin / Afrobeats',
  'Classical',
  'Phonk / Synthwave / Retro'
];

const STATUS_LABELS: Record<WithdrawalRequest['status'], { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: 'В обработке',
    icon: <Clock className="w-3 h-3" />,
    className: 'bg-amber-950/80 text-amber-300 border-amber-800',
  },
  paid: {
    label: 'Выплачено',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
  },
  rejected: {
    label: 'Отклонено',
    icon: <XCircle className="w-3 h-3" />,
    className: 'bg-red-950/80 text-red-300 border-red-800',
  },
};

export const EarnView: React.FC<EarnViewProps> = ({
  currentUser,
  uploadedTracks,
  onUploadTrack,
  onOpenAuth,
  onPlayTrack,
  currentTrack,
  isPlaying,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(currentUser?.name || '');
  const [album, setAlbum] = useState('Сингл');
  const [genre, setGenre] = useState<Genre>('Pop');
  const [year, setYear] = useState(2026);
  const [synthStyle, setSynthStyle] = useState<'ambient_pad' | 'lofi_chill' | 'synthwave_pulse' | 'piano_solo' | 'minimal_beat' | 'jazz_chords'>('lofi_chill');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadedAudioFileName, setUploadedAudioFileName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Withdrawal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawTelegramUsername, setWithdrawTelegramUsername] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Filter user's tracks
  const myTracks = uploadedTracks.filter(
    t => t.uploadedBy === currentUser?.email || t.uploadedBy === currentUser?.id
  );

  const totalPlaysOnMyTracks = myTracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
  const totalEarnedStars = totalPlaysOnMyTracks * EARNINGS_PER_PLAY_STARS;
  const claimedStars = myWithdrawals
    .filter((w) => w.status === 'pending' || w.status === 'paid')
    .reduce((acc, w) => acc + w.amount_stars, 0);
  const availableStars = Math.max(0, totalEarnedStars - claimedStars);

  // Load withdrawal history + live-update on status change (e.g. admin marks "paid")
  useEffect(() => {
    if (!currentUser) return;
    fetchMyWithdrawalRequests(currentUser.id).then(setMyWithdrawals);

    const unsubscribe = subscribeToMyWithdrawals(currentUser.id, (updated) => {
      setMyWithdrawals((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    });
    return unsubscribe;
  }, [currentUser?.id]);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setUploadedAudioFileName(file.name);
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const defaultCovers = [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'
      ];
      const randomCover = defaultCovers[Math.floor(Math.random() * defaultCovers.length)];

      const finalAudioUrl = audioFile ? await uploadAudioFile(audioFile) : undefined;
      const finalCoverUrl = coverFile ? await uploadCoverFile(coverFile) : randomCover;

      await onUploadTrack({
        title,
        artist,
        album: album || 'Сингл',
        genre,
        year,
        duration: 180 + Math.floor(Math.random() * 60),
        coverUrl: finalCoverUrl,
        audioUrl: finalAudioUrl,
        audioPattern: !finalAudioUrl ? {
          tempo: 80 + Math.floor(Math.random() * 40),
          key: 'C minor',
          synthStyle,
          notes: [60, 63, 67, 70, 72, 67, 63, 60]
        } : undefined,
        uploadedBy: currentUser.email,
        earningsCount: 0,
        moderationStatus: 'pending',
      });

      setIsSuccessMessage(true);
      setTitle('');
      setUploadedAudioFileName('');
      setAudioFile(null);
      setCoverFile(null);
      setCoverUrl('');
      setTimeout(() => setIsSuccessMessage(false), 4000);
    } catch (err: any) {
      console.error('Track upload failed:', err);
      setSubmitError(
        err?.message || 'Не удалось отправить трек. Проверьте подключение к Supabase и попробуйте ещё раз.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');

    const amount = parseFloat(withdrawAmount);
    if (!withdrawTelegramUsername.trim()) {
      setWithdrawError('Укажите ваш Telegram username');
      return;
    }
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_STARS) {
      setWithdrawError(`Минимальная сумма для вывода — ${MIN_WITHDRAWAL_STARS} ⭐`);
      return;
    }
    if (amount > availableStars) {
      setWithdrawError(`Недостаточно звёзд. Доступно: ${availableStars.toFixed(2)} ⭐`);
      return;
    }

    setIsWithdrawSubmitting(true);
    try {
      await requestWithdrawal(amount, withdrawTelegramUsername.trim());
      setWithdrawSuccess(true);
      if (currentUser) {
        fetchMyWithdrawalRequests(currentUser.id).then(setMyWithdrawals);
      }
      setTimeout(() => {
        setWithdrawSuccess(false);
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
      }, 2200);
    } catch (err: any) {
      setWithdrawError(err?.message || 'Не удалось создать заявку. Попробуйте ещё раз.');
    } finally {
      setIsWithdrawSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Monetization Header Banner */}
      <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono text-zinc-300">
            <Coins className="w-4 h-4 text-white" />
            <span>Платформа Монетизации Авторов</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Зарабатывайте на своей музыке
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            MonoSound работает по прозрачной модели распределения доходов: пользователи оплачивают подписку <strong className="text-white">50 ⭐ в месяц</strong> (Telegram Stars). Каждое прослушивание вашего трека приносит начисление на баланс, который можно вывести звёздами через бота.
          </p>

          {/* Quick Stats Dashboard */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Баланс к выплате</span>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-extrabold text-white">{availableStars.toFixed(2)} ⭐</p>
                {availableStars >= MIN_WITHDRAWAL_STARS && (
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-[11px] font-semibold text-white hover:underline"
                  >
                    Вывести
                  </button>
                )}
              </div>
              {availableStars > 0 && availableStars < MIN_WITHDRAWAL_STARS && (
                <p className="text-[10px] text-zinc-500">Минимум для вывода — {MIN_WITHDRAWAL_STARS} ⭐</p>
              )}
            </div>

            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Ваших треков</span>
              <p className="text-xl font-extrabold text-white">{myTracks.length}</p>
            </div>

            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Всего прослушиваний</span>
              <p className="text-xl font-extrabold text-white">{totalPlaysOnMyTracks}</p>
            </div>
          </div>
        </div>
      </div>

      {!currentUser && (
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-white shrink-0" />
            <p className="text-xs text-zinc-300">
              Чтобы привязать загруженные треки к вашему профилю и получать выплаты, авторизуйтесь в системе.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Войти в аккаунт
          </button>
        </div>
      )}

      {/* Main Grid: Upload Form & Royalty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Track Upload Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <Upload className="w-5 h-5 text-white" />
                <span>Загрузка нового релиз-трека</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Заполните карточку релиза. Ваш трек будет отправлен на проверку модератору перед публикацией.
              </p>
            </div>

            {isSuccessMessage && (
              <div className="p-4 bg-amber-950/50 border border-amber-800 text-amber-200 text-xs rounded-lg flex items-center space-x-3">
                <Check className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Ваш трек успешно отправлен на модерацию! Модератор проверит его в ближайшее время.</span>
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-lg flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTrack} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Название трека *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Midnight Resonance"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Исполнитель / Проект *</label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ваш псевдоним"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Альбом / Релиз</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="Single / EP"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Жанр</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as Genre)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-zinc-600"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Год записи</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              {/* Audio Source Option */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <label className="text-[11px] font-mono text-zinc-400 uppercase block">
                  Аудиофайл трека
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition-colors border border-zinc-700">
                    <Volume2 className="w-4 h-4" />
                    <span>{uploadedAudioFileName ? 'Сменить файл' : 'Загрузить mp3/wav'}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-zinc-400 truncate">
                    {uploadedAudioFileName ? `Выбран: ${uploadedAudioFileName}` : 'или будет сгенерирован аудио-паттерн'}
                  </span>
                </div>

                {!uploadedAudioFileName && (
                  <div className="pt-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                      Аудио-синтез (если файл не выбран)
                    </label>
                    <select
                      value={synthStyle}
                      onChange={(e) => setSynthStyle(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2"
                    >
                      <option value="lofi_chill">Lo-Fi Chill Synthesizer</option>
                      <option value="ambient_pad">Ambient Warm Pad</option>
                      <option value="synthwave_pulse">Synthwave Bassline</option>
                      <option value="piano_solo">Solo Piano Harmony</option>
                      <option value="minimal_beat">Minimal Beat / EDM</option>
                      <option value="jazz_chords">Jazz Chords</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Cover Art Upload / Option */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase">Обложка релиза</label>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs rounded-lg font-medium transition-colors">
                    <span>Выбрать обложку из файла</span>
                    <input type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                  </label>
                  {coverUrl && (
                    <img src={coverUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-zinc-700" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Загрузка трека...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-black" />
                    <span>Опубликовать трек и начать монетизацию</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info & Earnings Rules (1 col) */}
        <div className="space-y-6">
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <span>Как рассчитывается заработок</span>
            </h3>

            <div className="space-y-3 text-xs text-zinc-400">
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                <p className="text-white font-semibold">1. Фонд подписок 50 ⭐/мес</p>
                <p className="text-[11px]">
                  Каждый подписчик формирует общий призовой пул платформы.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                <p className="text-white font-semibold">2. Прямые выплаты за прослушивание</p>
                <p className="text-[11px]">
                  За каждый прослушанный трек вам начисляется {EARNINGS_PER_PLAY_STARS.toFixed(2)} ⭐.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                <p className="text-white font-semibold">3. Вывод звёздами через бота</p>
                <p className="text-[11px]">
                  От {MIN_WITHDRAWAL_STARS} ⭐ за раз. Заявка обрабатывается вручную — звёзды переводятся на ваш Telegram-аккаунт из кошелька платформы.
                </p>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          {currentUser && myWithdrawals.length > 0 && (
            <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white tracking-tight">Заявки на вывод</h3>
              <div className="space-y-2">
                {myWithdrawals.map((w) => {
                  const status = STATUS_LABELS[w.status];
                  return (
                    <div key={w.id} className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{w.amount_stars.toFixed(2)} ⭐</p>
                        <p className="text-[10px] text-zinc-500 font-mono">@{w.telegram_username}</p>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono border rounded-full ${status.className}`}>
                        {status.icon}
                        <span>{status.label}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User's Uploaded Tracks List */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <Music className="w-4 h-4 text-white" />
              <span>Ваши треки ({myTracks.length})</span>
            </h3>

            {myTracks.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                У вас пока нет загруженных треков. Воспользуйтесь формой выше, чтобы добавить первый!
              </p>
            ) : (
              <div className="space-y-2">
                {myTracks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden min-w-0 flex-1">
                      <img src={t.coverUrl} alt={t.title} className="w-10 h-10 rounded-md object-cover shrink-0" />
                      <div className="truncate min-w-0 flex-1">
                        <div className="flex items-center space-x-2 truncate">
                          <p className="text-xs font-bold text-white truncate">{t.title}</p>
                          
                          {/* Moderation Status Badge */}
                          {t.moderationStatus === 'pending' && (
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800 rounded-full shrink-0">
                              На модерации
                            </span>
                          )}
                          {(t.moderationStatus === 'approved' || !t.moderationStatus) && (
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-full shrink-0">
                              Одобрен
                            </span>
                          )}
                          {t.moderationStatus === 'rejected' && (
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-800 rounded-full shrink-0">
                              Отклонен
                            </span>
                          )}
                        </div>
                        
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {t.genre} · {t.playCount} стримов
                          {t.rejectionReason && (
                            <span className="block text-red-400 font-sans mt-0.5">
                              Причина отказа: "{t.rejectionReason}"
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +{(t.playCount * EARNINGS_PER_PLAY_STARS).toFixed(2)} ⭐
                      </span>
                      <button
                        onClick={() => onPlayTrack(t)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
                        title="Слушать трек"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Вывод звёзд</h3>
              <p className="text-xs text-zinc-400">Доступно к выводу: {availableStars.toFixed(2)} ⭐ (минимум {MIN_WITHDRAWAL_STARS} ⭐)</p>
            </div>

            {withdrawSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center space-x-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Заявка отправлена! Мы вручную переведём звёзды на ваш Telegram-аккаунт в ближайшее время.</span>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {withdrawError && (
                  <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
                    {withdrawError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">
                    Ваш Telegram username
                  </label>
                  <div className="relative">
                    <Send className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={withdrawTelegramUsername}
                      onChange={(e) => setWithdrawTelegramUsername(e.target.value.replace(/^@/, ''))}
                      placeholder="username (без @)"
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">
                    Сумма (⭐)
                  </label>
                  <input
                    type="number"
                    required
                    min={MIN_WITHDRAWAL_STARS}
                    max={availableStars}
                    step={0.01}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`от ${MIN_WITHDRAWAL_STARS}`}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isWithdrawSubmitting}
                  className="w-full py-3 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isWithdrawSubmitting && <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                  <span>Отправить заявку на вывод</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
