const DB = "iam-tapes";
const STORE = "blobs";
const VERSION = 1;

export type TapeRecord = {
  id: string;
  name: string;
  mime: string;
  blob: Blob;
  at: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putTape(id: string, blob: Blob, name: string) {
  const db = await openDb();
  const rec: TapeRecord = {
    id,
    name,
    mime: blob.type || "audio/webm",
    blob,
    at: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return rec;
}

export async function getTape(id: string): Promise<TapeRecord | null> {
  const db = await openDb();
  const rec = await new Promise<TapeRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as TapeRecord | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rec;
}

const urls = new Map<string, string>();

export async function tapeUrl(id: string): Promise<string | null> {
  const hit = urls.get(id);
  if (hit) return hit;
  const rec = await getTape(id);
  if (!rec) return null;
  const url = URL.createObjectURL(rec.blob);
  urls.set(id, url);
  return url;
}

export function revokeTape(id: string) {
  const url = urls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(id);
  }
}

export function newTapeId() {
  return `tape-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
