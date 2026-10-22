import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { INITIAL_PROFILE, INITIAL_SETTINGS, INITIAL_CONTENT } from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const DB_FILE = path.join(DATA_DIR, 'portfolio-db.json');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for persistent uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const sanitizedExt = ext.replace(/[^a-z0-9.]/gi, '');
    const uniqueName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${sanitizedExt}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, SVG, and PDF files are allowed.'));
    }
  },
});

// Database schema & storage
interface AdminRecord {
  id: number;
  email: string;
  password_hash: string;
  salt: string;
  recovery_question: string;
  recovery_answer_hash: string;
  recovery_token: string;
  created_at: string;
  updated_at?: string;
}

interface DatabaseSchema {
  version: number;
  profile: any;
  settings: any;
  content: any[];
  messages: any[];
  media: any[];
  admin: AdminRecord | null;
}

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        version: parsed.version || 2,
        profile: parsed.profile || INITIAL_PROFILE,
        settings: parsed.settings || INITIAL_SETTINGS,
        content: Array.isArray(parsed.content) && parsed.content.length > 0 ? parsed.content : INITIAL_CONTENT,
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        media: Array.isArray(parsed.media) ? parsed.media : [],
        admin: parsed.admin || null,
      };
    } catch (e) {
      console.error('Error reading portfolio-db.json, fallback to defaults', e);
    }
  }

  // Initial Seed
  const initialData: DatabaseSchema = {
    version: 2,
    profile: INITIAL_PROFILE,
    settings: INITIAL_SETTINGS,
    content: INITIAL_CONTENT,
    messages: [],
    media: [],
    admin: null,
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error('Failed to write portfolio-db.json', e);
  }
}

// Active session store (token -> { adminId, email, expiresAt })
interface SessionInfo {
  adminId: number;
  email: string;
  expiresAt: number;
}
const activeSessions = new Map<string, SessionInfo>();

function createSession(adminId: number, email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  activeSessions.set(token, { adminId, email, expiresAt });
  return token;
}

function validateSession(token: string | undefined): SessionInfo | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return null;
  }
  // Extend session on activity
  session.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return session;
}

// Rate limiting in-memory store
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function rateLimiter(windowMs: number, maxAttempts: number, prefix: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${prefix}:${ip}`;
    const now = Date.now();
    const record = rateLimits.get(key);

    if (!record || now > record.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxAttempts) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({
        ok: false,
        error: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
        retryAfter,
      });
    }

    record.count++;
    next();
  };
}

// Admin Authentication Middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7)
    : (req.headers['x-admin-token'] as string);

  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized: Valid admin authentication token required.',
    });
  }

  (req as any).adminSession = session;
  next();
}

async function startServer() {
  const app = express();

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Serve static uploads
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- PUBLIC API ROUTES ---

  // 1. Get public portfolio data (never leaks password hashes, tokens, or private messages)
  app.get('/api/portfolio', (_req, res) => {
    const db = loadDatabase();
    res.json({
      profile: db.profile,
      settings: db.settings,
      content: db.content,
      media: db.media,
      hasAdmin: !!db.admin,
    });
  });

  // 2. Submit contact message (Public with rate limiter, length checks, and honeypot)
  app.post('/api/messages', rateLimiter(10 * 60 * 1000, 10, 'messages'), (req, res) => {
    const { name, email, message, website_hp } = req.body;
    if (website_hp) {
      return res.status(400).json({ ok: false, error: 'Message rejected.' });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 120) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid name (1-120 chars).' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 200) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.trim().length > 3000) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid message (1-3000 chars).' });
    }

    const db = loadDatabase();
    const nextId = db.messages.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const newMsg = {
      id: nextId,
      name: name.trim(),
      email: email.trim(),
      body: message.trim(),
      is_read: false,
      created_at: new Date().toLocaleString(),
    };
    db.messages = [newMsg, ...db.messages];
    saveDatabase(db);
    res.json({ ok: true, message: 'Thank you. Your message has been received.' });
  });

  // --- AUTHENTICATION ROUTES ---

  // 3. First-time Admin Setup
  app.post('/api/admin/setup', (req, res) => {
    const db = loadDatabase();
    if (db.admin) {
      return res.status(400).json({ ok: false, error: 'Admin account already exists.' });
    }
    const { email, password_hash, salt, recovery_question, recovery_answer_hash, recovery_token } = req.body;
    if (!email || !password_hash || !salt || !recovery_question || !recovery_answer_hash || !recovery_token) {
      return res.status(400).json({ ok: false, error: 'Missing required account configuration parameters.' });
    }

    db.admin = {
      id: 1,
      email: email.trim().toLowerCase(),
      password_hash,
      salt,
      recovery_question,
      recovery_answer_hash,
      recovery_token,
      created_at: new Date().toISOString(),
    };
    saveDatabase(db);

    const sessionToken = createSession(1, db.admin.email);
    res.json({
      ok: true,
      sessionToken,
      recoveryToken: recovery_token,
      admin: { id: 1, email: db.admin.email },
    });
  });

  // 4. Retrieve salt for login challenge (does NOT return password hash or recovery code)
  app.post('/api/admin/salt', (req, res) => {
    const db = loadDatabase();
    if (!db.admin) {
      return res.status(400).json({ ok: false, error: 'No admin account configured.' });
    }
    const { email } = req.body;
    if (!email || db.admin.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(404).json({ ok: false, error: 'Admin account not found with this email.' });
    }
    res.json({ ok: true, salt: db.admin.salt });
  });

  // 5. Admin Login (Rate-limited, verifies password hash, issues session token)
  app.post('/api/admin/login', rateLimiter(10 * 60 * 1000, 5, 'admin_login'), (req, res) => {
    const db = loadDatabase();
    if (!db.admin) {
      return res.status(400).json({ ok: false, error: 'No admin account configured.' });
    }
    const { email, password_hash } = req.body;
    if (
      !email ||
      !password_hash ||
      db.admin.email.toLowerCase() !== email.trim().toLowerCase() ||
      db.admin.password_hash !== password_hash
    ) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const sessionToken = createSession(db.admin.id, db.admin.email);
    res.json({
      ok: true,
      sessionToken,
      admin: { id: db.admin.id, email: db.admin.email },
    });
  });

  // 6. Verify existing session token on refresh
  app.get('/api/admin/verify-session', requireAdmin, (req, res) => {
    const session = (req as any).adminSession;
    res.json({ ok: true, admin: { id: session.adminId, email: session.email } });
  });

  // 7. Password Recovery Challenge (Returns question and salt ONLY; never returns answer hash or token)
  app.post('/api/admin/recover-challenge', (req, res) => {
    const db = loadDatabase();
    if (!db.admin) {
      return res.status(400).json({ ok: false, error: 'No admin account configured.' });
    }
    const { email } = req.body;
    if (!email || db.admin.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(404).json({ ok: false, error: 'Email does not match registered admin.' });
    }
    res.json({
      ok: true,
      recovery_question: db.admin.recovery_question,
      salt: db.admin.salt,
    });
  });

  // 8. Execute Password Recovery (verifies token or answer server-side, resets password)
  app.post('/api/admin/recover', rateLimiter(10 * 60 * 1000, 5, 'admin_recover'), (req, res) => {
    const db = loadDatabase();
    if (!db.admin) {
      return res.status(400).json({ ok: false, error: 'Admin account not configured.' });
    }
    const { email, recovery_code, answer_hash, new_password_hash, new_salt } = req.body;

    if (!email || db.admin.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(400).json({ ok: false, error: 'Email does not match registered admin.' });
    }

    const isTokenMatch =
      recovery_code &&
      typeof recovery_code === 'string' &&
      recovery_code.trim().toUpperCase() === db.admin.recovery_token.toUpperCase();

    const isAnswerMatch =
      answer_hash &&
      typeof answer_hash === 'string' &&
      answer_hash === db.admin.recovery_answer_hash;

    if (!isTokenMatch && !isAnswerMatch) {
      return res.status(401).json({ ok: false, error: 'Recovery answer or recovery code is incorrect.' });
    }

    const newRecoveryToken = crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{1,2}/g)?.join('-') || crypto.randomBytes(8).toString('hex').toUpperCase();

    db.admin = {
      ...db.admin,
      password_hash: new_password_hash,
      salt: new_salt,
      recovery_token: newRecoveryToken,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(db);

    const sessionToken = createSession(db.admin.id, db.admin.email);
    res.json({
      ok: true,
      sessionToken,
      new_recovery_token: newRecoveryToken,
      admin: { id: db.admin.id, email: db.admin.email },
    });
  });

  // 9. Change Password (Requires active admin session)
  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    const db = loadDatabase();
    if (!db.admin) {
      return res.status(400).json({ ok: false, error: 'Admin account does not exist.' });
    }
    const { current_password_hash, new_password_hash, new_salt } = req.body;
    if (db.admin.password_hash !== current_password_hash) {
      return res.status(401).json({ ok: false, error: 'Current password is incorrect.' });
    }

    db.admin = {
      ...db.admin,
      password_hash: new_password_hash,
      salt: new_salt,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(db);
    res.json({ ok: true });
  });

  // 10. Logout (Invalidates session token)
  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7)
      : (req.headers['x-admin-token'] as string);

    if (token) {
      activeSessions.delete(token);
    }
    res.json({ ok: true });
  });

  // --- PROTECTED ADMIN API ROUTES ---

  // 11. Profile Update
  app.post('/api/profile', requireAdmin, (req, res) => {
    const db = loadDatabase();
    db.profile = { ...db.profile, ...req.body };
    saveDatabase(db);
    res.json({ ok: true, profile: db.profile });
  });

  // 12. Settings Update
  app.post('/api/settings', requireAdmin, (req, res) => {
    const db = loadDatabase();
    db.settings = { ...db.settings, ...req.body };
    saveDatabase(db);
    res.json({ ok: true, settings: db.settings });
  });

  // 13. Content CRUD
  app.post('/api/content', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const nextId = db.content.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const now = new Date().toISOString();
    const item = {
      ...req.body,
      id: nextId,
      created_at: now,
      updated_at: now,
    };
    db.content = [item, ...db.content];
    saveDatabase(db);
    res.json({ ok: true, item });
  });

  app.put('/api/content/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    const now = new Date().toISOString();
    db.content = db.content.map((item) =>
      item.id === id ? { ...item, ...req.body, id, updated_at: now } : item
    );
    saveDatabase(db);
    const updated = db.content.find((item) => item.id === id);
    res.json({ ok: true, item: updated });
  });

  app.delete('/api/content/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    db.content = db.content.filter((item) => item.id !== id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // 14. Media Upload & Deletion
  app.post('/api/media/upload', requireAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded.' });
    }
    const db = loadDatabase();
    const nextId = db.media.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const url = `/uploads/${req.file.filename}`;
    const mediaItem = {
      id: nextId,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime: req.file.mimetype,
      size_bytes: req.file.size,
      url,
      data_url: url,
      is_private: req.body.is_private === 'true',
      content_id: req.body.content_id ? parseInt(req.body.content_id, 10) : null,
      created_at: new Date().toISOString(),
    };
    db.media = [mediaItem, ...db.media];
    saveDatabase(db);
    res.json({ ok: true, media: mediaItem });
  });

  app.delete('/api/media/:filename', requireAdmin, (req, res) => {
    const filename = path.basename(req.params.filename);
    const db = loadDatabase();
    db.media = db.media.filter((m) => m.filename !== filename);
    saveDatabase(db);

    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Failed to unlink file', filePath, e);
      }
    }
    res.json({ ok: true });
  });

  // 15. Admin Messages Inbox (Protected)
  app.get('/api/messages', requireAdmin, (_req, res) => {
    const db = loadDatabase();
    res.json({ ok: true, messages: db.messages });
  });

  app.post('/api/messages/:id/read', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    db.messages = db.messages.map((m) => (m.id === id ? { ...m, is_read: true } : m));
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.delete('/api/messages/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    db.messages = db.messages.filter((m) => m.id !== id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // 16. Backup & Restore (Protected)
  app.get('/api/backup', requireAdmin, (_req, res) => {
    const db = loadDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=portfolio-backup.json');
    res.send(JSON.stringify(db, null, 2));
  });

  app.post('/api/restore', requireAdmin, (req, res) => {
    try {
      const data = req.body;
      if (!data || !data.profile || !Array.isArray(data.content)) {
        return res.status(400).json({ ok: false, error: 'Invalid backup structure.' });
      }
      saveDatabase({
        version: 2,
        profile: data.profile,
        settings: data.settings || INITIAL_SETTINGS,
        content: data.content,
        messages: Array.isArray(data.messages) ? data.messages : [],
        media: Array.isArray(data.media) ? data.media : [],
        admin: data.admin || loadDatabase().admin,
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Mount Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
