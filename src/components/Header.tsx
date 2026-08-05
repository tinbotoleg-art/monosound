import React from 'react';
import { Search, Plus, Sparkles, WifiOff, HardDriveDownload, User as UserIcon, Coins, Menu } from 'lucide-react';
import { ActiveTab, User } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onCreatePlaylistClick: () => void;
  isOfflineMode: boolean;
  selectedPlaylistTitle?: string;
  downloadedCount: number;
  currentUser?: User | null;
  onOpenAuth: () => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  onCreatePlaylistClick,
  isOfflineMode,
  selectedPlaylistTitle,
  downloadedCount,
  currentUser,
  onOpenAuth,
  onOpenSidebar,
}) => {
  const getTabTitle = () => {
    if (selectedPlaylistTitle) return selectedPlaylistTitle;
    switch (activeTab) {
      case 'home': return 'Обзор музыки';
      case 'search': return 'Поиск по трекам и артистам';
      case 'playlists': return 'Плейлисты';
      case 'recommendations': return 'AI Рекомендации и аналитика';
      case 'earn': return 'Кабинет автора и монетизация';
      case 'profile': return 'Профиль и Подписка';
      case 'offline': return 'Офлайн Хранилище';
      case 'liked': return 'Избранные треки';
      default: return 'MonoSound';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 gap-2">
      {/* Mobile menu button + Title / Breadcrumb */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 -ml-1 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors shrink-0"
          title="Меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-xs sm:text-base font-semibold text-white tracking-tight truncate">
          {getTabTitle()}
        </h2>
        {isOfflineMode && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono bg-white text-black font-semibold rounded-full shrink-0">
            <WifiOff className="w-3 h-3 mr-1" />
            Офлайн
          </span>
        )}
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-md mx-1 sm:mx-6 min-w-0">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'search' && e.target.value.trim() !== '') {
                setActiveTab('search');
              }
            }}
            placeholder="Поиск треков и артистов..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button
          onClick={() => setActiveTab('earn')}
          className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Coins className="w-3.5 h-3.5 text-white" />
          <span>Заработать</span>
        </button>

        {currentUser ? (
          <button
            onClick={() => setActiveTab('profile')}
            className="inline-flex items-center space-x-2 px-2 sm:px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
            {currentUser.isSubscribed && (
              <span className="hidden sm:inline px-1.5 py-0.2 bg-white text-black font-mono font-bold text-[9px] rounded-full">
                50 ⭐
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Войти</span>
          </button>
        )}
      </div>
    </header>
  );
};
