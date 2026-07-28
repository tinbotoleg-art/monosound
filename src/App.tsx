import React, { useState, useEffect, useCallback } from 'react';
import { 
  Track, 
  Playlist, 
  ActiveTab, 
  PreferenceProfile,
  User
} from './types';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS } from './data/initialTracks';
import { 
  getDownloadedTracks, 
  saveTrackOffline, 
  removeTrackOffline, 
  clearAllOfflineData 
} from './lib/offlineDb';
import { globalAudioEngine } from './lib/audioEngine';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { QueueDrawer } from './components/QueueDrawer';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionLimitModal } from './components/SubscriptionLimitModal';

import { TrackList } from './components/TrackList';
import { SearchView } from './components/SearchView';
import { PlaylistsView } from './components/PlaylistsView';
import { RecommendationsView } from './components/RecommendationsView';
import { OfflineView } from './components/OfflineView';
import { EarnView } from './components/EarnView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';

import { Sparkles, HardDriveDownload, Play, Heart, Disc, Radio, RefreshCw, Coins, Trophy, Flame, ShieldCheck } from 'lucide-react';

export default function App() {
  // Main State
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('monosound_uploaded_tracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...parsed, ...INITIAL_TRACKS];
      } catch (e) {
        return INITIAL_TRACKS;
      }
    }
    return INITIAL_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('monosound_playlists');
    return saved ? JSON.parse(saved) : INITIAL_PLAYLISTS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('monosound_user');
    if (!saved) return null;
    try {
      const user: User = JSON.parse(saved);
      const isActualAdmin = user.email.trim().toLowerCase() === 'tinbotoleg@gmail.com' && user.isAdmin;
      return { ...user, isAdmin: isActualAdmin };
    } catch (e) {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionLimitModalOpen, setIsSubscriptionLimitModalOpen] = useState(false);

  const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile>(() => {
    const saved = localStorage.getItem('monosound_preferences');
    return saved
      ? JSON.parse(saved)
      : {
          likedTrackIds: INITIAL_TRACKS.filter(t => t.isLiked).map(t => t.id),
          history: [],
          favoriteGenres: { Ambient: 15, 'Lo-Fi': 20, 'Minimal Techno': 10 },
          favoriteArtists: {},
          totalTimeListenedSeconds: 0,
        };
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Audio Player State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Load offline downloaded state from IndexedDB on startup
  useEffect(() => {
    getDownloadedTracks().then((records) => {
      const downloadedIds = new Set(records.map((r) => r.track.id));
      setTracks((prev) =>
        prev.map((t) => ({
          ...t,
          isDownloaded: downloadedIds.has(t.id),
        }))
      );
    }).catch(err => console.warn('IndexedDB load warning:', err));
  }, []);

  // Save User to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('monosound_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('monosound_user');
    }
  }, [currentUser]);

  // Protect Admin Tab (only tinbotoleg@gmail.com with admin role)
  useEffect(() => {
    const isActualAdmin = currentUser?.email.trim().toLowerCase() === 'tinbotoleg@gmail.com' && currentUser?.isAdmin;
    if (activeTab === 'admin' && !isActualAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, currentUser]);

  // Listen for window online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save Playlists to localStorage
  useEffect(() => {
    localStorage.setItem('monosound_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Save Preferences to localStorage
  useEffect(() => {
    localStorage.setItem('monosound_preferences', JSON.stringify(preferenceProfile));
  }, [preferenceProfile]);

  // Setup Audio Engine Callbacks
  useEffect(() => {
    globalAudioEngine.setCallbacks(
      (time, dur) => {
        setCurrentTime(time);
        setDuration(dur);
      },
      () => {
        handleTrackEnded();
      }
    );
  }, [queue, currentTrack, repeatMode, isShuffle]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      globalAudioEngine.playTrack(currentTrack, 0);
      setIsPlaying(true);
      return;
    }

    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(nextTrack);
    } else if (repeatMode === 'all') {
      // Loop entire catalog
      playTrack(tracks[0]);
    } else {
      setIsPlaying(false);
    }
  }, [queue, currentTrack, repeatMode, tracks]);

  const playTrack = (track: Track) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let user = currentUser;

    // Daily Limit Logic for Free Tier (10 tracks/day max)
    if (user) {
      if (user.lastPlayDate !== todayStr) {
        user = { ...user, lastPlayDate: todayStr, dailyPlaysCount: 0 };
        setCurrentUser(user);
      }
      if (!user.isSubscribed && user.dailyPlaysCount >= 10) {
        setIsSubscriptionLimitModalOpen(true);
        return;
      }
      if (!user.isSubscribed) {
        user = { ...user, dailyPlaysCount: user.dailyPlaysCount + 1 };
        setCurrentUser(user);
      }
    } else {
      const guestCount = Number(localStorage.getItem('monosound_guest_plays') || '0');
      const guestDate = localStorage.getItem('monosound_guest_date') || '';
      let currentCount = guestCount;
      if (guestDate !== todayStr) {
        currentCount = 0;
        localStorage.setItem('monosound_guest_date', todayStr);
      }
      if (currentCount >= 10) {
        setIsSubscriptionLimitModalOpen(true);
        return;
      }
      localStorage.setItem('monosound_guest_plays', String(currentCount + 1));
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(track.duration);

    globalAudioEngine.playTrack(track, 0);

    // Update play stats & artist earnings (0.10 RUB per play)
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === track.id) {
          const newPlayCount = t.playCount + 1;
          const newEarnings = (t.earningsCount || 0) + 0.10;
          return { ...t, playCount: newPlayCount, earningsCount: newEarnings, lastPlayedAt: Date.now() };
        }
        return t;
      })
    );

    if (currentUser && track.uploadedBy && (track.uploadedBy === currentUser.email || track.uploadedBy === currentUser.id)) {
      setCurrentUser((prev) => prev ? { ...prev, artistEarnings: prev.artistEarnings + 0.10 } : prev);
    }

    setPreferenceProfile((prev) => {
      const currentGenreScore = prev.favoriteGenres[track.genre] || 0;
      const currentArtistScore = prev.favoriteArtists[track.artist] || 0;
      return {
        ...prev,
        history: [
          ...prev.history.slice(-49),
          { trackId: track.id, timestamp: Date.now(), durationListenedSeconds: track.duration },
        ],
        favoriteGenres: {
          ...prev.favoriteGenres,
          [track.genre]: currentGenreScore + 1,
        },
        favoriteArtists: {
          ...prev.favoriteArtists,
          [track.artist]: currentArtistScore + 1,
        },
        totalTimeListenedSeconds: prev.totalTimeListenedSeconds + track.duration,
      };
    });
  };

  const handleUploadTrack = (newTrackData: Omit<Track, 'id' | 'playCount'>) => {
    const createdTrack: Track = {
      ...newTrackData,
      id: `track-uploaded-${Date.now()}`,
      playCount: 0,
      earningsCount: 0,
    };
    setTracks((prev) => {
      const updated = [createdTrack, ...prev];
      const customOnly = updated.filter((t) => t.id.startsWith('track-uploaded-'));
      localStorage.setItem('monosound_uploaded_tracks', JSON.stringify(customOnly));
      return updated;
    });
  };

  const handleToggleSubscription = (activate: boolean) => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            isSubscribed: activate,
            subscriptionExpiresAt: activate ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
            dailyPlaysCount: activate ? 0 : prev.dailyPlaysCount,
            lastPlayDate: todayStr,
          }
        : null
    );
  };

  const handlePlayPause = () => {
    if (!currentTrack) {
      if (tracks.length > 0) playTrack(tracks[0]);
      return;
    }

    if (isPlaying) {
      globalAudioEngine.pause();
      setIsPlaying(false);
    } else {
      globalAudioEngine.resume();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(nextTrack);
    } else {
      const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
      const nextIdx = (currentIdx + 1) % tracks.length;
      playTrack(tracks[nextIdx]);
    }
  };

  const handlePrev = () => {
    if (currentTime > 3) {
      globalAudioEngine.seek(0);
      return;
    }
    const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIdx]);
  };

  const handleSeek = (secs: number) => {
    setCurrentTime(secs);
    globalAudioEngine.seek(secs);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
    globalAudioEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      globalAudioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      globalAudioEngine.setVolume(0);
    }
  };

  const handlePlayAll = (trackList: Track[], shuffle = false) => {
    let list = [...trackList];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    if (list.length > 0) {
      playTrack(list[0]);
      setQueue(list.slice(1));
    }
  };

  const handleToggleLike = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const nextLiked = !t.isLiked;
          let nextLikesCount = t.likesCount !== undefined ? t.likesCount : (t.isLiked ? 1 : 0);
          let nextDisliked = t.isDisliked;

          if (nextLiked) {
            nextLikesCount += 1;
            nextDisliked = false;
            setPreferenceProfile((p) => ({
              ...p,
              likedTrackIds: Array.from(new Set([...p.likedTrackIds, trackId])),
              dislikedTrackIds: (p.dislikedTrackIds || []).filter((id) => id !== trackId),
            }));
          } else {
            nextLikesCount = Math.max(0, nextLikesCount - 1);
            setPreferenceProfile((p) => ({
              ...p,
              likedTrackIds: p.likedTrackIds.filter((id) => id !== trackId),
            }));
          }
          return { ...t, isLiked: nextLiked, isDisliked: nextDisliked, likesCount: nextLikesCount };
        }
        return t;
      })
    );

    // Sync system 'Избранные треки' playlist
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === 'playlist-liked') {
          const isPresent = p.trackIds.includes(trackId);
          return {
            ...p,
            trackIds: isPresent
              ? p.trackIds.filter((id) => id !== trackId)
              : [...p.trackIds, trackId],
          };
        }
        return p;
      })
    );
  };

  const handleToggleDislike = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const nextDisliked = !t.isDisliked;
          let nextLikesCount = t.likesCount !== undefined ? t.likesCount : (t.isLiked ? 1 : 0);
          let nextLiked = t.isLiked;

          if (nextDisliked && t.isLiked) {
            nextLiked = false;
            nextLikesCount = Math.max(0, nextLikesCount - 1);
          }

          return {
            ...t,
            isDisliked: nextDisliked,
            isLiked: nextLiked,
            likesCount: nextLikesCount,
          };
        }
        return t;
      })
    );

    setPreferenceProfile((prev) => {
      const currentDisliked = prev.dislikedTrackIds || [];
      const isAlreadyDisliked = currentDisliked.includes(trackId);
      const newDisliked = isAlreadyDisliked
        ? currentDisliked.filter((id) => id !== trackId)
        : [...currentDisliked, trackId];
      const newLiked = prev.likedTrackIds.filter((id) => id !== trackId);

      return {
        ...prev,
        dislikedTrackIds: newDisliked,
        likedTrackIds: newLiked,
      };
    });

    // Remove from liked playlist if disliked
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === 'playlist-liked') {
          return {
            ...p,
            trackIds: p.trackIds.filter((id) => id !== trackId),
          };
        }
        return p;
      })
    );
  };

  const handleApproveTrack = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, moderationStatus: 'approved', rejectionReason: undefined } : t
      )
    );
  };

  const handleRejectTrack = (trackId: string, reason: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, moderationStatus: 'rejected', rejectionReason: reason } : t
      )
    );
  };

  const handleToggleDownload = async (track: Track) => {
    const isCurrentlyDownloaded = track.isDownloaded;

    if (isCurrentlyDownloaded) {
      await removeTrackOffline(track.id);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isDownloaded: false } : t))
      );
    } else {
      // Generate WAV Audio Blob for IndexedDB caching
      const audioBlob = await globalAudioEngine.generateWavBlob(track);
      await saveTrackOffline(track, audioBlob);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isDownloaded: true, downloadedAt: Date.now() } : t))
      );
    }
  };

  const handleCreatePlaylist = (newP: { title: string; description: string; trackIds: string[] }) => {
    const created: Playlist = {
      id: `playlist-${Date.now()}`,
      title: newP.title,
      description: newP.description,
      trackIds: newP.trackIds,
      createdAt: Date.now(),
      isCustom: true,
    };
    setPlaylists((prev) => [...prev, created]);
    setSelectedPlaylistId(created.id);
    setActiveTab('playlists');
  };

  const handleAddToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId && !p.trackIds.includes(trackId)) {
          return { ...p, trackIds: [...p.trackIds, trackId] };
        }
        return p;
      })
    );
  };

  const handleRemoveFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) };
        }
        return p;
      })
    );
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) setSelectedPlaylistId(null);
  };

  const handleClearOfflineCache = async () => {
    await clearAllOfflineData();
    setTracks((prev) => prev.map((t) => ({ ...t, isDownloaded: false })));
  };

  // Filter catalog by moderation status and dislikes
  const approvedTracks = tracks.filter((t) => t.moderationStatus === 'approved' || !t.moderationStatus);

  const publicTracks = approvedTracks.filter(
    (t) => !t.isDisliked && !(preferenceProfile.dislikedTrackIds || []).includes(t.id)
  );

  const visibleTracks = isOfflineMode ? publicTracks.filter((t) => t.isDownloaded) : publicTracks;
  const topRankedTracks = [...visibleTracks].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));

  const likedTracks = visibleTracks.filter((t) => t.isLiked);
  const downloadedCount = tracks.filter((t) => t.isDownloaded).length;

  const currentPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Top Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedPlaylistId(null);
            setActiveTab(tab);
          }}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={(id) => {
            setSelectedPlaylistId(id);
            setActiveTab('playlists');
          }}
          onCreatePlaylistClick={() => setIsCreateModalOpen(true)}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
          downloadedCount={downloadedCount}
          currentUser={currentUser}
        />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/40 overflow-hidden">
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onCreatePlaylistClick={() => setIsCreateModalOpen(true)}
            isOfflineMode={isOfflineMode}
            selectedPlaylistTitle={currentPlaylist?.title}
            downloadedCount={downloadedCount}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-6 space-y-8 max-w-7xl w-full mx-auto">
            {/* View Switching */}
            {selectedPlaylistId ? (
              <PlaylistsView
                playlists={playlists}
                selectedPlaylistId={selectedPlaylistId}
                onSelectPlaylist={setSelectedPlaylistId}
                allTracks={visibleTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayTrack={playTrack}
                onPlayAll={handlePlayAll}
                onToggleLike={handleToggleLike}
                onToggleDownload={handleToggleDownload}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onCreatePlaylistClick={() => setIsCreateModalOpen(true)}
              />
            ) : activeTab === 'home' ? (
              <div className="space-y-8">
                {/* Minimal Banner */}
                <div className="p-8 bg-black border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="space-y-3 z-10 max-w-xl">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-widest px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                      Монохромная Аудио Среда
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                      Минимализм. Звук. Автономия.
                    </h1>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Создавайте собственные плейлисты, скачивайте аудио для полного офлайн-доступа и получайте персональные AI-рекомендации без лишнего шума.
                    </p>
                    <div className="pt-2 flex items-center space-x-3">
                      <button
                        onClick={() => handlePlayAll(visibleTracks, true)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors shadow-md"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>Слушать случайный микс</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-28 h-28 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                    <Disc className="w-14 h-14 text-white animate-spin-slow" />
                  </div>
                </div>

                {/* Popularity Ranking (ТОП по лайкам) Chart */}
                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-amber-400 text-black rounded-lg">
                        <Trophy className="w-5 h-5 fill-black" />
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
                          <span>Чарт музыки (ТОП по лайкам)</span>
                          <span className="text-[10px] font-mono uppercase bg-zinc-900 text-amber-300 px-2 py-0.5 border border-zinc-800 rounded-full">
                            Рейтинг
                          </span>
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Композиции, которые пользователи чаще всего добавляют в избранное
                        </p>
                      </div>
                    </div>
                  </div>

                  <TrackList
                    tracks={topRankedTracks.slice(0, 10)}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    playlists={playlists}
                    onPlayTrack={playTrack}
                    onPlayAll={handlePlayAll}
                    onToggleLike={handleToggleLike}
                    onToggleDislike={handleToggleDislike}
                    onToggleDownload={handleToggleDownload}
                    onAddToPlaylist={handleAddToPlaylist}
                    showRankingBadge={true}
                  />
                </div>

                {/* Quick Recommendation Spotlight */}
                <div className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Персональный AI Микс</h3>
                      <p className="text-xs text-zinc-400">Сформирован на основе вашей истории и лайков</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
                  >
                    Открыть AI Рекомендации →
                  </button>
                </div>

                {/* Main Track List Feed */}
                <TrackList
                  tracks={visibleTracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playlists={playlists}
                  onPlayTrack={playTrack}
                  onPlayAll={handlePlayAll}
                  onToggleLike={handleToggleLike}
                  onToggleDislike={handleToggleDislike}
                  onToggleDownload={handleToggleDownload}
                  onAddToPlaylist={handleAddToPlaylist}
                  title="Все доступные треки"
                  subtitle={`${visibleTracks.length} композиций`}
                />
              </div>
            ) : activeTab === 'search' ? (
              <SearchView
                tracks={approvedTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                playlists={playlists}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onPlayTrack={playTrack}
                onPlayAll={handlePlayAll}
                onToggleLike={handleToggleLike}
                onToggleDislike={handleToggleDislike}
                onToggleDownload={handleToggleDownload}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ) : activeTab === 'playlists' ? (
              <PlaylistsView
                playlists={playlists}
                selectedPlaylistId={selectedPlaylistId}
                onSelectPlaylist={setSelectedPlaylistId}
                allTracks={visibleTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayTrack={playTrack}
                onPlayAll={handlePlayAll}
                onToggleLike={handleToggleLike}
                onToggleDownload={handleToggleDownload}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onCreatePlaylistClick={() => setIsCreateModalOpen(true)}
              />
            ) : activeTab === 'recommendations' ? (
              <RecommendationsView
                allTracks={visibleTracks}
                preferenceProfile={preferenceProfile}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                playlists={playlists}
                onPlayTrack={playTrack}
                onPlayAll={handlePlayAll}
                onToggleLike={handleToggleLike}
                onToggleDownload={handleToggleDownload}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ) : activeTab === 'earn' ? (
              <EarnView
                currentUser={currentUser}
                uploadedTracks={tracks}
                onUploadTrack={handleUploadTrack}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onPlayTrack={playTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            ) : activeTab === 'profile' ? (
              <ProfileView
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLogout={() => setCurrentUser(null)}
                onToggleSubscription={handleToggleSubscription}
                onNavigateToEarn={() => setActiveTab('earn')}
              />
            ) : activeTab === 'admin' ? (
              <AdminView
                tracks={tracks}
                onApproveTrack={handleApproveTrack}
                onRejectTrack={handleRejectTrack}
                onPlayTrack={playTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            ) : activeTab === 'offline' ? (
              <OfflineView
                tracks={tracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                playlists={playlists}
                isOfflineMode={isOfflineMode}
                onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
                onPlayTrack={playTrack}
                onPlayAll={handlePlayAll}
                onToggleLike={handleToggleLike}
                onToggleDownload={handleToggleDownload}
                onAddToPlaylist={handleAddToPlaylist}
                onClearOfflineCache={handleClearOfflineCache}
              />
            ) : activeTab === 'liked' ? (
              <TrackList
                tracks={likedTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                playlists={playlists}
                onPlayTrack={playTrack}
                onPlayAll={handlePlayAll}
                onToggleLike={handleToggleLike}
                onToggleDislike={handleToggleDislike}
                onToggleDownload={handleToggleDownload}
                onAddToPlaylist={handleAddToPlaylist}
                title={`Избранные треки (${likedTracks.length})`}
                subtitle="Коллекция отмеченных вами аудиокомпозиций"
              />
            ) : null}
          </main>
        </div>
      </div>

      {/* Persistent Bottom Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={() => {
          if (repeatMode === 'off') setRepeatMode('all');
          else if (repeatMode === 'all') setRepeatMode('one');
          else setRepeatMode('off');
        }}
        onToggleLike={handleToggleLike}
        onToggleDislike={handleToggleDislike}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        isQueueOpen={isQueueOpen}
      />

      {/* Queue Drawer */}
      {isQueueOpen && (
        <QueueDrawer
          queue={queue}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={playTrack}
          onRemoveFromQueue={(idx) => setQueue((prev) => prev.filter((_, i) => i !== idx))}
          onClearQueue={() => setQueue([])}
          onClose={() => setIsQueueOpen(false)}
        />
      )}

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <CreatePlaylistModal
          allTracks={tracks}
          onClose={() => setIsCreateModalOpen(false)}
          onCreatePlaylist={handleCreatePlaylist}
        />
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(u) => setCurrentUser(u)}
        />
      )}

      {/* Subscription Limit Modal */}
      {isSubscriptionLimitModalOpen && (
        <SubscriptionLimitModal
          onClose={() => setIsSubscriptionLimitModalOpen(false)}
          onActivateSubscription={() => {
            if (currentUser) {
              handleToggleSubscription(true);
            } else {
              setIsAuthModalOpen(true);
            }
          }}
        />
      )}
    </div>
  );
}
