// Client-side cryptographic security using Web Crypto API (PBKDF2 with SHA-256)

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  window.crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRecoveryToken(): string {
  const arr = new Uint8Array(8);
  window.crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('-')
    .toUpperCase();
}

// Rate Limiter
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

interface AttemptRecord {
  attempts: number[];
  lockedUntil?: number;
}

export function checkRateLimit(ipOrKey = 'admin_login'): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  try {
    const raw = localStorage.getItem(`sr_rate_${ipOrKey}`);
    const record: AttemptRecord = raw ? JSON.parse(raw) : { attempts: [] };
    const now = Date.now();

    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfterSec = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSec };
    }

    const recent = record.attempts.filter((ts) => now - ts < ATTEMPT_WINDOW_MS);
    if (recent.length >= MAX_ATTEMPTS) {
      const lockUntil = now + ATTEMPT_WINDOW_MS;
      localStorage.setItem(`sr_rate_${ipOrKey}`, JSON.stringify({ attempts: recent, lockedUntil: lockUntil }));
      return { allowed: false, remainingAttempts: 0, retryAfterSec: Math.ceil(ATTEMPT_WINDOW_MS / 1000) };
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - recent.length };
  } catch (e) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
}

export function recordFailedAttempt(ipOrKey = 'admin_login') {
  try {
    const raw = localStorage.getItem(`sr_rate_${ipOrKey}`);
    const record: AttemptRecord = raw ? JSON.parse(raw) : { attempts: [] };
    const now = Date.now();
    const recent = record.attempts.filter((ts) => now - ts < ATTEMPT_WINDOW_MS);
    recent.push(now);

    let lockedUntil: number | undefined;
    if (recent.length >= MAX_ATTEMPTS) {
      lockedUntil = now + ATTEMPT_WINDOW_MS;
    }

    localStorage.setItem(`sr_rate_${ipOrKey}`, JSON.stringify({ attempts: recent, lockedUntil }));
  } catch (e) {}
}

export function resetRateLimit(ipOrKey = 'admin_login') {
  try {
    localStorage.removeItem(`sr_rate_${ipOrKey}`);
  } catch (e) {}
}
