export type Genre = 
  | 'Ambient'
  | 'Minimal Techno'
  | 'Lo-Fi'
  | 'Synthwave'
  | 'Classical Piano'
  | 'Post-Rock'
  | 'Jazz Noir'
  | 'Deep House';

export interface User {
  id: string;
  email: string;
  name: string;
  isSubscribed: boolean;
  subscriptionExpiresAt: number | null; // timestamp
  dailyPlaysCount: number;
  lastPlayDate: string; // YYYY-MM-DD
  artistEarnings: number; // RUB
  isAdmin?: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  genre: Genre;
  year: number;
  coverUrl: string;
  audioUrl?: string; // External audio URL or synthesized sound blueprint
  audioPattern?: {
    tempo: number; // BPM
    key: string;
    synthStyle: 'ambient_pad' | 'lofi_chill' | 'synthwave_pulse' | 'piano_solo' | 'minimal_beat' | 'jazz_chords';
    notes: number[];
  };
  isLiked?: boolean;
  isDisliked?: boolean;
  likesCount?: number;
  isDownloaded?: boolean;
  downloadedAt?: number; // timestamp
  playCount: number;
  lastPlayedAt?: number;
  lyrics?: string;
  uploadedBy?: string; // User email or ID
  earningsCount?: number; // Accumulated RUB from plays
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  isCustom: boolean;
  isSystem?: boolean;
}

export interface PreferenceProfile {
  likedTrackIds: string[];
  dislikedTrackIds: string[];
  history: Array<{
    trackId: string;
    timestamp: number;
    durationListenedSeconds: number;
  }>;
  favoriteGenres: Record<Genre, number>; // score per genre
  favoriteArtists: Record<string, number>; // score per artist
  totalTimeListenedSeconds: number;
}

export interface RecommendationReason {
  trackId: string;
  reason: string;
  score: number;
  matchScore: number;
  // 'similar_user' = похожие пользователи (70-100% совпадение по трекам)
  category: 'like_based' | 'genre_match' | 'artist_affinity' | 'similar_user' | 'discovery';
}

export type ActiveTab = 'home' | 'search' | 'playlists' | 'playlist-detail' | 'recommendations' | 'offline' | 'liked' | 'earn' | 'profile' | 'admin';
