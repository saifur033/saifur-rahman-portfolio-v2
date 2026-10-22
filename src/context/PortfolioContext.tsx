import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Profile,
  ContentItem,
  Message,
  MediaItem,
  AdminAccount,
  ContentKind,
  WebsiteSettings,
} from '../types';
import { INITIAL_PROFILE, INITIAL_CONTENT, INITIAL_SETTINGS } from '../data/initialData';
import { dbService } from '../services/db';
import {
  hashPassword,
  generateSalt,
  generateRecoveryToken,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../services/security';

interface PortfolioContextType {
  profile: Profile;
  settings: WebsiteSettings;
  content: ContentItem[];
  messages: Message[];
  media: MediaItem[];
  adminAccount: AdminAccount | null;
  currentAdmin: { id: number; email: string } | null;
  shortlist: string[];
  theme: 'light' | 'dark';
  lang: 'en' | 'bn';
  isServerSyncing: boolean;
  toggleTheme: () => void;
  toggleLang: () => void;
  toggleShortlist: (key: string, title?: string) => boolean;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  updateSettings: (settings: Partial<WebsiteSettings>) => Promise<void>;
  createContentItem: (item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>) => Promise<ContentItem>;
  updateContentItem: (id: number, item: Partial<ContentItem>) => Promise<void>;
  deleteContentItem: (id: number) => Promise<void>;
  createMessage: (name: string, email: string, body: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  markMessageRead: (id: number) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
  createMediaItem: (file: File, isPrivate?: boolean, contentId?: number | null) => Promise<MediaItem>;
  deleteMediaItem: (filename: string) => Promise<void>;
  setupAdmin: (
    email: string,
    passwordPlain: string,
    recoveryQuestion: string,
    recoveryAnswerPlain: string
  ) => Promise<{ ok: boolean; recoveryToken?: string; error?: string }>;
  loginAdmin: (email: string, passwordPlain: string) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (
    currentPasswordPlain: string,
    newPasswordPlain: string
  ) => Promise<{ ok: boolean; error?: string }>;
  recoverPassword: (
    email: string,
    answerOrToken: string,
    newPasswordPlain: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => void;
  getItems: (kind: ContentKind, publishedOnly?: boolean) => ContentItem[];
  exportDatabase: () => Promise<string>;
  restoreDatabase: (jsonData: string) => Promise<boolean>;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('sr_admin_session_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem('sr_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PROFILE;
  });

  const [settings, setSettings] = useState<WebsiteSettings>(() => {
    try {
      const saved = localStorage.getItem('sr_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SETTINGS;
  });

  const [content, setContent] = useState<ContentItem[]>(() => {
    try {
      const saved = localStorage.getItem('sr_content');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CONTENT;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('sr_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [media, setMedia] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('sr_media');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(() => {
    try {
      const saved = localStorage.getItem('sr_admin_account');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [currentAdmin, setCurrentAdmin] = useState<{ id: number; email: string } | null>(() => {
    try {
      const saved = sessionStorage.getItem('sr_current_admin');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sr-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return profile.theme || settings.default_theme || 'dark';
  });

  const [lang, setLang] = useState<'en' | 'bn'>(() => {
    return settings.default_language || 'en';
  });

  const [isServerSyncing, setIsServerSyncing] = useState<boolean>(true);

  const [shortlist, setShortlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sr-shortlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((item: any) => item.key || item);
      }
    } catch (e) {}
    return [];
  });

  // 1. Initial Load: Sync public portfolio from shared server API (/api/portfolio)
  useEffect(() => {
    async function syncFromServer() {
      setIsServerSyncing(true);
      try {
        const response = await fetch('/api/portfolio');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfile(data.profile);
            localStorage.setItem('sr_profile', JSON.stringify(data.profile));
            await dbService.put('profile', { ...data.profile, id: 'main' });
          }
          if (data.settings) {
            setSettings(data.settings);
            localStorage.setItem('sr_settings', JSON.stringify(data.settings));
            await dbService.put('settings', { ...data.settings, id: 'main' });
          }
          if (Array.isArray(data.content) && data.content.length > 0) {
            setContent(data.content);
            localStorage.setItem('sr_content', JSON.stringify(data.content));
            for (const item of data.content) {
              await dbService.put('content', item);
            }
          }
          if (Array.isArray(data.media)) {
            setMedia(data.media);
            localStorage.setItem('sr_media', JSON.stringify(data.media));
          }
          if (data.hasAdmin) {
            setAdminAccount((prev) => prev || ({ id: 1, email: 'admin' } as any));
          }
        }

        // Check if there is an active admin session token
        const savedToken = sessionStorage.getItem('sr_admin_session_token');
        if (savedToken) {
          try {
            const vRes = await fetch('/api/admin/verify-session', {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            if (vRes.ok) {
              const vData = await vRes.json();
              if (vData.admin) {
                setCurrentAdmin(vData.admin);
                sessionStorage.setItem('sr_current_admin', JSON.stringify(vData.admin));
                // Fetch private admin messages
                const mRes = await fetch('/api/messages', {
                  headers: { Authorization: `Bearer ${savedToken}` },
                });
                if (mRes.ok) {
                  const mData = await mRes.json();
                  if (Array.isArray(mData.messages)) {
                    setMessages(mData.messages);
                    localStorage.setItem('sr_messages', JSON.stringify(mData.messages));
                  }
                }
              }
            } else {
              sessionStorage.removeItem('sr_admin_session_token');
              sessionStorage.removeItem('sr_current_admin');
              setCurrentAdmin(null);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Server sync failed, falling back to IndexedDB/local state', err);
        dbService.initializeDatabase().then((localData) => {
          if (localData.profile) setProfile(localData.profile);
          if (localData.settings) setSettings(localData.settings);
          if (localData.content.length > 0) setContent(localData.content);
          if (localData.media.length > 0) setMedia(localData.media);
          if (localData.messages.length > 0) setMessages(localData.messages);
          if (localData.admin) setAdminAccount(localData.admin);
        });
      } finally {
        setIsServerSyncing(false);
      }
    }

    syncFromServer();
  }, []);

  // Sync theme
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('sr-theme', theme);
    } catch (e) {}
  }, [theme]);

  // Sync SEO Title & Meta Description to document head
  useEffect(() => {
    if (settings.site_title) {
      document.title = settings.site_title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && settings.meta_description) {
      metaDesc.setAttribute('content', settings.meta_description);
    }
  }, [settings]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const toggleShortlist = (key: string, title?: string): boolean => {
    const exists = shortlist.includes(key);
    const next = exists ? shortlist.filter((k) => k !== key) : [...shortlist, key];
    setShortlist(next);
    try {
      const savedFormat = next.map((k) => ({ key: k, title: title || k }));
      localStorage.setItem('sr-shortlist', JSON.stringify(savedFormat));
    } catch (e) {}
    return !exists;
  };

  const updateProfile = async (updated: Partial<Profile>) => {
    const next = { ...profile, ...updated };
    setProfile(next);
    localStorage.setItem('sr_profile', JSON.stringify(next));
    await dbService.put('profile', { ...next, id: 'main' });

    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(next),
      });
    } catch (e) {
      console.warn('Server sync failed for updateProfile', e);
    }
  };

  const updateSettings = async (updated: Partial<WebsiteSettings>) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    localStorage.setItem('sr_settings', JSON.stringify(next));
    await dbService.put('settings', { ...next, id: 'main' });

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(next),
      });
    } catch (e) {
      console.warn('Server sync failed for updateSettings', e);
    }
  };

  const createContentItem = async (
    newItem: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ContentItem> => {
    const nextId = content.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const now = new Date().toISOString();
    let item: ContentItem = {
      ...newItem,
      id: nextId,
      created_at: now,
      updated_at: now,
    };

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) item = data.item;
      }
    } catch (e) {
      console.warn('Server sync failed for createContentItem, using local', e);
    }

    const next = [item, ...content];
    setContent(next);
    localStorage.setItem('sr_content', JSON.stringify(next));
    await dbService.put('content', item);
    return item;
  };

  const updateContentItem = async (id: number, updated: Partial<ContentItem>) => {
    const now = new Date().toISOString();
    const next = content.map((item) =>
      item.id === id ? { ...item, ...updated, updated_at: now } : item
    );
    setContent(next);
    localStorage.setItem('sr_content', JSON.stringify(next));
    const target = next.find((item) => item.id === id);
    if (target) await dbService.put('content', target);

    try {
      await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Server sync failed for updateContentItem', e);
    }
  };

  const deleteContentItem = async (id: number) => {
    const next = content.filter((item) => item.id !== id);
    setContent(next);
    localStorage.setItem('sr_content', JSON.stringify(next));
    await dbService.delete('content', id);

    try {
      await fetch(`/api/content/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      console.warn('Server sync failed for deleteContentItem', e);
    }
  };

  const createMessage = async (
    name: string,
    email: string,
    body: string
  ): Promise<{ ok: boolean; message?: string; error?: string }> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanBody = body.trim();

    if (!cleanName || cleanName.length > 120) {
      return { ok: false, error: 'Please provide your name (1-120 characters).' };
    }
    if (!cleanEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return { ok: false, error: 'Please provide a valid email address.' };
    }
    if (!cleanBody || cleanBody.length > 3000) {
      return { ok: false, error: 'Please write a message (1-3000 characters).' };
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, message: cleanBody }),
      });
      const payload = await res.json();
      if (res.ok) {
        return { ok: true, message: payload.message || 'Thank you. Your message has been received.' };
      }
      return { ok: false, error: payload.error || 'Failed to submit message.' };
    } catch (e) {
      return { ok: false, error: 'Unable to deliver message at this time. Please try again.' };
    }
  };

  const markMessageRead = async (id: number) => {
    const next = messages.map((m) => (m.id === id ? { ...m, is_read: true } : m));
    setMessages(next);
    localStorage.setItem('sr_messages', JSON.stringify(next));
    const target = next.find((m) => m.id === id);
    if (target) await dbService.put('messages', target);

    try {
      await fetch(`/api/messages/${id}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {}
  };

  const deleteMessage = async (id: number) => {
    const next = messages.filter((m) => m.id !== id);
    setMessages(next);
    localStorage.setItem('sr_messages', JSON.stringify(next));
    await dbService.delete('messages', id);

    try {
      await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {}
  };

  const createMediaItem = async (
    file: File,
    isPrivate = false,
    contentId: number | null = null
  ): Promise<MediaItem> => {
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('File exceeds the 15 MB size limit.');
    }

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
    ];
    if (!allowed.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a valid JPEG, PNG, WEBP, GIF, SVG, or PDF.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_private', String(isPrivate));
      if (contentId) formData.append('content_id', String(contentId));

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload.media) {
          const item: MediaItem = payload.media;
          const next = [item, ...media];
          setMedia(next);
          localStorage.setItem('sr_media', JSON.stringify(next));
          await dbService.put('media', item);
          return item;
        }
      }
    } catch (err) {
      console.warn('Server upload failed, falling back to local storage', err);
    }

    // Fallback to client FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const nextId = media.reduce((max, m) => Math.max(max, m.id), 0) + 1;
          const ext = file.name.split('.').pop() || 'png';
          const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
          const item: MediaItem = {
            id: nextId,
            filename,
            original_name: file.name,
            mime: file.type || 'image/png',
            size_bytes: file.size,
            is_private: isPrivate,
            content_id: contentId,
            data_url: dataUrl,
            created_at: new Date().toISOString(),
          };
          const next = [item, ...media];
          setMedia(next);
          localStorage.setItem('sr_media', JSON.stringify(next));
          await dbService.put('media', item);
          resolve(item);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file content'));
      reader.readAsDataURL(file);
    });
  };

  const deleteMediaItem = async (filename: string) => {
    const next = media.filter((m) => m.filename !== filename);
    setMedia(next);
    localStorage.setItem('sr_media', JSON.stringify(next));
    await dbService.delete('media', filename);

    try {
      await fetch(`/api/media/${filename}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {}
  };

  // Secure Setup Admin Account (Minimum 8 Characters)
  const setupAdmin = async (
    email: string,
    passwordPlain: string,
    recoveryQuestion: string,
    recoveryAnswerPlain: string
  ): Promise<{ ok: boolean; recoveryToken?: string; error?: string }> => {
    if (passwordPlain.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters long.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(passwordPlain, salt);
    const answerHash = await hashPassword(recoveryAnswerPlain.trim().toLowerCase(), salt);
    const recoveryToken = generateRecoveryToken();

    const payload = {
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      salt,
      recovery_question: recoveryQuestion,
      recovery_answer_hash: answerHash,
      recovery_token: recoveryToken,
    };

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Failed to initialize admin account.' };
      }

      if (data.sessionToken) {
        sessionStorage.setItem('sr_admin_session_token', data.sessionToken);
      }
      const adminData = { id: 1, email: payload.email };
      setCurrentAdmin(adminData);
      sessionStorage.setItem('sr_current_admin', JSON.stringify(adminData));

      const newAdmin: AdminAccount = {
        id: 1,
        ...payload,
        created_at: new Date().toISOString(),
      };
      setAdminAccount(newAdmin);
      localStorage.setItem('sr_admin_account', JSON.stringify(newAdmin));
      await dbService.put('admin', newAdmin);

      return { ok: true, recoveryToken: data.recoveryToken || recoveryToken };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Setup network error.' };
    }
  };

  // Secure Login
  const loginAdmin = async (
    email: string,
    passwordPlain: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const limit = checkRateLimit('admin_login');
    if (!limit.allowed) {
      return {
        ok: false,
        error: `Too many failed login attempts. Please wait ${limit.retryAfterSec} seconds before trying again.`,
      };
    }

    try {
      // 1. Fetch salt for email
      const saltRes = await fetch('/api/admin/salt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!saltRes.ok) {
        recordFailedAttempt('admin_login');
        return { ok: false, error: 'Invalid email or password.' };
      }
      const { salt } = await saltRes.json();

      // 2. Compute client-side PBKDF2 hash with server's salt
      const passwordHash = await hashPassword(passwordPlain, salt);

      // 3. Authenticate with server
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password_hash: passwordHash }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        recordFailedAttempt('admin_login');
        return { ok: false, error: loginData.error || 'Invalid email or password.' };
      }

      resetRateLimit('admin_login');
      if (loginData.sessionToken) {
        sessionStorage.setItem('sr_admin_session_token', loginData.sessionToken);
      }
      const sessionData = { id: loginData.admin.id, email: loginData.admin.email };
      setCurrentAdmin(sessionData);
      sessionStorage.setItem('sr_current_admin', JSON.stringify(sessionData));

      // Refresh admin messages
      if (loginData.sessionToken) {
        const mRes = await fetch('/api/messages', {
          headers: { Authorization: `Bearer ${loginData.sessionToken}` },
        });
        if (mRes.ok) {
          const mData = await mRes.json();
          if (Array.isArray(mData.messages)) {
            setMessages(mData.messages);
            localStorage.setItem('sr_messages', JSON.stringify(mData.messages));
          }
        }
      }

      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Login failed due to a network error.' };
    }
  };

  // Change Password (Minimum 8 Characters)
  const changePassword = async (
    currentPasswordPlain: string,
    newPasswordPlain: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (newPasswordPlain.length < 8) {
      return { ok: false, error: 'New password must be at least 8 characters.' };
    }

    try {
      const email = currentAdmin?.email || adminAccount?.email;
      if (!email) {
        return { ok: false, error: 'Admin session required.' };
      }

      // Fetch salt
      const saltRes = await fetch('/api/admin/salt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!saltRes.ok) return { ok: false, error: 'Failed to retrieve security salt.' };
      const { salt } = await saltRes.json();

      const currentHash = await hashPassword(currentPasswordPlain, salt);
      const newSalt = generateSalt();
      const newHash = await hashPassword(newPasswordPlain, newSalt);

      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          current_password_hash: currentHash,
          new_password_hash: newHash,
          new_salt: newSalt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Failed to change password.' };
      }

      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Failed to change password.' };
    }
  };

  // Recover Password (Minimum 8 Characters)
  const recoverPassword = async (
    email: string,
    answerOrToken: string,
    newPasswordPlain: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (newPasswordPlain.length < 8) {
      return { ok: false, error: 'New password must be at least 8 characters.' };
    }

    try {
      // 1. Challenge server for question & salt
      const chalRes = await fetch('/api/admin/recover-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!chalRes.ok) {
        return { ok: false, error: 'Provided email does not match registered admin.' };
      }
      const { salt } = await chalRes.json();

      const cleanInput = answerOrToken.trim();
      const answerHash = await hashPassword(cleanInput.toLowerCase(), salt);
      const newSalt = generateSalt();
      const newPasswordHash = await hashPassword(newPasswordPlain, newSalt);

      const recRes = await fetch('/api/admin/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recovery_code: cleanInput,
          answer_hash: answerHash,
          new_password_hash: newPasswordHash,
          new_salt: newSalt,
        }),
      });
      const recData = await recRes.json();
      if (!recRes.ok) {
        return { ok: false, error: recData.error || 'Recovery verification failed.' };
      }

      if (recData.sessionToken) {
        sessionStorage.setItem('sr_admin_session_token', recData.sessionToken);
      }
      if (recData.admin) {
        setCurrentAdmin(recData.admin);
        sessionStorage.setItem('sr_current_admin', JSON.stringify(recData.admin));
      }

      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Network error during password recovery.' };
    }
  };

  const logoutAdmin = () => {
    const token = sessionStorage.getItem('sr_admin_session_token');
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem('sr_admin_session_token');
    sessionStorage.removeItem('sr_current_admin');
    setCurrentAdmin(null);
  };

  const getItems = (kind: ContentKind, publishedOnly = true): ContentItem[] => {
    return content
      .filter((item) => item.kind === kind && (!publishedOnly || item.status === 'published'))
      .sort((a, b) => a.sort_order - b.sort_order || b.id - a.id);
  };

  const exportDatabase = async (): Promise<string> => {
    try {
      const res = await fetch('/api/backup', {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.text();
    } catch (e) {}
    return await dbService.exportFullDatabase();
  };

  const restoreDatabase = async (jsonData: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: jsonData,
      });
      if (res.ok) {
        const refreshed = await fetch('/api/portfolio');
        if (refreshed.ok) {
          const payload = await refreshed.json();
          if (payload.profile) setProfile(payload.profile);
          if (payload.settings) setSettings(payload.settings);
          if (payload.content) setContent(payload.content);
          if (payload.media) setMedia(payload.media);
          return true;
        }
      }
    } catch (e) {}

    const success = await dbService.restoreFromBackup(jsonData);
    if (success) {
      const reloaded = await dbService.initializeDatabase();
      if (reloaded.profile) setProfile(reloaded.profile);
      if (reloaded.settings) setSettings(reloaded.settings);
      if (reloaded.content) setContent(reloaded.content);
      if (reloaded.media) setMedia(reloaded.media);
      return true;
    }
    return false;
  };

  return (
    <PortfolioContext.Provider
      value={{
        profile,
        settings,
        content,
        messages,
        media,
        adminAccount,
        currentAdmin,
        shortlist,
        theme,
        lang,
        isServerSyncing,
        toggleTheme,
        toggleLang,
        toggleShortlist,
        updateProfile,
        updateSettings,
        createContentItem,
        updateContentItem,
        deleteContentItem,
        createMessage,
        markMessageRead,
        deleteMessage,
        createMediaItem,
        deleteMediaItem,
        setupAdmin,
        loginAdmin,
        changePassword,
        recoverPassword,
        logoutAdmin,
        getItems,
        exportDatabase,
        restoreDatabase,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within a PortfolioProvider');
  return context;
};
