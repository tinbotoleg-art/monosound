import { Track, Playlist } from '../types';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Monochrome Resonance',
    artist: 'Noir Soundscape',
    album: 'Shadows & Light',
    duration: 184,
    genre: 'Ambient',
    year: 2024,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 75,
      key: 'Am',
      synthStyle: 'ambient_pad',
      notes: [220, 261.63, 329.63, 392.00, 440.00, 523.25]
    },
    playCount: 42,
    likesCount: 128,
    isLiked: true,
    moderationStatus: 'approved',
    lyrics: 'Silent reflections in black and white\nWhispers in the quiet night\nWaves of sound, pure and clean\nIn the space between...'
  },
  {
    id: 'track-2',
    title: 'Midnight Transmission',
    artist: 'KRAFT & PULSE',
    album: 'Zero Signals',
    duration: 210,
    genre: 'Minimal Techno',
    year: 2025,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 124,
      key: 'Cm',
      synthStyle: 'minimal_beat',
      notes: [130.81, 155.56, 196.00, 261.63]
    },
    playCount: 88,
    likesCount: 95,
    isLiked: false,
    moderationStatus: 'approved',
    lyrics: '4 by 4 rhythm line\nSynthesizer in digital time\nPulse beat moving through the wire...'
  },
  {
    id: 'track-3',
    title: 'Coffee in Berlin',
    artist: 'Lo-Fi Monochrome',
    album: 'Rainy Sidewalks',
    duration: 156,
    genre: 'Lo-Fi',
    year: 2023,
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 82,
      key: 'Fm7',
      synthStyle: 'lofi_chill',
      notes: [174.61, 207.65, 261.63, 311.13]
    },
    playCount: 115,
    likesCount: 210,
    isLiked: true,
    moderationStatus: 'approved'
  },
  {
    id: 'track-4',
    title: 'Oblique Strategies',
    artist: 'Brian Mono',
    album: 'Minimal Structures',
    duration: 245,
    genre: 'Ambient',
    year: 2022,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 60,
      key: 'Cmaj7',
      synthStyle: 'ambient_pad',
      notes: [261.63, 329.63, 392.00, 493.88]
    },
    playCount: 19,
    likesCount: 14,
    isLiked: false,
    moderationStatus: 'approved'
  },
  {
    id: 'track-5',
    title: 'Neon Monochrome',
    artist: 'Synth Noir',
    album: 'Dark Wave 2088',
    duration: 198,
    genre: 'Synthwave',
    year: 2024,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 118,
      key: 'Dm',
      synthStyle: 'synthwave_pulse',
      notes: [146.83, 174.61, 220.00, 293.66, 349.23]
    },
    playCount: 76,
    likesCount: 175,
    isLiked: true,
    moderationStatus: 'approved'
  },
  {
    id: 'track-6',
    title: 'Nocturne No. 1 in C Minor',
    artist: 'Elena Vance',
    album: 'Solitude on Keys',
    duration: 228,
    genre: 'Classical Piano',
    year: 2023,
    coverUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 68,
      key: 'Cm',
      synthStyle: 'piano_solo',
      notes: [261.63, 311.13, 392.00, 523.25, 622.25]
    },
    playCount: 64,
    likesCount: 82,
    isLiked: false,
    moderationStatus: 'approved'
  },
  {
    id: 'track-7',
    title: 'Distant Horizon',
    artist: 'Noir Soundscape',
    album: 'Shadows & Light',
    duration: 215,
    genre: 'Post-Rock',
    year: 2024,
    coverUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 95,
      key: 'Em',
      synthStyle: 'ambient_pad',
      notes: [164.81, 196.00, 246.94, 329.63]
    },
    playCount: 31,
    likesCount: 45,
    isLiked: false,
    moderationStatus: 'approved'
  },
  {
    id: 'track-8',
    title: 'Smoke & Velvet',
    artist: 'The Monochrome Trio',
    album: 'Late Night Sessions',
    duration: 202,
    genre: 'Jazz Noir',
    year: 2021,
    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 78,
      key: 'Bb7',
      synthStyle: 'jazz_chords',
      notes: [233.08, 293.66, 349.23, 415.30]
    },
    playCount: 93,
    likesCount: 160,
    isLiked: true,
    moderationStatus: 'approved'
  },
  {
    id: 'track-9',
    title: 'Binary Rain',
    artist: 'KRAFT & PULSE',
    album: 'Zero Signals',
    duration: 189,
    genre: 'Deep House',
    year: 2025,
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 122,
      key: 'Gm',
      synthStyle: 'minimal_beat',
      notes: [196.00, 233.08, 293.66, 392.00]
    },
    playCount: 52,
    likesCount: 61,
    isLiked: false,
    moderationStatus: 'approved'
  },
  {
    id: 'track-10',
    title: 'Paper Planes & Vinyl',
    artist: 'Lo-Fi Monochrome',
    album: 'Rainy Sidewalks',
    duration: 167,
    genre: 'Lo-Fi',
    year: 2023,
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=80',
    audioPattern: {
      tempo: 84,
      key: 'Cmaj7',
      synthStyle: 'lofi_chill',
      notes: [261.63, 329.63, 392.00, 493.88]
    },
    playCount: 140,
    likesCount: 310,
    isLiked: true,
    moderationStatus: 'approved'
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-liked',
    title: 'Избранные треки',
    description: 'Коллекция любимой музыки',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    trackIds: ['track-1', 'track-3', 'track-5', 'track-8', 'track-10'],
    createdAt: Date.now() - 86400000 * 10,
    isCustom: false,
    isSystem: true
  },
  {
    id: 'playlist-focus',
    title: 'Глубокая Концентрация',
    description: 'Минималистичные эмбиент и лоу-фай ритмы для работы и учебы',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    trackIds: ['track-1', 'track-3', 'track-4', 'track-10'],
    createdAt: Date.now() - 86400000 * 5,
    isCustom: true
  },
  {
    id: 'playlist-night',
    title: 'Ночной Вайб',
    description: 'Синтвейв и минимал техно для поздних часов',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    trackIds: ['track-2', 'track-5', 'track-8', 'track-9'],
    createdAt: Date.now() - 86400000 * 2,
    isCustom: true
  }
];
