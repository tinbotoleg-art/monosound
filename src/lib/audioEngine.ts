import { Track } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private duration = 0;
  private track: Track | null = null;
  private activeBuffer: AudioBuffer | null = null;

  private onTimeUpdateCb?: (currentTime: number, duration: number) => void;
  private onEndedCb?: () => void;
  private updateInterval: number | null = null;

  constructor() {}

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      this.ctx = new AudioContextClass();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.ctx.currentTime
      );
    }
  }

  public getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Loads and decodes a real audio file into an AudioBuffer.
   * Caches the result in this.activeBuffer so resume/seek
   * don't trigger a second network request.
   */
  private async loadBuffer(track: Track): Promise<void> {
    if (!this.ctx) return;

    if (track.audioUrl) {
      console.log('[AudioEngine] Loading real audio:', track.audioUrl);

      const response = await fetch(track.audioUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch audio: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      this.activeBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.duration = this.activeBuffer.duration;

      console.log(
        '[AudioEngine] Real audio loaded:',
        this.duration,
        'seconds'
      );
    } else {
      console.log('[AudioEngine] No audioUrl — using procedural audio.');
      this.duration = track.duration || 180;
      this.activeBuffer = await this.generateProceduralBuffer(track);
    }
  }

  /**
   * Starts playback from this.activeBuffer at the given offset.
   * Assumes this.activeBuffer, this.ctx and this.gainNode are ready.
   */
  private playFromBuffer(offset: number): void {
    if (!this.ctx || !this.gainNode || !this.activeBuffer) return;

    this.stopCurrent();

    const safeOffset = Math.min(
      Math.max(0, offset),
      Math.max(0, this.duration - 0.01)
    );

    this.pauseOffset = safeOffset;

    this.currentSourceNode = this.ctx.createBufferSource();
    this.currentSourceNode.buffer = this.activeBuffer;
    this.currentSourceNode.connect(this.gainNode);

    this.currentSourceNode.onended = () => {
      if (this.isPlaying && this.getCurrentTime() >= this.duration - 0.5) {
        this.isPlaying = false;
        this.stopProgressLoop();
        if (this.onEndedCb) this.onEndedCb();
      }
    };

    this.startTime = this.ctx.currentTime - safeOffset;
    this.currentSourceNode.start(0, safeOffset);
    this.isPlaying = true;
    this.startProgressLoop();
  }

  /**
   * Plays a track.
   * - If the same track is already buffered, reuses the buffer (no re-fetch).
   * - If it's a new track, loads the file (or generates procedural audio).
   * - Falls back to procedural audio if the real file fails to load.
   */
  public async playTrack(track: Track, startOffset = 0): Promise<void> {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;

    const isSameTrack = this.track?.id === track.id;

    this.track = track;
    this.pauseOffset = Math.max(0, startOffset);

    try {
      // Only fetch/generate the buffer when the track actually changes
      if (!isSameTrack || !this.activeBuffer) {
        await this.loadBuffer(track);
      }

      this.playFromBuffer(this.pauseOffset);
    } catch (error) {
      console.error('[AudioEngine] Failed to load real audio:', error);
      console.warn('[AudioEngine] Falling back to procedural audio.');

      try {
        this.duration = track.duration || 180;
        this.activeBuffer = await this.generateProceduralBuffer(track);
        this.playFromBuffer(this.pauseOffset);
      } catch (fallbackError) {
        console.error('[AudioEngine] Procedural fallback failed:', fallbackError);
        this.isPlaying = false;
        this.stopProgressLoop();
      }
    }
  }

  public pause(): void {
    if (!this.isPlaying || !this.ctx) return;
    this.pauseOffset = this.getCurrentTime();
    this.stopCurrent();
    this.isPlaying = false;
    this.stopProgressLoop();
  }

  /**
   * Resumes playback reusing the cached buffer — no network request.
   */
  public resume(): void {
    if (!this.track || this.isPlaying) return;

    if (this.activeBuffer && this.ctx && this.gainNode) {
      this.playFromBuffer(this.pauseOffset);
    } else {
      void this.playTrack(this.track, this.pauseOffset);
    }
  }

  /**
   * Seeks to a position reusing the cached buffer — no network request.
   */
  public seek(seconds: number): void {
    const target = Math.max(0, Math.min(this.duration, seconds));

    if (!this.track) return;

    this.pauseOffset = target;

    if (this.isPlaying && this.activeBuffer && this.ctx && this.gainNode) {
      this.playFromBuffer(target);
    } else if (!this.isPlaying && this.onTimeUpdateCb) {
      this.onTimeUpdateCb(target, this.duration);
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    return Math.min(this.duration, this.ctx.currentTime - this.startTime);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setCallbacks(
    onTimeUpdate: (currentTime: number, duration: number) => void,
    onEnded: () => void
  ) {
    this.onTimeUpdateCb = onTimeUpdate;
    this.onEndedCb = onEnded;
  }

  private stopCurrent(): void {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {
        // already stopped
      }
      this.currentSourceNode = null;
    }
  }

  private startProgressLoop() {
    this.stopProgressLoop();
    this.updateInterval = window.setInterval(() => {
      if (this.onTimeUpdateCb && this.isPlaying) {
        this.onTimeUpdateCb(this.getCurrentTime(), this.duration);
      }
    }, 200);
  }

  private stopProgressLoop() {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public async generateProceduralBuffer(track: Track): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const duration = Math.min(track.duration || 180, 240);
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    const pattern = track.audioPattern || {
      tempo: 90,
      key: 'C',
      synthStyle: 'ambient_pad' as const,
      notes: [261.63, 329.63, 392.0, 523.25],
    };

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.7, 0);
    masterGain.connect(offlineCtx.destination);

    const filter = offlineCtx.createBiquadFilter();
    filter.type = pattern.synthStyle === 'synthwave_pulse' ? 'lowpass' : 'peaking';
    filter.frequency.setValueAtTime(1200, 0);
    filter.Q.setValueAtTime(1.5, 0);
    filter.connect(masterGain);

    const beatInterval = 60 / pattern.tempo;
    const notes = pattern.notes;

    let currentTime = 0;
    let noteIdx = 0;

    while (currentTime < duration) {
      const freq = notes[noteIdx % notes.length];
      const noteLength = beatInterval * (pattern.synthStyle === 'ambient_pad' ? 4 : 2);

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

      if (
        pattern.synthStyle === 'minimal_beat' ||
        pattern.synthStyle === 'synthwave_pulse' ||
        pattern.synthStyle === 'lofi_chill'
      ) {
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

  public async generateWavBlob(track: Track): Promise<Blob> {
    const audioBuffer = await this.generateProceduralBuffer(track);
    return bufferToWav(audioBuffer);
  }
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
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

  writeString('RIFF');
  writeUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  writeUint32(16);
  writeUint16(1);
  writeUint16(numOfChan);
  writeUint32(sampleRate);
  writeUint32(sampleRate * 2 * numOfChan);
  writeUint16(numOfChan * 2);
  writeUint16(16);
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