import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Play, 
  Pause, 
  Music, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Volume2,
  Coins,
  Send,
  RefreshCw
} from 'lucide-react';
import { Track } from '../types';
import {
  WithdrawalRequest,
  fetchAllWithdrawalRequests,
  markWithdrawalPaid,
  markWithdrawalRejected,
} from '../lib/earningsApi';

interface AdminViewProps {
  tracks: Track[];
  onApproveTrack: (trackId: string) => void;
  onRejectTrack: (trackId: string, reason: string) => void;
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalRequest['status'], { label: string; className: string }> = {
  pending: { label: 'В обработке', className: 'bg-amber-950/80 text-amber-300 border-amber-800' },
  paid: { label: 'Выплачено', className: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' },
  rejected: { label: 'Отклонено', className: 'bg-red-950/80 text-red-300 border-red-800' },
};

export const AdminView: React.FC<AdminViewProps> = ({
  tracks,
  onApproveTrack,
  onRejectTrack,
  onPlayTrack,
  currentTrack,
  isPlaying,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'withdrawals'>('pending');
  const [rejectingTrackId, setRejectingTrackId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingTracks = tracks.filter(t => t.moderationStatus === 'pending');
  const approvedTracks = tracks.filter(t => t.moderationStatus === 'approved' || !t.moderationStatus);
  const rejectedTracks = tracks.filter(t => t.moderationStatus === 'rejected');

  const displayedTracks = 
    activeTab === 'pending' ? pendingTracks :
    activeTab === 'approved' ? approvedTracks : rejectedTracks;

  const loadWithdrawals = () => {
    setIsLoadingWithdrawals(true);
    fetchAllWithdrawalRequests()
      .then(setWithdrawals)
      .finally(() => setIsLoadingWithdrawals(false));
  };

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      loadWithdrawals();
    }
  }, [activeTab]);

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

  const handleMarkPaid = async (id: string) => {
    setProcessingId(id);
    try {
      await markWithdrawalPaid(id);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'paid', processed_at: new Date().toISOString() } : w));
    } catch (err) {
      console.error('Failed to mark withdrawal as paid:', err);
      alert('Не удалось отметить заявку выплаченной. Попробуйте ещё раз.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkRejected = async (id: string) => {
    setProcessingId(id);
    try {
      await markWithdrawalRejected(id);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected', processed_at: new Date().toISOString() } : w));
    } catch (err) {
      console.error('Failed to reject withdrawal:', err);
      alert('Не удалось отклонить заявку. Попробуйте ещё раз.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (trackId: string) => {
    setRejectingTrackId(trackId);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTrackId || !rejectionReasonInput.trim()) return;
    onRejectTrack(rejectingTrackId, rejectionReasonInput.trim());
    setRejectingTrackId(null);
    setRejectionReasonInput('');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-white text-black font-mono font-bold text-[10px] rounded-full uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Панель Администратора</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Модерация и выплаты
          </h2>
          <p className="text-xs text-zinc-400">
            Проверяйте загруженные треки и обрабатывайте заявки авторов на вывод звёзд.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-amber-950/80 border border-amber-800/80 text-amber-300 font-mono text-xs rounded-lg font-bold">
            {pendingTracks.length} На проверке
          </span>
          <span className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-mono text-xs rounded-lg font-bold">
            {approvedTracks.length} В каталоге
          </span>
          {pendingWithdrawalsCount > 0 && (
            <span className="px-3 py-1.5 bg-white text-black font-mono text-xs rounded-lg font-bold">
              {pendingWithdrawalsCount} Заявок на вывод
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 shrink-0 ${
            activeTab === 'pending'
              ? 'bg-white text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>На проверке ({pendingTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 shrink-0 ${
            activeTab === 'approved'
              ? 'bg-white text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Одобренные ({approvedTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 shrink-0 ${
            activeTab === 'rejected'
              ? 'bg-white text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Отклоненные ({rejectedTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 shrink-0 ${
            activeTab === 'withdrawals'
              ? 'bg-white text-black shadow'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Выплаты {pendingWithdrawalsCount > 0 && `(${pendingWithdrawalsCount})`}</span>
        </button>
      </div>

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Переведите звёзды вручную со своего кошелька на указанный Telegram username, затем отметьте заявку как выплаченную.
            </p>
            <button
              onClick={loadWithdrawals}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors shrink-0"
              title="Обновить"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingWithdrawals ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {withdrawals.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
              <Coins className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">Заявок на вывод пока нет.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => {
                const status = WITHDRAWAL_STATUS_LABELS[w.status];
                const isProcessing = processingId === w.id;
                return (
                  <div
                    key={w.id}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-base font-bold text-white">{w.amount_stars.toFixed(2)} ⭐</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono border rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Автор: <span className="text-white">{w.user_email}</span>
                      </p>
                      <a
                        href={`https://t.me/${w.telegram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white underline"
                      >
                        <Send className="w-3 h-3" />
                        <span>@{w.telegram_username}</span>
                      </a>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Заявка от {new Date(w.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>

                    {w.status === 'pending' && (
                      <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleMarkRejected(w.id)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 bg-zinc-900 hover:bg-red-950/80 border border-zinc-800 hover:border-red-800 text-zinc-300 hover:text-red-300 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          Отклонить
                        </button>
                        <button
                          onClick={() => handleMarkPaid(w.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Отметить выплаченным</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : displayedTracks.length === 0 ? (
        <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
          <Music className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">
            {activeTab === 'pending'
              ? 'Очередь модерации пуста! Все треки проверены.'
              : activeTab === 'approved'
              ? 'Одобренных треков пока нет.'
              : 'Отклоненных треков нет.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedTracks.map((track) => {
            const isPlayingThis = currentTrack?.id === track.id && isPlaying;

            return (
              <div
                key={track.id}
                className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-zinc-700 transition-colors"
              >
                {/* Track Details */}
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="relative w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 group">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover filter grayscale contrast-125"
                    />
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity"
                    >
                      {isPlayingThis ? (
                        <Pause className="w-6 h-6 text-white fill-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-white truncate">{track.title}</h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
                        {track.genre}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Исполнитель: <span className="text-white font-medium">{track.artist}</span> · Альбом: <span className="text-zinc-300">{track.album}</span>
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] font-mono text-zinc-500 pt-0.5">
                      <span>Автор: {track.uploadedBy || 'Аноним'}</span>
                      <span>·</span>
                      <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                      {track.audioUrl ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <Volume2 className="w-3 h-3" />
                          <span>Аудиофайл</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">Синтез {track.audioPattern?.synthStyle}</span>
                      )}
                    </div>

                    {track.moderationStatus === 'rejected' && track.rejectionReason && (
                      <p className="text-xs text-red-400 pt-1 font-mono">
                        Причина отказа: "{track.rejectionReason}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center space-x-3 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-900">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    <span>{isPlayingThis ? 'Пауза' : 'Слушать'}</span>
                  </button>

                  {track.moderationStatus !== 'approved' && (
                    <button
                      onClick={() => onApproveTrack(track.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>Одобрить</span>
                    </button>
                  )}

                  {track.moderationStatus !== 'rejected' && (
                    <button
                      onClick={() => handleOpenRejectModal(track.id)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-red-950/80 border border-zinc-800 hover:border-red-800 text-zinc-300 hover:text-red-300 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Отклонить</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingTrackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setRejectingTrackId(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Отклонение публикации трека</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Укажите подробную причину отклонения. Автор увидит её в своем кабинете.
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase">
                  Причина отклонения *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Например: Несоответствие качества аудио, нецензурная лексика или нарушение авторских прав..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg p-3 focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingTrackId(null)}
                  className="w-1/2 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md"
                >
                  Подтвердить отказ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
