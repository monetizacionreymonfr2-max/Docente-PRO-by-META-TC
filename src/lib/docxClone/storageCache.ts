/**
 * Cache binario en IndexedDB para archivos .docx originales
 * Garantiza que la copia exacta funcione de inmediato y de forma resiliente
 */

const DB_NAME = 'DocentyDocxCache';
const STORE_NAME = 'archivos_originales';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no disponible'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function guardarArchivoEnCache(path: string, file: File | Blob | ArrayBuffer): Promise<void> {
  try {
    const db = await openDB();
    const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(arrayBuffer, path);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Fallo al guardar en IndexedDB cache:', e);
  }
}

export async function obtenerArchivoDeCache(path: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(path);

      req.onsuccess = () => {
        if (req.result instanceof ArrayBuffer) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
