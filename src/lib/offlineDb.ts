import { Track } from '../types';

const DB_NAME = 'MonoSoundOfflineStore';
const DB_VERSION = 1;
const TRACKS_STORE = 'downloaded_tracks';
const BLOB_STORE = 'audio_blobs';

export interface DownloadedTrackRecord {
  track: Track;
  audioBlob?: Blob;
  downloadedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE, { keyPath: 'track.id' });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
      }
    };
  });
}

export async function saveTrackOffline(track: Track, audioBlob?: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRACKS_STORE, BLOB_STORE], 'readwrite');
    const tracksStore = tx.objectStore(TRACKS_STORE);
    const blobStore = tx.objectStore(BLOB_STORE);

    const record: DownloadedTrackRecord = {
      track: { ...track, isDownloaded: true, downloadedAt: Date.now() },
      downloadedAt: Date.now(),
    };

    tracksStore.put(record);

    if (audioBlob) {
      blobStore.put(audioBlob, track.id);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeTrackOffline(trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRACKS_STORE, BLOB_STORE], 'readwrite');
    const tracksStore = tx.objectStore(TRACKS_STORE);
    const blobStore = tx.objectStore(BLOB_STORE);

    tracksStore.delete(trackId);
    blobStore.delete(trackId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDownloadedTracks(): Promise<DownloadedTrackRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRACKS_STORE], 'readonly');
    const store = tx.objectStore(TRACKS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getTrackAudioBlob(trackId: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([BLOB_STORE], 'readonly');
    const store = tx.objectStore(BLOB_STORE);
    const request = store.get(trackId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRACKS_STORE, BLOB_STORE], 'readwrite');
    tx.objectStore(TRACKS_STORE).clear();
    tx.objectStore(BLOB_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
