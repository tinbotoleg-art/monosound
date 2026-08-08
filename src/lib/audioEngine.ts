import { Track } from '../types';
import { getTrackAudioBlob } from './offlineDb';

/**
 * ВАЖНО: воспроизведение идёт ТОЛЬКО через обычный <audio>-элемент,
 * без Web Audio API (AudioContext/AnalyserNode) в пути звука.
 *
 * Раньше звук пропускался через createMediaElementSource → AnalyserNode
 * (для визуализатора). Проблема: мобильные браузеры (и Android, и iOS)
 * агрессивно приостанавливают/глушат именно AudioContext, когда вкладка
 * свёрнута или экран заблокирован — обычный <audio>-элемент так не
 * трогают, ему официально разрешено играть в фоне и управляться с экрана
 * блокировки через navigator.mediaSession. Это и было причиной, почему
 * музыка замолкала в фоне/при блокировке и "заикалась" после паузы.
 *
 * Визуализатор при этом не ломается: getAnalyserData() ниже отдаёт
 * "пустые" данные, а AudioVisualizer.tsx уже умеет в этом случае рисовать
 * плавную псевдо-анимацию вместо реального спектра — визуально разница
 * почти незаметна, а стабильность фонового звука важнее.
 */
export class AudioEngine {
  private audioEl: HTMLAudioElement;
  private track: Track | null = null;
  private duration = 0;
  private synthesizedUrlCache = new Map<string, string>();
  private offlineBlobUrlCache = new Map<string, string>();

  private onTimeUpdateCb?: (currentTime: number, duration: number) => void;
  private onEndedCb?: () => void;
  private updateInterval: number | null = null;

  constructor() {
    this.audioEl = new Audio();
    this.audioEl.preload = 'auto';

    this.audioEl.addEventListener('ended', () => {
      this.stopProgressLoop();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      if (this.onEndedCb) this.onEndedCb();
    });

    // ВАЖНО: реальная длительность трека — это то, что сообщает сам
    // аудиофайл, а не то, что записано в базе (для загруженных треков
    // это могло быть случайное/неверное число). Как только браузер
    // прочитал метаданные файла, подменяем this.duration на настоящее
    // значение и сразу сообщаем об этом наружу — это и чинит бегунок,
    // который раньше мог доходить до конца раньше или позже трека.
    const handleRealDuration = () => {
      const real = this.audioEl.duration;
      if (isFinite(real) && real > 0 && Math.abs(real - this.duration) > 0.5) {
        this.duration = real;
        if (this.onTimeUpdateCb) {
          this.onTimeUpdateCb(this.audioEl.currentTime, this.duration);
        }
      }
    };
    this.audioEl.addEventListener('loadedmetadata', handleRealDuration);
    this.audioEl.addEventListener('durationchange', handleRealDuration);
  }

  public setVolume(volume: number) {
    this.audioEl.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Реального анализа спектра больше нет (см. комментарий выше) —
   * отдаём нулевой массив, AudioVisualizer сам подставит псевдо-анимацию.
   */
  public getAnalyserData(): Uint8Array {
    return new Uint8Array(32);
  }

  public async playTrack(track: Track, startOffset = 0): Promise<void> {
    this.track = track;
    this.duration = track.duration || 180;

    // Реальный загруженный файл (например, из Supabase Storage) стримится
    // напрямую по URL. Синтезированные демо-треки рендерятся в WAV один раз
    // и кэшируются по id трека, чтобы не пересчитывать их на каждый повтор.
    // Офлайн-первым: если трек скачан (лежит в IndexedDB), играем локальную
    // копию — это единственный способ, которым он реально проигрывается
    // без интернета. Иначе стримим по сети (audioUrl) или, для демо-треков
    // без файла, синтезируем на лету.
    const src = await this.getPlaybackSrc(track);

    if (this.audioEl.src !== src) {
      this.audioEl.src = src;
    }
    this.audioEl.currentTime = startOffset;

    try {
      await this.audioEl.play();
    } catch (err) {
      console.warn('[AudioEngine] play() blocked:', err);
    }

    this.updateMediaSessionMetadata(track);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';

    this.startProgressLoop();
  }

  public pause(): void {
    this.audioEl.pause();
    this.stopProgressLoop();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }

  public resume(): void {
    this.audioEl.play().catch((err) => console.warn('[AudioEngine] resume() blocked:', err));
    this.startProgressLoop();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  }

  public seek(seconds: number): void {
    const target = Math.max(0, Math.min(this.duration, seconds));
    this.audioEl.currentTime = target;
    if (this.onTimeUpdateCb) this.onTimeUpdateCb(target, this.duration);
  }

  public getCurrentTime(): number {
    return this.audioEl.currentTime || 0;
  }

  public getIsPlaying(): boolean {
    return !this.audioEl.paused && !this.audioEl.ended;
  }

  public setCallbacks(
    onTimeUpdate: (currentTime: number, duration: number) => void,
    onEnded: () => void
  ) {
    this.onTimeUpdateCb = onTimeUpdate;
    this.onEndedCb = onEnded;
  }

  /**
   * Подключает кнопки на экране блокировки / в шторке уведомлений
   * (play, pause, next, previous, перемотка) к обработчикам приложения.
   */
  public setMediaSessionHandlers(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (seconds: number) => void;
  }) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', handlers.onPlay);
    navigator.mediaSession.setActionHandler('pause', handlers.onPause);
    navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
    navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);

    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') handlers.onSeek(details.seekTime);
      });
    } catch {
      // seekto поддерживается не везде — не критично, остальные кнопки работают
    }
  }

  private updateMediaSessionMetadata(track: Track) {
    if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.coverUrl
        ? [
            { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });
  }

  private startProgressLoop() {
    this.stopProgressLoop();
    this.updateInterval = window.setInterval(() => {
      if (this.onTimeUpdateCb && !this.audioEl.paused) {
        this.onTimeUpdateCb(this.audioEl.currentTime, this.duration);
      }
    }, 200);
  }

  private stopProgressLoop() {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async getPlaybackSrc(track: Track): Promise<string> {
    const cachedOfflineUrl = this.offlineBlobUrlCache.get(track.id);
    if (cachedOfflineUrl) return cachedOfflineUrl;

    try {
      const offlineBlob = await getTrackAudioBlob(track.id);
      if (offlineBlob) {
        const url = URL.createObjectURL(offlineBlob);
        this.offlineBlobUrlCache.set(track.id, url);
        return url;
      }
    } catch {
      // Трек не скачан офлайн (или IndexedDB недоступна) — идём дальше
    }

    if (track.audioUrl) return track.audioUrl;
    return this.getOrCreateSynthesizedUrl(track);
  }

  private async getOrCreateSynthesizedUrl(track: Track): Promise<string> {
    const cached = this.synthesizedUrlCache.get(track.id);
    if (cached) return cached;
    const blob = await this.generateWavBlob(track);
    const url = URL.createObjectURL(blob);
    this.synthesizedUrlCache.set(track.id, url);
    return url;
  }

  /**
   * Генерирует процедурный AudioBuffer через OfflineAudioContext — это
   * отдельный, оффлайновый рендеринг (не связан с живым воспроизведением),
   * поэтому background-ограничения выше его не касаются.
   */
  public async generateProceduralBuffer(track: Track): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const duration = Math.min(track.duration || 180, 240);
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    const pattern = track.audioPattern || {
      tempo: 90,
      key: 'C',
      synthStyle: 'ambient_pad',
      notes: [261.63, 329.63, 392.00, 523.25]
    };

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.7, 0);
    masterGain.connect(offlineCtx.destination);

    // Filter node for warmth
    const filter = offlineCtx.createBiquadFilter();
    filter.type = pattern.synthStyle === 'synthwave_pulse' ? 'lowpass' : 'peaking';
    filter.frequency.setValueAtTime(1200, 0);
    filter.Q.setValueAtTime(1.5, 0);
    filter.connect(masterGain);

    const beatInterval = 60 / pattern.tempo;
    const notes = pattern.notes;

    // Build rhythmic pattern across the track duration
    let currentTime = 0;
    let noteIdx = 0;

    while (currentTime < duration) {
      const freq = notes[noteIdx % notes.length];
      const noteLength = beatInterval * (pattern.synthStyle === 'ambient_pad' ? 4 : 2);

      // Main Melody/Chord Oscillator
      const osc = offlineCtx.createOscillator();
      const oscGain = offlineCtx.createGain();

      if (pattern.synthStyle === 'synthwave_pulse') {
        osc.type = 'sawtooth';
      } else if (pattern.synthStyle === 'minimal_beat') {
        osc.type = 'square';
      } else if (pattern.synthStyle === 'piano_solo') {
        osc.type = 'triangle';
      } else {
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(freq, currentTime);

      // ADSR Envelope
      const attack = pattern.synthStyle === 'ambient_pad' ? 0.8 : 0.05;
      const decay = 0.3;
      const sustain = 0.4;
      const release = pattern.synthStyle === 'ambient_pad' ? 1.5 : 0.4;

      oscGain.gain.setValueAtTime(0, currentTime);
      oscGain.gain.linearRampToValueAtTime(0.25, currentTime + attack);
      oscGain.gain.exponentialRampToValueAtTime(sustain * 0.25, currentTime + attack + decay);
      oscGain.gain.setValueAtTime(sustain * 0.25, currentTime + noteLength - release);
      oscGain.gain.linearRampToValueAtTime(0.0001, currentTime + noteLength);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(currentTime);
      osc.stop(currentTime + noteLength);

      // Add sub-bass or rhythmic kick for beat styles
      if (pattern.synthStyle === 'minimal_beat' || pattern.synthStyle === 'synthwave_pulse' || pattern.synthStyle === 'lofi_chill') {
        if (Math.floor(currentTime / beatInterval) % 2 === 0) {
          const kickOsc = offlineCtx.createOscillator();
          const kickGain = offlineCtx.createGain();
          kickOsc.frequency.setValueAtTime(150, currentTime);
          kickOsc.frequency.exponentialRampToValueAtTime(30, currentTime + 0.15);

          kickGain.gain.setValueAtTime(0.5, currentTime);
          kickGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);

          kickOsc.connect(kickGain);
          kickGain.connect(masterGain);

          kickOsc.start(currentTime);
          kickOsc.stop(currentTime + 0.2);
        }
      }

      currentTime += noteLength * 0.85;
      noteIdx++;
    }

    return await offlineCtx.startRendering();
  }

  /**
   * Генерирует WAV audio blob для офлайн-кэша (IndexedDB) и для
   * проигрывания синтезированных демо-треков через <audio>.
   */
  public async generateWavBlob(track: Track): Promise<Blob> {
    const audioBuffer = await this.generateProceduralBuffer(track);
    return bufferToWav(audioBuffer);
  }
}

// WAV audio encoder utility
function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function writeUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  function writeUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  // WAV Header
  writeString('RIFF');
  writeUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  writeUint32(16);
  writeUint16(1); // PCM
  writeUint16(numOfChan);
  writeUint32(sampleRate);
  writeUint32(sampleRate * 2 * numOfChan);
  writeUint16(numOfChan * 2);
  writeUint16(16); // 16-bit
  writeString('data');
  writeUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

export const globalAudioEngine = new AudioEngine();
