// ── Async State Persistence (IndexedDB with In-Memory Cache) ──────────────────
// Offloads high-frequency keystroke / draft writes off the main UI rendering thread

const DB_NAME = 'nexus_exam_storage';
const STORE_NAME = 'exam_drafts';
const DB_VERSION = 1;

let dbPromise = null;
const memoryFallback = new Map();

function getDB() {
  if (dbPromise) return dbPromise;

  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export const asyncSetItem = async (key, value) => {
  memoryFallback.set(key, value);
  try {
    const db = await getDB();
    if (!db) {
      // Fallback: asynchronous microtask for localStorage
      queueMicrotask(() => {
        try {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        } catch {}
      });
      return;
    }

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
  } catch (err) {
    console.warn('[AsyncStorage] Write error:', err);
  }
};

export const asyncGetItem = async (key) => {
  if (memoryFallback.has(key)) {
    return memoryFallback.get(key);
  }

  try {
    const db = await getDB();
    if (!db) {
      const raw = localStorage.getItem(key);
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const val = req.result !== undefined ? req.result : localStorage.getItem(key);
        memoryFallback.set(key, val);
        resolve(val);
      };

      req.onerror = () => {
        const val = localStorage.getItem(key);
        resolve(val);
      };
    });
  } catch {
    return localStorage.getItem(key);
  }
};

export const asyncRemoveItem = async (key) => {
  memoryFallback.delete(key);
  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    }
    localStorage.removeItem(key);
  } catch {}
};
