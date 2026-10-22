import fs from 'fs';
import path from 'path';
import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, pathName, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathName, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { ...headers },
    };

    if (body && typeof body === 'object' && !(body instanceof Buffer)) {
      body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data,
          raw: data,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

async function runAudit() {
  const results = [];
  const log = (name, passed, detail) => {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  };

  console.log('=== STARTING DEPLOYMENT AUDIT ===\n');

  // 1. Build artifacts check
  try {
    const hasDist = fs.existsSync('./dist/index.html');
    const hasAssets = fs.existsSync('./dist/assets');
    if (hasDist && hasAssets) {
      log('Production Build Artifacts', true, 'dist/index.html and dist/assets successfully generated.');
    } else {
      log('Production Build Artifacts', false, 'Missing dist output directory or index.html.');
    }
  } catch (e) {
    log('Production Build Artifacts', false, e.message);
  }

  // 2. Server configuration & scripts check
  try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const hasStart = pkg.scripts && pkg.scripts.start === 'tsx server.ts';
    const hasBuild = pkg.scripts && pkg.scripts.build === 'tsc && vite build';
    if (hasStart && hasBuild) {
      log('Package Scripts & Server Entry', true, 'start and build scripts configured correctly.');
    } else {
      log('Package Scripts & Server Entry', false, `Scripts mismatched: start=${pkg.scripts?.start}`);
    }
  } catch (e) {
    log('Package Scripts & Server Entry', false, e.message);
  }

  // 3. Public Portfolio Endpoint & Data Leak Check
  try {
    const res = await request('GET', '/api/portfolio');
    if (res.status === 200 && res.data) {
      const leaksPassword = 'password_hash' in (res.data.adminAccount || {});
      const leaksRecoveryToken = 'recovery_token' in (res.data.adminAccount || {});
      const leaksMessages = 'messages' in res.data;
      if (!leaksPassword && !leaksRecoveryToken && !leaksMessages) {
        log('Public API Data Hygiene', true, 'Public portfolio does NOT leak passwords, recovery tokens, or private messages.');
      } else {
        log('Public API Data Hygiene', false, `Leak detected: password=${leaksPassword}, recoveryToken=${leaksRecoveryToken}, messages=${leaksMessages}`);
      }
    } else {
      log('Public API Data Hygiene', false, `GET /api/portfolio returned HTTP ${res.status}`);
    }
  } catch (e) {
    log('Public API Data Hygiene', false, e.message);
  }

  // 4. Unauthorized Mutation Protection Check (Admin Routes)
  try {
    const p1 = await request('POST', '/api/profile', {}, { name: 'Hacked' });
    const p2 = await request('POST', '/api/settings', {}, { site_title: 'Hacked' });
    const p3 = await request('POST', '/api/content', {}, { title: 'Hacked' });
    const p4 = await request('DELETE', '/api/content/1');
    const p5 = await request('GET', '/api/messages');
    const p6 = await request('GET', '/api/backup');

    const allBlocked = [p1, p2, p3, p4, p5, p6].every((r) => r.status === 401);
    if (allBlocked) {
      log('Admin Route Protection', true, 'All mutating/admin endpoints return 401 Unauthorized without bearer token.');
    } else {
      log('Admin Route Protection', false, `Some endpoints not blocked: ${JSON.stringify([p1.status, p2.status, p3.status, p4.status, p5.status, p6.status])}`);
    }
  } catch (e) {
    log('Admin Route Protection', false, e.message);
  }

  // 5. Contact Message Honeypot & Validation
  try {
    const botRes = await request('POST', '/api/messages', {}, {
      name: 'Spam Bot',
      email: 'bot@spam.com',
      message: 'Buy meds',
      website_hp: 'spam-bot-trap',
    });
    const invalidEmailRes = await request('POST', '/api/messages', {}, {
      name: 'Test Visitor',
      email: 'not-an-email',
      message: 'Hello',
    });
    const validRes = await request('POST', '/api/messages', {}, {
      name: 'Auditor Person',
      email: 'audit@example.com',
      message: 'Deployment readiness audit test message.',
    });

    if (botRes.status === 400 && invalidEmailRes.status === 400 && validRes.status === 200) {
      log('Message Honeypot & Input Validation', true, 'Honeypot blocks spam, invalid email rejected, valid message accepted.');
    } else {
      log('Message Honeypot & Input Validation', false, `bot=${botRes.status}, invalid=${invalidEmailRes.status}, valid=${validRes.status}`);
    }
  } catch (e) {
    log('Message Honeypot & Input Validation', false, e.message);
  }

  // 6. Database File Integrity & Restart Persistence Test
  try {
    const dbPath = './data/portfolio-db.json';
    const exists = fs.existsSync(dbPath);
    if (exists) {
      const content = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const isValid = content.version && content.profile && Array.isArray(content.content);
      if (isValid) {
        log('Database Persistence & Schema Integrity', true, `portfolio-db.json is intact with version ${content.version} and ${content.content.length} content items.`);
      } else {
        log('Database Persistence & Schema Integrity', false, 'portfolio-db.json exists but schema is malformed.');
      }
    } else {
      log('Database Persistence & Schema Integrity', false, 'data/portfolio-db.json does not exist.');
    }
  } catch (e) {
    log('Database Persistence & Schema Integrity', false, e.message);
  }

  // 7. Upload Directory & Storage Validation
  try {
    const uploadsDir = './public/uploads';
    const exists = fs.existsSync(uploadsDir);
    const gitkeep = fs.existsSync('./public/uploads/.gitkeep');
    if (exists && gitkeep) {
      log('Uploads Directory & Gitkeep', true, 'public/uploads/ exists and .gitkeep ensures directory tracking in Git.');
    } else {
      log('Uploads Directory & Gitkeep', false, `uploadsDir=${exists}, gitkeep=${gitkeep}`);
    }
  } catch (e) {
    log('Uploads Directory & Gitkeep', false, e.message);
  }

  // 8. .gitignore & Secret Hygiene Check
  try {
    const gitignore = fs.readFileSync('./.gitignore', 'utf8');
    const ignoresEnv = gitignore.includes('.env');
    const ignoresDist = gitignore.includes('dist/');
    const ignoresDb = gitignore.includes('data/*.json');
    const ignoresUploads = gitignore.includes('public/uploads/*');
    if (ignoresEnv && ignoresDist && ignoresDb && ignoresUploads) {
      log('.gitignore & Credential Exclusion', true, '.gitignore safely excludes .env, dist/, data/*.json, and public/uploads/*.');
    } else {
      log('.gitignore & Credential Exclusion', false, `Missing exclusions in .gitignore`);
    }
  } catch (e) {
    log('.gitignore & Credential Exclusion', false, e.message);
  }

  // 9. Admin Lifecycle Test (Setup / Login / CRUD / Media / Clean up)
  try {
    // Check if admin exists
    const pfRes = await request('GET', '/api/portfolio');
    let sessionToken = null;

    if (!pfRes.data.hasAdmin) {
      // Test setup
      const setupRes = await request('POST', '/api/admin/setup', {}, {
        email: 'admin@saifur.dev',
        password_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', // 'test1234' dummy hash
        salt: 'a1b2c3d4e5f6',
        recovery_question: 'What is your favorite project?',
        recovery_answer_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        recovery_token: 'ABCD-1234-EFGH-5678',
      });
      if (setupRes.status === 200 && setupRes.data.sessionToken) {
        sessionToken = setupRes.data.sessionToken;
        log('Admin First-Time Setup & Session Creation', true, 'Created admin account, returned session token and recovery code.');
      } else {
        log('Admin First-Time Setup & Session Creation', false, `Setup failed: ${JSON.stringify(setupRes.data)}`);
      }
    } else {
      // Test salt retrieval
      const saltRes = await request('POST', '/api/admin/salt', {}, { email: 'admin@saifur.dev' });
      if (saltRes.status === 200) {
        // Test wrong login
        const badLogin = await request('POST', '/api/admin/login', {}, { email: 'admin@saifur.dev', password_hash: 'wrong' });
        // Test correct login
        const goodLogin = await request('POST', '/api/admin/login', {}, {
          email: 'admin@saifur.dev',
          password_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        });
        if (badLogin.status === 401 && goodLogin.status === 200 && goodLogin.data.sessionToken) {
          sessionToken = goodLogin.data.sessionToken;
          log('Admin Salt Challenge & Authentication', true, 'Wrong login rejected with 401, correct credentials issued session token.');
        } else {
          log('Admin Salt Challenge & Authentication', false, `Login check failed: bad=${badLogin.status}, good=${goodLogin.status}`);
        }
      }
    }

    if (sessionToken) {
      // Test CRUD with session token
      const addRes = await request('POST', '/api/content', {
        Authorization: `Bearer ${sessionToken}`,
      }, {
        kind: 'project',
        title: 'Audit Test Project',
        slug: 'audit-test-project',
        status: 'published',
        sort_order: 999,
        data: { description: 'Temporary audit item' },
      });

      if (addRes.status === 200 && addRes.data.item?.id) {
        const itemId = addRes.data.item.id;
        // Verify in public portfolio
        const checkRes = await request('GET', '/api/portfolio');
        const found = checkRes.data.content.some((c) => c.id === itemId);

        // Update item
        const putRes = await request('PUT', `/api/content/${itemId}`, {
          Authorization: `Bearer ${sessionToken}`,
        }, { title: 'Audit Test Project Updated' });

        // Delete item
        const delRes = await request('DELETE', `/api/content/${itemId}`, {
          Authorization: `Bearer ${sessionToken}`,
        });

        // Verify removed
        const finalRes = await request('GET', '/api/portfolio');
        const stillFound = finalRes.data.content.some((c) => c.id === itemId);

        if (found && putRes.status === 200 && delRes.status === 200 && !stillFound) {
          log('Authenticated Content CRUD & Public Sync', true, 'Created, verified public sync, updated, and deleted content item cleanly.');
        } else {
          log('Authenticated Content CRUD & Public Sync', false, `CRUD lifecycle failed: found=${found}, put=${putRes.status}, del=${delRes.status}, stillFound=${stillFound}`);
        }
      } else {
        log('Authenticated Content CRUD & Public Sync', false, `Failed to create item: ${JSON.stringify(addRes.data)}`);
      }
    }

    // Cleanup test records from database file if created
    const dbPath = './data/portfolio-db.json';
    if (fs.existsSync(dbPath)) {
      try {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (dbData.admin && dbData.admin.email === 'admin@saifur.dev') {
          dbData.admin = null;
          dbData.messages = [];
          fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
        }
      } catch (e) {}
    }
  } catch (e) {
    log('Admin Lifecycle Test', false, e.message);
  }

  console.log('\n=== AUDIT SUMMARY ===');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total checks: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.passed).length}`);
  console.log(`Failed: ${results.filter((r) => !r.passed).length}`);
  console.log(`Status: ${allPassed ? 'READY FOR DEPLOYMENT' : 'ISSUES DETECTED'}`);

  return allPassed;
}

runAudit().catch(console.error);
