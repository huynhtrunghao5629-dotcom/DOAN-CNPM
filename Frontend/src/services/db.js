import { openDB } from 'idb';

const DB_NAME = 'HueTourismDB';
const DB_VERSION = 1;
const STORE_NAME = 'pois_by_lang';

// Khởi tạo IndexedDB lưu trữ ngoại tuyến
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_lang', 'lang');
      }
    },
  });
}

// Lưu danh sách POI vào IndexedDB
export async function saveOfflinePOIs(pois, lang = 'vi') {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const existing = await tx.store.getAll();
  for (const item of existing) {
    if (item.lang === lang) await tx.store.delete(item.id);
  }
  for (const poi of pois) {
    await tx.store.put({ ...poi, lang });
  }
  await tx.done;
}

// Lấy danh sách POI khi mất kết nối mạng
export async function getOfflinePOIs(lang = 'vi') {
  const db = await initDB();
  const allPois = await db.getAll(STORE_NAME);
  const filtered = allPois.filter(p => p.lang === lang);
  return filtered.length > 0 ? filtered : allPois;
}