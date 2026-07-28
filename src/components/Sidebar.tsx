import React from 'react';
import { 
  Home, 
  Search, 
  ListMusic, 
  Sparkles, 
  HardDriveDownload, 
  Heart, 
  Plus, 
  Wifi, 
  WifiOff, 
  Disc,
  Music2,
  Coins,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { ActiveTab, Playlist, User } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  onCreatePlaylistClick: () => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  downloadedCount: number;
  currentUser?: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onCreatePlaylistClick,
  isOfflineMode,
  onToggleOfflineMode,
  downloadedCount,
  currentUser,
}) => {
  const isAdminUser = currentUser?.email === 'tinbotoleg@gmail.com' && currentUser?.isAdmin;

  const mainNav = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'search', label: 'Поиск треков', icon: Search },
    { id: 'playlists', label: 'Плейлисты', icon: ListMusic },
    { id: 'recommendations', label: 'AI Рекомендации', icon: Sparkles },
    { id: 'earn', label: 'Заработать', icon: Coins, highlight: true },
    { id: 'profile', label: 'Профиль / Подписка', icon: UserIcon, badge: currentUser?.isSubscribed ? '59 ₽' : undefined },
    { id: 'offline', label: 'Офлайн Центр', icon: HardDriveDownload, badge: downloadedCount > 0 ? downloadedCount : undefined },
    { id: 'liked', label: 'Избранное', icon: Heart },
    ...(isAdminUser ? [{ id: 'admin', label: 'Модерация', icon: ShieldCheck, badge: 'Админ' }] : []),
  ];

  return (
    <aside className="w-64 bg-black border-r border-zinc-800/80 flex flex-col h-full select-none shrink-0">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-md bg-white text-black flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            <Disc className="w-5 h-5 animate-spin-slow text-black" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider text-white uppercase font-mono">
              MONO<span className="text-zinc-500 font-light">SOUND</span>
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-widest font-mono uppercase">
              Minimal Audio
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-4 space-y-1">
        <p className="px-3 text-[10px] uppercase font-mono font-semibold text-zinc-500 tracking-wider mb-2">
          Навигация
        </p>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !selectedPlaylistId;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectPlaylist('');
                setActiveTab(item.id as ActiveTab);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                  isActive ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Playlists Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 border-t border-zinc-900">
        <div className="flex items-center justify-between px-3">
          <p className="text-[10px] uppercase font-mono font-semibold text-zinc-500 tracking-wider">
            Плейлисты
          </p>
          <button
            onClick={onCreatePlaylistClick}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Создать плейлист"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1 pt-1">
          {playlists
            .filter(p => !p.isSystem)
            .map((playlist) => {
              const isSelected = selectedPlaylistId === playlist.id;
              return (
                <button
                  key={playlist.id}
                  onClick={() => onSelectPlaylist(playlist.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all flex items-center space-x-2.5 ${
                    isSelected
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  <span className="truncate">{playlist.title}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Offline Mode Toggle Bar */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80">
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg">
          <div className="flex items-center space-x-2.5">
            {isOfflineMode ? (
              <WifiOff className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 text-zinc-400" />
            )}
            <div>
              <p className="text-xs font-medium text-zinc-200">
                {isOfflineMode ? 'Офлайн режим' : 'В сети'}
              </p>
              <p className="text-[10px] text-zinc-500">
                {isOfflineMode ? 'Только скачанное' : 'Все возможности'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleOfflineMode}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOfflineMode ? 'bg-white' : 'bg-zinc-800'
            }`}
            title="Переключить офлайн-режим"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition duration-200 ease-in-out ${
                isOfflineMode ? 'translate-x-4 bg-black' : 'translate-x-0 bg-zinc-400'
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
};
