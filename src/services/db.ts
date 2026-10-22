import { Profile, ContentItem, Message, MediaItem, AdminAccount, WebsiteSettings } from '../types';
import { INITIAL_PROFILE, INITIAL_CONTENT, INITIAL_SETTINGS } from '../data/initialData';

const DB_NAME = 'saifur_portfolio_db';
const DB_VERSION = 1;

class PersistentDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, will use localStorage fallback');
        return reject(new Error('IndexedDB not supported'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'filename' });
        }
        if (!db.objectStoreNames.contains('admin')) {
          db.createObjectStore('admin', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Generic store read
  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      // localStorage fallback
      const saved = localStorage.getItem(`sr_idb_${storeName}`);
      return saved ? JSON.parse(saved) : [];
    }
  }

  // Generic store write single item
  async put<T>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      // Fallback
      console.warn(`Fallback write to localStorage for ${storeName}`, e);
    }
  }

  // Generic store delete single item
  async delete(storeName: string, key: string | number): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`Fallback delete for ${storeName}`, e);
    }
  }

  // Initialize data with defaults if empty
  async initializeDatabase(): Promise<{
    profile: Profile;
    settings: WebsiteSettings;
    content: ContentItem[];
    messages: Message[];
    media: MediaItem[];
    admin: AdminAccount | null;
  }> {
    try {
      // Check profile
      const profiles = await this.getAll<Profile & { id: string }>('profile');
      let profile: Profile;
      if (profiles.length > 0) {
        profile = profiles[0];
      } else {
        profile = { ...INITIAL_PROFILE };
        await this.put('profile', { ...profile, id: 'main' });
      }

      // Check settings
      const settingsList = await this.getAll<WebsiteSettings & { id: string }>('settings');
      let settings: WebsiteSettings;
      if (settingsList.length > 0) {
        settings = settingsList[0];
      } else {
        settings = { ...INITIAL_SETTINGS };
        await this.put('settings', { ...settings, id: 'main' });
      }

      // Check content
      let content = await this.getAll<ContentItem>('content');
      if (content.length === 0) {
        content = [...INITIAL_CONTENT];
        for (const item of content) {
          await this.put('content', item);
        }
      }

      // Messages
      const messages = await this.getAll<Message>('messages');

      // Media
      const media = await this.getAll<MediaItem>('media');

      // Admin Account
      const adminList = await this.getAll<AdminAccount>('admin');
      const admin = adminList.length > 0 ? adminList[0] : null;

      return { profile, settings, content, messages, media, admin };
    } catch (err) {
      console.error('Error during DB init, using defaults', err);
      return {
        profile: INITIAL_PROFILE,
        settings: INITIAL_SETTINGS,
        content: INITIAL_CONTENT,
        messages: [],
        media: [],
        admin: null,
      };
    }
  }

  // Export full JSON database for backup
  async exportFullDatabase(): Promise<string> {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: (await this.getAll<Profile>('profile'))[0] || INITIAL_PROFILE,
      settings: (await this.getAll<WebsiteSettings>('settings'))[0] || INITIAL_SETTINGS,
      content: await this.getAll<ContentItem>('content'),
      messages: await this.getAll<Message>('messages'),
      media: await this.getAll<MediaItem>('media'),
    };
    return JSON.stringify(data, null, 2);
  }

  // Restore from JSON backup
  async restoreFromBackup(jsonData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.profile) {
        await this.put('profile', { ...parsed.profile, id: 'main' });
      }
      if (parsed.settings) {
        await this.put('settings', { ...parsed.settings, id: 'main' });
      }
      if (Array.isArray(parsed.content)) {
        for (const item of parsed.content) {
          await this.put('content', item);
        }
      }
      if (Array.isArray(parsed.media)) {
        for (const item of parsed.media) {
          await this.put('media', item);
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to restore from backup', e);
      return false;
    }
  }
}

export const dbService = new PersistentDB();
