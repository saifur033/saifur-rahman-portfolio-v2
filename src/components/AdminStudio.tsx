import React, { useState, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { ContentKind, ContentItem } from '../types';

interface AdminStudioProps {
  onBackToPublic: () => void;
}

type AdminSection =
  | 'dashboard'
  | 'profile'
  | 'about_me'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'publications'
  | 'outreach'
  | 'certificates'
  | 'awards'
  | 'cv_resume'
  | 'contact'
  | 'settings'
  | 'media'
  | 'messages'
  | 'backup'
  | 'security';

export const AdminStudio: React.FC<AdminStudioProps> = ({ onBackToPublic }) => {
  const {
    profile,
    updateProfile,
    settings,
    updateSettings,
    content,
    createContentItem,
    updateContentItem,
    deleteContentItem,
    messages,
    markMessageRead,
    deleteMessage,
    media,
    createMediaItem,
    deleteMediaItem,
    adminAccount,
    currentAdmin,
    setupAdmin,
    loginAdmin,
    changePassword,
    recoverPassword,
    logoutAdmin,
    exportDatabase,
    restoreDatabase,
  } = usePortfolio();

  // Navigation
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications
  const [flash, setFlash] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auth Views
  const [authView, setAuthView] = useState<'login' | 'setup' | 'recover'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [setupForm, setSetupForm] = useState({
    email: '',
    password: '',
    confirm: '',
    recoveryQuestion: 'What was your first school or favorite pet?',
    recoveryAnswer: '',
  });
  const [recoveryTokenDisplay, setRecoveryTokenDisplay] = useState<string | null>(null);
  const [recoverForm, setRecoverForm] = useState({
    email: '',
    answerOrToken: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Change Password Form
  const [changePwForm, setChangePwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Section Forms
  const [profileForm, setProfileForm] = useState({ ...profile });
  const [settingsForm, setSettingsForm] = useState({ ...settings });

  // Generic Item Form for CRUD
  const [itemForm, setItemForm] = useState<{
    kind: ContentKind;
    title: string;
    slug: string;
    status: 'draft' | 'published' | 'hidden';
    sort_order: number;
    data: Record<string, any>;
  }>({
    kind: 'project',
    title: '',
    slug: '',
    status: 'published',
    sort_order: 0,
    data: {},
  });

  // Backup restore file input ref
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const showFlash = (message: string, type: 'success' | 'error' = 'success') => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 4000);
  };

  // If No Admin Account Exists -> Force Setup
  if (!adminAccount) {
    const handleSetupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!setupForm.email.includes('@')) {
        showFlash('Please enter a valid email address.', 'error');
        return;
      }
      if (setupForm.password.length < 8) {
        showFlash('Password must be at least 8 characters.', 'error');
        return;
      }
      if (setupForm.password !== setupForm.confirm) {
        showFlash('Passwords do not match.', 'error');
        return;
      }
      if (!setupForm.recoveryAnswer.trim()) {
        showFlash('Please provide an answer for password recovery.', 'error');
        return;
      }

      const res = await setupAdmin(
        setupForm.email,
        setupForm.password,
        setupForm.recoveryQuestion,
        setupForm.recoveryAnswer
      );

      if (res.ok && res.recoveryToken) {
        setRecoveryTokenDisplay(res.recoveryToken);
        showFlash('Admin account created! Save your recovery code.', 'success');
      } else {
        showFlash(res.error || 'Failed to create admin account.', 'error');
      }
    };

    return (
      <div className="admin-body" style={{ minHeight: '100vh', padding: '24px' }}>
        <header className="topbar admin-topbar">
          <span className="brand">SR<span>.</span> Studio</span>
          <button className="btn" type="button" onClick={onBackToPublic}>
            View public site ↗
          </button>
        </header>

        {flash && (
          <div className="flash-wrap">
            <p className={`flash ${flash.type}`}>{flash.message}</p>
          </div>
        )}

        <main className="admin-main">
          <section className="auth-card" style={{ maxWidth: '480px', margin: '40px auto' }}>
            <p className="eyebrow">SECURITY SETUP</p>
            <h1>Create your private admin account</h1>
            <p>
              Your password will be encrypted with PBKDF2 (100,000 iterations of SHA-256).
              No default credentials exist.
            </p>

            {recoveryTokenDisplay ? (
              <div style={{ background: 'var(--panel)', border: '1px solid var(--teal)', padding: '20px', borderRadius: '6px', margin: '20px 0' }}>
                <h3 style={{ marginTop: 0, color: 'var(--teal)' }}>✓ Account Created Successfully</h3>
                <p><strong>Your Emergency Password Recovery Code:</strong></p>
                <div style={{ background: '#111', color: '#67b7ff', padding: '12px', fontFamily: 'monospace', fontSize: '1.1rem', borderRadius: '4px', textAlign: 'center', letterSpacing: '2px', userSelect: 'all' }}>
                  {recoveryTokenDisplay}
                </div>
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                  Store this code in a secure location. You can use either this code or your security question to reset your password if forgotten.
                </p>
                <button
                  className="btn primary"
                  type="button"
                  style={{ width: '100%', marginTop: '12px' }}
                  onClick={() => setRecoveryTokenDisplay(null)}
                >
                  Proceed to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSetupSubmit}>
                <label>
                  Admin Email
                  <input
                    type="email"
                    required
                    value={setupForm.email}
                    onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                  />
                </label>
                <label>
                  Password (minimum 8 characters)
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={setupForm.password}
                    onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={setupForm.confirm}
                    onChange={(e) => setSetupForm({ ...setupForm, confirm: e.target.value })}
                  />
                </label>

                <div style={{ margin: '16px 0', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                  <p className="section-kicker">PASSWORD RECOVERY PROCEDURE</p>
                  <label>
                    Security Question
                    <select
                      value={setupForm.recoveryQuestion}
                      onChange={(e) => setSetupForm({ ...setupForm, recoveryQuestion: e.target.value })}
                    >
                      <option value="What was your first school or favorite pet?">What was your first school or favorite pet?</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What is the name of your first robotics project?">What is the name of your first robotics project?</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    </select>
                  </label>
                  <label>
                    Secret Answer
                    <input
                      type="text"
                      required
                      placeholder="Your secret answer for recovery"
                      value={setupForm.recoveryAnswer}
                      onChange={(e) => setSetupForm({ ...setupForm, recoveryAnswer: e.target.value })}
                    />
                  </label>
                </div>

                <button className="btn primary" type="submit">
                  Create Admin Account
                </button>
              </form>
            )}
          </section>
        </main>
      </div>
    );
  }

  // If Not Authenticated -> Login / Password Recovery
  if (!currentAdmin) {
    const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await loginAdmin(loginForm.email, loginForm.password);
      if (res.ok) {
        showFlash('Welcome back to the Studio.', 'success');
      } else {
        showFlash(res.error || 'Email or password is incorrect.', 'error');
      }
    };

    const handleRecoverSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (recoverForm.newPassword.length < 8) {
        showFlash('New password must be at least 8 characters.', 'error');
        return;
      }
      if (recoverForm.newPassword !== recoverForm.confirmNewPassword) {
        showFlash('Passwords do not match.', 'error');
        return;
      }

      const res = await recoverPassword(recoverForm.email, recoverForm.answerOrToken, recoverForm.newPassword);
      if (res.ok) {
        showFlash('Password reset successfully. You can now log in.', 'success');
        setAuthView('login');
      } else {
        showFlash(res.error || 'Password recovery failed.', 'error');
      }
    };

    return (
      <div className="admin-body" style={{ minHeight: '100vh', padding: '24px' }}>
        <header className="topbar admin-topbar">
          <span className="brand">SR<span>.</span> Studio</span>
          <button className="btn" type="button" onClick={onBackToPublic}>
            View public site ↗
          </button>
        </header>

        {flash && (
          <div className="flash-wrap">
            <p className={`flash ${flash.type}`}>{flash.message}</p>
          </div>
        )}

        <main className="admin-main">
          {authView === 'login' ? (
            <section className="auth-card" style={{ maxWidth: '440px', margin: '40px auto' }}>
              <p className="eyebrow">PRIVATE ACCESS</p>
              <h1>Admin Studio Login</h1>
              <form onSubmit={handleLoginSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </label>
                <button className="btn primary" type="submit" style={{ marginTop: '12px' }}>
                  Sign in
                </button>
              </form>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setAuthView('recover')}
                  style={{ fontSize: '0.85rem' }}
                >
                  Forgot password? Recover account ↗
                </button>
              </div>
            </section>
          ) : (
            <section className="auth-card" style={{ maxWidth: '480px', margin: '40px auto' }}>
              <p className="eyebrow">SECURE ACCOUNT RECOVERY</p>
              <h1>Reset Administrator Password</h1>
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                Enter your admin email and either your security question answer or your emergency recovery code.
              </p>

              <form onSubmit={handleRecoverSubmit}>
                <label>
                  Admin Email
                  <input
                    type="email"
                    required
                    value={recoverForm.email}
                    onChange={(e) => setRecoverForm({ ...recoverForm, email: e.target.value })}
                  />
                </label>
                <label>
                  Security Answer OR Recovery Code
                  <input
                    type="text"
                    required
                    placeholder="Enter security answer or recovery token"
                    value={recoverForm.answerOrToken}
                    onChange={(e) => setRecoverForm({ ...recoverForm, answerOrToken: e.target.value })}
                  />
                </label>
                <label>
                  New Password (min 8 characters)
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={recoverForm.newPassword}
                    onChange={(e) => setRecoverForm({ ...recoverForm, newPassword: e.target.value })}
                  />
                </label>
                <label>
                  Confirm New Password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={recoverForm.confirmNewPassword}
                    onChange={(e) => setRecoverForm({ ...recoverForm, confirmNewPassword: e.target.value })}
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="btn primary" type="submit">
                    Reset Password
                  </button>
                  <button className="btn" type="button" onClick={() => setAuthView('login')}>
                    Back to Login
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    );
  }

  // --- LOGGED IN ADMIN ACTIONS ---

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileForm);
    showFlash('Profile & Identity saved successfully.', 'success');
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settingsForm);
    showFlash('Website Settings & SEO updated.', 'success');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePwForm.newPassword.length < 8) {
      showFlash('New password must be at least 8 characters.', 'error');
      return;
    }
    if (changePwForm.newPassword !== changePwForm.confirmPassword) {
      showFlash('Passwords do not match.', 'error');
      return;
    }

    const res = await changePassword(changePwForm.currentPassword, changePwForm.newPassword);
    if (res.ok) {
      showFlash('Password changed successfully.', 'success');
      setChangePwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showFlash(res.error || 'Failed to change password.', 'error');
    }
  };

  // Helper for opening edit modal/view for a ContentItem
  const openEdit = (item: ContentItem) => {
    setEditingItem(item);
    setIsCreatingNew(false);
    setItemForm({
      kind: item.kind,
      title: item.title,
      slug: item.slug,
      status: item.status,
      sort_order: item.sort_order,
      data: { ...item.data },
    });
  };

  const openNew = (kind: ContentKind) => {
    setEditingItem(null);
    setIsCreatingNew(true);
    setItemForm({
      kind,
      title: '',
      slug: '',
      status: 'published',
      sort_order: 0,
      data: {},
    });
  };

  const handleSaveItemForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.title.trim()) {
      showFlash('Title is required.', 'error');
      return;
    }
    const slug =
      itemForm.slug.trim() ||
      itemForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);

    if (editingItem && !isCreatingNew) {
      await updateContentItem(editingItem.id, {
        title: itemForm.title.trim(),
        slug,
        status: itemForm.status,
        sort_order: Number(itemForm.sort_order) || 0,
        data: itemForm.data,
      });
      showFlash('Record updated successfully.', 'success');
    } else {
      await createContentItem({
        kind: itemForm.kind,
        title: itemForm.title.trim(),
        slug,
        status: itemForm.status,
        sort_order: Number(itemForm.sort_order) || 0,
        data: itemForm.data,
      });
      showFlash('Record created successfully.', 'success');
    }
    setEditingItem(null);
    setIsCreatingNew(false);
  };

  const handleDeleteItem = async (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      await deleteContentItem(id);
      showFlash('Record deleted successfully.', 'success');
    }
  };

  // Media upload handler
  const handleFileUpload = async (
    file: File,
    onSuccess: (url: string) => void
  ) => {
    try {
      const item = await createMediaItem(file);
      onSuccess(item.data_url || item.filename);
      showFlash(`Uploaded ${file.name} successfully.`, 'success');
    } catch (err: any) {
      showFlash(err.message || 'Upload failed.', 'error');
    }
  };

  // Filter items by section
  const projectsList = content.filter((c) => c.kind === 'project');
  const publicationsList = content.filter((c) => c.kind === 'publication');
  const certificatesList = content.filter((c) => c.kind === 'certificate');
  const awardsList = content.filter((c) => c.kind === 'crest');
  const skillsList = content.filter((c) => c.kind === 'skill');
  const careerList = content.filter((c) => c.kind === 'career');
  const clubsList = content.filter((c) => c.kind === 'club');
  const activitiesList = content.filter((c) => c.kind === 'activity');

  // Education vs Experience filter from career
  const experienceList = careerList.filter((c) => c.data?.type !== 'Education' && c.data?.type !== 'Higher Education');
  const educationList = careerList.filter((c) => c.data?.type === 'Education' || c.data?.type === 'Higher Education');

  // Database Backup Handlers
  const handleDownloadBackup = async () => {
    const json = await exportDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saifur_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFlash('Backup downloaded successfully.', 'success');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const success = await restoreDatabase(reader.result as string);
          if (success) {
            showFlash('Database restored from backup successfully!', 'success');
          } else {
            showFlash('Failed to restore database. Invalid backup file.', 'error');
          }
        } catch (err) {
          showFlash('Error reading backup file.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const navItems: { id: AdminSection; label: string; count?: number }[] = [
    { id: 'dashboard', label: '📊 Dashboard Overview' },
    { id: 'profile', label: '👤 Profile & Identity' },
    { id: 'about_me', label: '📝 About Me & Summary' },
    { id: 'skills', label: '⚡ Skills & Proficiency', count: skillsList.length },
    { id: 'experience', label: '💼 Professional Experience', count: experienceList.length },
    { id: 'education', label: '🎓 Education & Degrees', count: educationList.length },
    { id: 'projects', label: '🚀 Projects & Inventions', count: projectsList.length },
    { id: 'publications', label: '📚 Research Publications', count: publicationsList.length },
    { id: 'outreach', label: '🤝 Outreach & Leadership', count: clubsList.length + activitiesList.length },
    { id: 'certificates', label: '📜 Certificates & Licenses', count: certificatesList.length },
    { id: 'awards', label: '🏆 Trophy Room & Awards', count: awardsList.length },
    { id: 'cv_resume', label: '📄 CV / Resume Manager' },
    { id: 'contact', label: '✉ Contact & Coordinates' },
    { id: 'settings', label: '⚙ Website Settings & SEO' },
    { id: 'media', label: '🖼 Media Library', count: media.length },
    { id: 'messages', label: '📬 Messages Inbox', count: messages.filter((m) => !m.is_read).length },
    { id: 'backup', label: '💾 Database Backup & Export' },
    { id: 'security', label: '🔒 Security & Password' },
  ];

  return (
    <div className="admin-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Header */}
      <header className="topbar admin-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="mobile-menu-btn"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <span className="brand">SR<span>.</span> Admin Studio</span>
          <span className="status-tag" style={{ background: '#0f766e', color: '#fff', fontSize: '0.75rem' }}>Active Session</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn" type="button" onClick={onBackToPublic}>
            View Live Portfolio ↗
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              logoutAdmin();
              showFlash('You have signed out.', 'success');
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {flash && (
        <div className="flash-wrap" style={{ position: 'sticky', top: '72px', zIndex: 100 }}>
          <p className={`flash ${flash.type}`}>{flash.message}</p>
        </div>
      )}

      {/* Main Admin Layout with Sidebar */}
      <div className="admin-layout-container" style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 72px)' }}>
        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Navigation Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div style={{ padding: '0 8px 12px', fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Content Management
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`text-button ${activeSection === item.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  background: activeSection === item.id ? 'var(--ivory)' : 'transparent',
                  fontWeight: activeSection === item.id ? 700 : 500,
                  color: activeSection === item.id ? 'var(--teal)' : 'inherit',
                  border: activeSection === item.id ? '1px solid var(--line)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setActiveSection(item.id);
                  setEditingItem(null);
                  setIsCreatingNew(false);
                  setMobileMenuOpen(false);
                }}
              >
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    style={{
                      background: 'rgba(0,0,0,0.1)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
            Logged in as <strong>{currentAdmin.email}</strong>
          </div>
        </aside>

        {/* Content Workspace Area */}
        <main className="admin-main-content">
          {/* 1. DASHBOARD OVERVIEW */}
          {activeSection === 'dashboard' && (
            <div>
              <p className="eyebrow">ADMINISTRATOR COMMAND CENTER</p>
              <h1>Portfolio Overview &amp; Live Stats</h1>
              <p>Manage, add, and update every section of your portfolio in real-time. Changes are stored in a persistent database.</p>

              <div className="admin-grid" style={{ marginTop: '24px' }}>
                <div className="admin-card" onClick={() => setActiveSection('projects')}>
                  <h2>Projects</h2>
                  <strong style={{ fontSize: '2rem' }}>{projectsList.length}</strong>
                  <p>Published &amp; capstone systems</p>
                </div>

                <div className="admin-card" onClick={() => setActiveSection('certificates')}>
                  <h2>Certificates</h2>
                  <strong style={{ fontSize: '2rem' }}>{certificatesList.length}</strong>
                  <p>Verified credentials &amp; licenses</p>
                </div>

                <div className="admin-card" onClick={() => setActiveSection('publications')}>
                  <h2>Publications</h2>
                  <strong style={{ fontSize: '2rem' }}>{publicationsList.length}</strong>
                  <p>Research papers &amp; preprints</p>
                </div>

                <div className="admin-card" onClick={() => setActiveSection('awards')}>
                  <h2>Trophies &amp; Awards</h2>
                  <strong style={{ fontSize: '2rem' }}>{awardsList.length}</strong>
                  <p>Crest honors &amp; awards</p>
                </div>

                <div className="admin-card" onClick={() => setActiveSection('skills')}>
                  <h2>Core Skills</h2>
                  <strong style={{ fontSize: '2rem' }}>{skillsList.length}</strong>
                  <p>Technical &amp; operational competencies</p>
                </div>

                <div className="admin-card" onClick={() => setActiveSection('messages')}>
                  <h2>Unread Inquiries</h2>
                  <strong style={{ fontSize: '2rem', color: messages.some(m => !m.is_read) ? 'var(--teal)' : 'inherit' }}>
                    {messages.filter((m) => !m.is_read).length}
                  </strong>
                  <p>{messages.length} total messages received</p>
                </div>
              </div>

              <div style={{ marginTop: '32px', background: 'var(--panel)', padding: '24px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <button className="btn primary" type="button" onClick={() => { setActiveSection('projects'); openNew('project'); }}>
                    ＋ Add New Project
                  </button>
                  <button className="btn" type="button" onClick={() => { setActiveSection('certificates'); openNew('certificate'); }}>
                    ＋ Add Certificate
                  </button>
                  <button className="btn" type="button" onClick={() => { setActiveSection('cv_resume'); }}>
                    📄 Replace Resume / CV (PDF)
                  </button>
                  <button className="btn" type="button" onClick={handleDownloadBackup}>
                    💾 Download Full Database Backup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROFILE & IDENTITY */}
          {activeSection === 'profile' && (
            <div>
              <p className="eyebrow">IDENTITY &amp; BRANDING</p>
              <h1>Profile &amp; Appearance</h1>
              <p>Configure your public headline, introduction, avatar portrait, and 3D guide welcome script.</p>

              <form className="edit-form" onSubmit={handleProfileSave}>
                <div className="form-grid">
                  <label>
                    Full Name *
                    <input
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </label>

                  <label>
                    Headline / Tagline
                    <input
                      value={profileForm.tagline}
                      onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                      placeholder="e.g. Operations Coordination · Team Leadership"
                    />
                  </label>

                  <label>
                    Current Role / Position
                    <input
                      value={profileForm.role}
                      onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                    />
                  </label>

                  <label>
                    Current Organization / Company
                    <input
                      value={profileForm.company}
                      onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                    />
                  </label>

                  <label>
                    Degree Summary
                    <input
                      value={profileForm.degree}
                      onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                    />
                  </label>

                  <label>
                    University / Institution
                    <input
                      value={profileForm.university}
                      onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    Brief Biography (Shown in Hero Section)
                    <textarea
                      rows={4}
                      value={profileForm.about}
                      onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    Welcome Message (Speech Bubble)
                    <input
                      value={profileForm.welcome_text}
                      onChange={(e) => setProfileForm({ ...profileForm, welcome_text: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    3D Guide Avatar Dialogue
                    <input
                      value={profileForm.guide_dialogue}
                      onChange={(e) => setProfileForm({ ...profileForm, guide_dialogue: e.target.value })}
                    />
                  </label>

                  <div className="full" style={{ border: '1px dashed var(--line)', padding: '20px', borderRadius: '6px' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>Profile Portrait Photo</p>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      {profileForm.photo_filename ? (
                        <img
                          src={profileForm.photo_filename}
                          alt="Current portrait"
                          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--teal)' }}
                        />
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                          SR
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, (url) => setProfileForm({ ...profileForm, photo_filename: url }));
                            }
                          }}
                        />
                        {profileForm.photo_filename && (
                          <button
                            type="button"
                            className="text-button danger"
                            style={{ display: 'block', marginTop: '6px' }}
                            onClick={() => setProfileForm({ ...profileForm, photo_filename: '' })}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button className="btn primary" type="submit">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. ABOUT ME & SUMMARY */}
          {activeSection === 'about_me' && (
            <div>
              <p className="eyebrow">COMPREHENSIVE SUMMARY</p>
              <h1>About Me &amp; Professional Summary</h1>
              <p>Customize your detailed narrative, interests, academic background, and professional goals.</p>

              <form className="edit-form" onSubmit={handleProfileSave}>
                <div className="form-grid">
                  <label className="full">
                    Professional Summary
                    <textarea
                      rows={5}
                      value={profileForm.professional_summary || profileForm.about}
                      onChange={(e) => setProfileForm({ ...profileForm, professional_summary: e.target.value })}
                      placeholder="Results driven professional with hands on experience..."
                    />
                  </label>

                  <label className="full">
                    Core Interests &amp; Aspirations
                    <textarea
                      rows={3}
                      value={profileForm.interests || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                      placeholder="Operations, Robotics, Machine Learning, Program Management..."
                    />
                  </label>

                  <label className="full">
                    Education &amp; Academic Direction Summary
                    <textarea
                      rows={3}
                      value={profileForm.education_summary || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, education_summary: e.target.value })}
                      placeholder="Bachelor of Science in CSE (Data Science) and Master of Science in AI & ML..."
                    />
                  </label>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button className="btn primary" type="submit">
                    Save About Me Information
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. SKILLS & PROFICIENCY */}
          {activeSection === 'skills' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">COMPETENCIES</p>
                  <h1>Skills &amp; Proficiency</h1>
                </div>
                <button className="btn primary" type="button" onClick={() => openNew('skill')}>
                  ＋ Add New Skill
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Skill Name</th>
                      <th>Category / Group</th>
                      <th>Proficiency Level</th>
                      <th>Order</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillsList.map((skill) => (
                      <tr key={skill.id}>
                        <td><strong>{skill.title}</strong></td>
                        <td>{skill.data?.group || 'General'}</td>
                        <td><span className="status-tag">{skill.data?.level || 'Proficient'}</span></td>
                        <td>{skill.sort_order}</td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(skill)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(skill.id, skill.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. PROFESSIONAL EXPERIENCE */}
          {activeSection === 'experience' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">CAREER MILESTONES</p>
                  <h1>Professional Experience</h1>
                </div>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    openNew('career');
                    setItemForm((prev) => ({ ...prev, data: { ...prev.data, type: 'Professional Experience' } }));
                  }}
                >
                  ＋ Add Experience
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Position / Role</th>
                      <th>Organization / Location</th>
                      <th>Dates / Period</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experienceList.map((exp) => (
                      <tr key={exp.id}>
                        <td><strong>{exp.title}</strong></td>
                        <td>{exp.data?.organization}</td>
                        <td>{exp.data?.period}</td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(exp)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(exp.id, exp.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. EDUCATION & DEGREES */}
          {activeSection === 'education' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">ACADEMIC BACKGROUND</p>
                  <h1>Education &amp; Degrees</h1>
                </div>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    openNew('career');
                    setItemForm((prev) => ({ ...prev, data: { ...prev.data, type: 'Education' } }));
                  }}
                >
                  ＋ Add Education Record
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Degree &amp; Program</th>
                      <th>University / Institution</th>
                      <th>Dates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {educationList.map((edu) => (
                      <tr key={edu.id}>
                        <td><strong>{edu.title}</strong></td>
                        <td>{edu.data?.organization}</td>
                        <td>{edu.data?.period}</td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(edu)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(edu.id, edu.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. PROJECTS & INVENTIONS */}
          {activeSection === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">PORTFOLIO WORK</p>
                  <h1>Projects &amp; Innovation</h1>
                </div>
                <button className="btn primary" type="button" onClick={() => openNew('project')}>
                  ＋ Add New Project
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Category</th>
                      <th>Featured</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsList.map((proj) => (
                      <tr key={proj.id}>
                        <td>
                          <strong>{proj.title}</strong>
                          {proj.data?.summary && <small style={{ display: 'block' }}>{proj.data.summary.substring(0, 60)}...</small>}
                        </td>
                        <td>{proj.data?.category}</td>
                        <td>{proj.data?.featured ? <span style={{ color: 'var(--teal)' }}>★ Yes</span> : 'No'}</td>
                        <td><span className="status-tag">{proj.status}</span></td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(proj)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(proj.id, proj.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. RESEARCH PUBLICATIONS */}
          {activeSection === 'publications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">ACADEMIC RESEARCH</p>
                  <h1>Research Publications</h1>
                </div>
                <button className="btn primary" type="button" onClick={() => openNew('publication')}>
                  ＋ Add Publication
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Paper Title</th>
                      <th>Venue / Year</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicationsList.map((pub) => (
                      <tr key={pub.id}>
                        <td>
                          <strong>{pub.title}</strong>
                          <small style={{ display: 'block' }}>{pub.data?.authors}</small>
                        </td>
                        <td>{pub.data?.venue} ({pub.data?.year})</td>
                        <td><span className="status-tag">{pub.data?.publication_status || pub.status}</span></td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(pub)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(pub.id, pub.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. OUTREACH & LEADERSHIP */}
          {activeSection === 'outreach' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">COMMUNITY &amp; LEADERSHIP</p>
                  <h1>Clubs, Leadership &amp; Activities</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn primary" type="button" onClick={() => openNew('club')}>
                    ＋ Add Club / Organization
                  </button>
                  <button className="btn" type="button" onClick={() => openNew('activity')}>
                    ＋ Add Activity / Event
                  </button>
                </div>
              </div>

              <h3 style={{ marginTop: '24px' }}>Organizations &amp; Student Clubs ({clubsList.length})</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Club / Organization</th>
                      <th>Institution</th>
                      <th>Role / Relationship</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubsList.map((club) => (
                      <tr key={club.id}>
                        <td><strong>{club.title}</strong></td>
                        <td>{club.data?.institution}</td>
                        <td>{club.data?.relationship}</td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(club)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(club.id, club.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 style={{ marginTop: '32px' }}>Activities &amp; Events ({activitiesList.length})</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Activity Title</th>
                      <th>Type / Date</th>
                      <th>Outcome</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activitiesList.map((act) => (
                      <tr key={act.id}>
                        <td><strong>{act.title}</strong></td>
                        <td>{act.data?.type} · {act.data?.date}</td>
                        <td>{act.data?.outcome?.substring(0, 50)}</td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(act)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(act.id, act.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. CERTIFICATES & CREDENTIALS */}
          {activeSection === 'certificates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">VERIFIED CREDENTIALS</p>
                  <h1>Certificates &amp; Licenses</h1>
                </div>
                <button className="btn primary" type="button" onClick={() => openNew('certificate')}>
                  ＋ Add Certificate
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Certificate Title</th>
                      <th>Issuer</th>
                      <th>Date</th>
                      <th>Verification URL</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificatesList.map((cert) => (
                      <tr key={cert.id}>
                        <td><strong>{cert.title}</strong></td>
                        <td>{cert.data?.issuer}</td>
                        <td>{cert.data?.issue_date}</td>
                        <td>
                          {cert.data?.verification_url ? (
                            <a href={cert.data.verification_url} target="_blank" rel="noopener noreferrer">Verify ↗</a>
                          ) : '—'}
                        </td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(cert)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(cert.id, cert.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 11. TROPHY ROOM & AWARDS */}
          {activeSection === 'awards' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">HONORS &amp; RECOGNITION</p>
                  <h1>Trophy Room &amp; Awards</h1>
                </div>
                <button className="btn primary" type="button" onClick={() => openNew('crest')}>
                  ＋ Add Award / Honor
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Award Title</th>
                      <th>Issuer / Year</th>
                      <th>Reason / Recognition</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awardsList.map((award) => (
                      <tr key={award.id}>
                        <td><strong>{award.title}</strong></td>
                        <td>{award.data?.issuer} ({award.data?.date})</td>
                        <td>{award.data?.reason}</td>
                        <td className="actions">
                          <button type="button" className="text-button" onClick={() => openEdit(award)}>Edit</button>
                          <button type="button" className="text-button danger" onClick={() => handleDeleteItem(award.id, award.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 12. CV / RESUME MANAGER */}
          {activeSection === 'cv_resume' && (
            <div>
              <p className="eyebrow">DOCUMENT ARCHITECTURE</p>
              <h1>CV / Resume Management</h1>
              <p>Upload and replace your resume PDF. The website links and download buttons automatically update.</p>

              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: '24px', borderRadius: '8px', maxWidth: '650px' }}>
                <p><strong>Current Active Resume:</strong></p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--ivory)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '1.8rem' }}>📄</span>
                  <div style={{ flex: 1, wordBreak: 'break-all' }}>
                    <strong>{profile.cv_filename || 'No CV currently attached'}</strong>
                  </div>
                  {profile.cv_filename && (
                    <a className="btn" href={profile.cv_filename} target="_blank" rel="noopener noreferrer">
                      Open PDF ↗
                    </a>
                  )}
                </div>

                <div style={{ marginTop: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                    Upload New CV (PDF only, max 15MB)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          showFlash('Please select a valid PDF document.', 'error');
                          return;
                        }
                        await handleFileUpload(file, async (url) => {
                          await updateProfile({ cv_filename: url });
                          setProfileForm((prev) => ({ ...prev, cv_filename: url }));
                          showFlash('New CV uploaded and active across the site!', 'success');
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 13. CONTACT & MAP COORDINATES */}
          {activeSection === 'contact' && (
            <div>
              <p className="eyebrow">COMMUNICATION CHANNELS</p>
              <h1>Contact Information &amp; Location Map</h1>
              <p>Configure your public email, phone, location address, and embedded interactive map.</p>

              <form className="edit-form" onSubmit={handleProfileSave}>
                <div className="form-grid">
                  <label>
                    Public Email
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </label>

                  <label>
                    Public Phone
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </label>

                  <label>
                    Personal Website / Portfolio
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    />
                  </label>

                  <label>
                    LinkedIn URL
                    <input
                      type="url"
                      value={profileForm.linkedin}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                    />
                  </label>

                  <label>
                    GitHub URL
                    <input
                      type="url"
                      value={profileForm.github}
                      onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    Contact Form Introduction Text
                    <textarea
                      rows={2}
                      value={profileForm.contact_intro}
                      onChange={(e) => setProfileForm({ ...profileForm, contact_intro: e.target.value })}
                    />
                  </label>

                  <h3 className="subheading full">Location &amp; OpenStreetMap Coordinates</h3>

                  <label>
                    Location Label
                    <input
                      value={profileForm.location_label}
                      onChange={(e) => setProfileForm({ ...profileForm, location_label: e.target.value })}
                      placeholder="e.g. Banasree, East Rampura, Dhaka"
                    />
                  </label>

                  <label>
                    Public City / Area
                    <input
                      value={profileForm.location_address}
                      onChange={(e) => setProfileForm({ ...profileForm, location_address: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    Map Embed URL (OpenStreetMap)
                    <input
                      value={profileForm.map_url}
                      onChange={(e) => setProfileForm({ ...profileForm, map_url: e.target.value })}
                    />
                  </label>

                  <label>
                    Latitude
                    <input
                      value={profileForm.map_lat}
                      onChange={(e) => setProfileForm({ ...profileForm, map_lat: e.target.value })}
                    />
                  </label>

                  <label>
                    Longitude
                    <input
                      value={profileForm.map_lng}
                      onChange={(e) => setProfileForm({ ...profileForm, map_lng: e.target.value })}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button className="btn primary" type="submit">
                    Save Contact &amp; Map Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 14. WEBSITE SETTINGS & SEO */}
          {activeSection === 'settings' && (
            <div>
              <p className="eyebrow">CONFIGURATION</p>
              <h1>Website Settings &amp; SEO Metadata</h1>
              <p>Configure search engine title tags, meta descriptions, OpenGraph sharing image, theme, and language.</p>

              <form className="edit-form" onSubmit={handleSettingsSave}>
                <div className="form-grid">
                  <label className="full">
                    SEO Site Title
                    <input
                      required
                      value={settingsForm.site_title}
                      onChange={(e) => setSettingsForm({ ...settingsForm, site_title: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    Meta Description (for Search Engines &amp; Social Previews)
                    <textarea
                      rows={3}
                      value={settingsForm.meta_description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, meta_description: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    Social Sharing Image (OG Image URL)
                    <input
                      value={settingsForm.social_image_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, social_image_url: e.target.value })}
                    />
                  </label>

                  <label>
                    Default Language
                    <select
                      value={settingsForm.default_language}
                      onChange={(e) => setSettingsForm({ ...settingsForm, default_language: e.target.value as 'en' | 'bn' })}
                    >
                      <option value="en">English</option>
                      <option value="bn">বাংলা (Bengali)</option>
                    </select>
                  </label>

                  <label>
                    Default Color Theme
                    <select
                      value={settingsForm.default_theme}
                      onChange={(e) => setSettingsForm({ ...settingsForm, default_theme: e.target.value as 'light' | 'dark' })}
                    >
                      <option value="dark">Dark Theme (Default)</option>
                      <option value="light">Light Theme</option>
                    </select>
                  </label>

                  <label>
                    Interactive 3D Studio Office
                    <select
                      value={settingsForm.enable_3d_studio ? 'true' : 'false'}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enable_3d_studio: e.target.value === 'true' })}
                    >
                      <option value="true">Enabled (WebGL 3D Room)</option>
                      <option value="false">Disabled (Minimal Clean View)</option>
                    </select>
                  </label>

                  <label>
                    Contact Recipient Notification Email
                    <input
                      type="email"
                      value={settingsForm.contact_recipient_email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contact_recipient_email: e.target.value })}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button className="btn primary" type="submit">
                    Save Website Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 15. MEDIA LIBRARY */}
          {activeSection === 'media' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">ASSETS</p>
                  <h1>Media Library ({media.length} files)</h1>
                </div>
                <label className="btn primary" style={{ cursor: 'pointer' }}>
                  ＋ Upload File
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, () => {});
                    }}
                  />
                </label>
              </div>

              <p>Uploaded images and PDF certificates. Supported formats: JPG, PNG, WEBP, GIF, SVG, PDF (up to 15MB).</p>

              <div className="table-wrap" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>File Name</th>
                      <th>Type / Size</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {media.length > 0 ? (
                      media.map((m) => (
                        <tr key={m.id}>
                          <td>
                            {m.mime.startsWith('image/') ? (
                              <img
                                src={m.data_url || m.filename}
                                alt={m.original_name}
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            ) : (
                              <span style={{ fontSize: '1.8rem' }}>📄</span>
                            )}
                          </td>
                          <td>
                            <strong>{m.original_name}</strong>
                            <small style={{ display: 'block', color: 'var(--muted)' }}>{m.filename}</small>
                          </td>
                          <td>
                            {m.mime}
                            {m.size_bytes && <small style={{ display: 'block' }}>{(m.size_bytes / 1024).toFixed(1)} KB</small>}
                          </td>
                          <td>{new Date(m.created_at).toLocaleDateString()}</td>
                          <td className="actions">
                            {m.data_url && (
                              <a
                                href={m.data_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-button"
                              >
                                View ↗
                              </a>
                            )}
                            <button
                              type="button"
                              className="text-button danger"
                              onClick={async () => {
                                if (window.confirm(`Delete ${m.original_name}?`)) {
                                  await deleteMediaItem(m.filename);
                                  showFlash('Media deleted.', 'success');
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>No uploaded media items yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 16. MESSAGES INBOX */}
          {activeSection === 'messages' && (
            <div>
              <p className="eyebrow">COMMUNICATION</p>
              <h1>Contact Messages Inbox</h1>
              <p>Review messages received through your portfolio contact form.</p>

              <div className="message-list" style={{ marginTop: '20px' }}>
                {messages.length > 0 ? (
                  messages.map((m) => (
                    <article key={m.id} className={`message-card ${!m.is_read ? 'unread' : ''}`}>
                      <header>
                        <strong>{m.name}</strong>
                        <a href={`mailto:${m.email}`}>{m.email}</a>
                        <small>{m.created_at}</small>
                      </header>
                      <p style={{ marginTop: '12px', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                      <footer className="actions" style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                        {!m.is_read && (
                          <button
                            className="text-button"
                            type="button"
                            onClick={async () => {
                              await markMessageRead(m.id);
                              showFlash('Marked as read.', 'success');
                            }}
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          className="text-button danger"
                          type="button"
                          onClick={async () => {
                            if (window.confirm('Delete this message?')) {
                              await deleteMessage(m.id);
                              showFlash('Message deleted.', 'success');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </footer>
                    </article>
                  ))
                ) : (
                  <p className="empty">No messages received yet.</p>
                )}
              </div>
            </div>
          )}

          {/* 17. DATABASE BACKUP & EXPORT */}
          {activeSection === 'backup' && (
            <div>
              <p className="eyebrow">DATA PORTABILITY &amp; RESILIENCE</p>
              <h1>Database Backup &amp; Restore</h1>
              <p>
                Your portfolio content is stored in a resilient browser database (IndexedDB).
                You can download a complete JSON snapshot of your database anytime, or restore it onto another device.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }}>
                <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: '24px', borderRadius: '8px' }}>
                  <h3>⬇ Export Full Backup</h3>
                  <p className="muted" style={{ fontSize: '0.9rem' }}>
                    Downloads all profile data, content items, media files, and settings as a single portable JSON file.
                  </p>
                  <button className="btn primary" type="button" onClick={handleDownloadBackup} style={{ marginTop: '16px' }}>
                    Download Backup (JSON)
                  </button>
                </div>

                <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: '24px', borderRadius: '8px' }}>
                  <h3>⬆ Restore from Backup</h3>
                  <p className="muted" style={{ fontSize: '0.9rem' }}>
                    Select a previously downloaded backup JSON file to restore all website content.
                  </p>
                  <input
                    type="file"
                    ref={restoreFileInputRef}
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={handleRestoreBackup}
                  />
                  <button
                    className="btn"
                    type="button"
                    onClick={() => restoreFileInputRef.current?.click()}
                    style={{ marginTop: '16px' }}
                  >
                    Select Backup File &amp; Restore
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 18. SECURITY & PASSWORD */}
          {activeSection === 'security' && (
            <div>
              <p className="eyebrow">ACCESS CONTROL</p>
              <h1>Security &amp; Password Management</h1>
              <p>Change your administrator password securely using cryptographic verification.</p>

              <div style={{ maxWidth: '500px', background: 'var(--panel)', padding: '24px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <h3>Change Administrator Password</h3>
                <form onSubmit={handleChangePassword}>
                  <label>
                    Current Password
                    <input
                      type="password"
                      required
                      value={changePwForm.currentPassword}
                      onChange={(e) => setChangePwForm({ ...changePwForm, currentPassword: e.target.value })}
                    />
                  </label>
                  <label>
                    New Password (min 8 characters)
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={changePwForm.newPassword}
                      onChange={(e) => setChangePwForm({ ...changePwForm, newPassword: e.target.value })}
                    />
                  </label>
                  <label>
                    Confirm New Password
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={changePwForm.confirmPassword}
                      onChange={(e) => setChangePwForm({ ...changePwForm, confirmPassword: e.target.value })}
                    />
                  </label>

                  <button className="btn primary" type="submit" style={{ marginTop: '16px' }}>
                    Update Password
                  </button>
                </form>

                <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
                  <h4>Account Recovery Key</h4>
                  <p className="muted" style={{ fontSize: '0.85rem' }}>
                    Emergency recovery code registered with this account:
                  </p>
                  <div style={{ background: '#111', color: '#67b7ff', padding: '10px', fontFamily: 'monospace', borderRadius: '4px', textAlign: 'center' }}>
                    {adminAccount.recovery_token}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GENERIC CRUD EDIT / NEW MODAL DIALOG */}
          {(editingItem || isCreatingNew) && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.75)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => {
                setEditingItem(null);
                setIsCreatingNew(false);
              }}
            >
              <div
                style={{
                  background: 'var(--panel)',
                  padding: '32px',
                  borderRadius: '8px',
                  maxWidth: '750px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>
                    {isCreatingNew ? 'Create New' : 'Edit'} {itemForm.kind.toUpperCase()}
                  </h2>
                  <button
                    type="button"
                    style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreatingNew(false);
                    }}
                  >
                    ×
                  </button>
                </div>

                <form className="edit-form" onSubmit={handleSaveItemForm}>
                  <div className="form-grid">
                    <label>
                      Title / Headline *
                      <input
                        required
                        value={itemForm.title}
                        onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                      />
                    </label>

                    <label>
                      URL Slug
                      <input
                        value={itemForm.slug}
                        onChange={(e) => setItemForm({ ...itemForm, slug: e.target.value })}
                        placeholder="Auto-generated if left blank"
                      />
                    </label>

                    <label>
                      Status
                      <select
                        value={itemForm.status}
                        onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as any })}
                      >
                        <option value="published">Published (Visible on site)</option>
                        <option value="draft">Draft (Hidden from site)</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </label>

                    <label>
                      Display Sort Order
                      <input
                        type="number"
                        value={itemForm.sort_order}
                        onChange={(e) => setItemForm({ ...itemForm, sort_order: Number(e.target.value) || 0 })}
                      />
                    </label>

                    {/* Section-specific inputs */}
                    {itemForm.kind === 'project' && (
                      <>
                        <label>
                          Category
                          <input
                            value={itemForm.data.category || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, category: e.target.value } })}
                            placeholder="e.g. Artificial Intelligence, Web Systems"
                          />
                        </label>

                        <label>
                          Featured Status
                          <select
                            value={itemForm.data.featured ? 'true' : 'false'}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, featured: e.target.value === 'true' } })}
                          >
                            <option value="false">Standard Project</option>
                            <option value="true">★ Featured Project</option>
                          </select>
                        </label>

                        <label className="full">
                          Technologies (Comma separated)
                          <input
                            value={itemForm.data.technologies || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, technologies: e.target.value } })}
                            placeholder="Python, Streamlit, Scikit-learn, PyTorch"
                          />
                        </label>

                        <label>
                          GitHub URL
                          <input
                            type="url"
                            value={itemForm.data.github || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, github: e.target.value } })}
                          />
                        </label>

                        <label>
                          Live Demo URL
                          <input
                            type="url"
                            value={itemForm.data.demo || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, demo: e.target.value } })}
                          />
                        </label>

                        <label className="full">
                          Project Summary / Description
                          <textarea
                            rows={3}
                            value={itemForm.data.summary || itemForm.data.description || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, summary: e.target.value, description: e.target.value } })}
                          />
                        </label>

                        <label className="full">
                          Objective &amp; Role
                          <input
                            value={itemForm.data.role || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, role: e.target.value } })}
                            placeholder="e.g. Capstone Project Lead Developer"
                          />
                        </label>

                        <label className="full">
                          Outcomes &amp; Results
                          <textarea
                            rows={2}
                            value={itemForm.data.result || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, result: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {itemForm.kind === 'publication' && (
                      <>
                        <label className="full">
                          Authors
                          <input
                            value={itemForm.data.authors || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, authors: e.target.value } })}
                            placeholder="e.g. Saifur Rahman, et al."
                          />
                        </label>

                        <label>
                          Conference / Venue
                          <input
                            value={itemForm.data.venue || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, venue: e.target.value } })}
                            placeholder="e.g. ICIDA 2025 | arXiv"
                          />
                        </label>

                        <label>
                          Publication Date / Year
                          <input
                            value={itemForm.data.year || itemForm.data.publication_date || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, year: e.target.value, publication_date: e.target.value } })}
                          />
                        </label>

                        <label>
                          Topic / Domain
                          <input
                            value={itemForm.data.topic || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, topic: e.target.value } })}
                          />
                        </label>

                        <label>
                          Paper / arXiv Link
                          <input
                            type="url"
                            value={itemForm.data.paper_url || itemForm.data.doi || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, paper_url: e.target.value, doi: e.target.value } })}
                          />
                        </label>

                        <label className="full">
                          Abstract / Description
                          <textarea
                            rows={4}
                            value={itemForm.data.abstract || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, abstract: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {itemForm.kind === 'certificate' && (
                      <>
                        <label>
                          Issuing Organization
                          <input
                            value={itemForm.data.issuer || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, issuer: e.target.value } })}
                            placeholder="e.g. UNICEF / Data Solution 360 Ltd"
                          />
                        </label>

                        <label>
                          Issue Date
                          <input
                            value={itemForm.data.issue_date || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, issue_date: e.target.value } })}
                            placeholder="e.g. July 2026"
                          />
                        </label>

                        <label>
                          Credential ID
                          <input
                            value={itemForm.data.credential_id || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, credential_id: e.target.value } })}
                          />
                        </label>

                        <label>
                          Verification URL
                          <input
                            type="url"
                            value={itemForm.data.verification_url || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, verification_url: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {itemForm.kind === 'skill' && (
                      <>
                        <label>
                          Skill Group / Category
                          <input
                            value={itemForm.data.group || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, group: e.target.value } })}
                            placeholder="Operations, Technical, Management"
                          />
                        </label>

                        <label>
                          Proficiency Level
                          <select
                            value={itemForm.data.level || 'Advanced'}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, level: e.target.value } })}
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Proficient">Proficient</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                            <option value="Lead">Lead</option>
                          </select>
                        </label>

                        <label className="full">
                          Skill Description / Competency
                          <input
                            value={itemForm.data.description || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, description: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {itemForm.kind === 'career' && (
                      <>
                        <label>
                          Organization / University
                          <input
                            value={itemForm.data.organization || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, organization: e.target.value } })}
                          />
                        </label>

                        <label>
                          Period / Dates
                          <input
                            value={itemForm.data.period || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, period: e.target.value } })}
                            placeholder="e.g. 06/2026 – 07/2026"
                          />
                        </label>

                        <label>
                          Record Type
                          <select
                            value={itemForm.data.type || 'Professional Experience'}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, type: e.target.value } })}
                          >
                            <option value="Professional Experience">Professional Experience</option>
                            <option value="Education">Education</option>
                            <option value="Higher Education">Higher Education</option>
                            <option value="Leadership & Operations">Leadership &amp; Operations</option>
                          </select>
                        </label>

                        <label className="full">
                          Responsibilities &amp; Achievements
                          <textarea
                            rows={3}
                            value={itemForm.data.description || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, description: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {itemForm.kind === 'crest' && (
                      <>
                        <label>
                          Awarding Body / Organization
                          <input
                            value={itemForm.data.issuer || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, issuer: e.target.value } })}
                            placeholder="e.g. TCL Global Bangladesh"
                          />
                        </label>

                        <label>
                          Year / Date
                          <input
                            value={itemForm.data.date || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, date: e.target.value } })}
                            placeholder="e.g. 2026"
                          />
                        </label>

                        <label className="full">
                          Reason / Description of Achievement
                          <textarea
                            rows={3}
                            value={itemForm.data.reason || itemForm.data.description || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, reason: e.target.value, description: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {itemForm.kind === 'club' && (
                      <>
                        <label>
                          Affiliated Institution
                          <input
                            value={itemForm.data.institution || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, institution: e.target.value } })}
                            placeholder="e.g. East West University"
                          />
                        </label>

                        <label>
                          Leadership Role / Relationship
                          <input
                            value={itemForm.data.relationship || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, relationship: e.target.value } })}
                            placeholder="e.g. General Secretary (GS)"
                          />
                        </label>

                        <label>
                          Club Website / Social Link
                          <input
                            type="url"
                            value={itemForm.data.website || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, website: e.target.value } })}
                          />
                        </label>

                        <label className="full">
                          Club Description &amp; Scope
                          <textarea
                            rows={3}
                            value={itemForm.data.description || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, description: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {itemForm.kind === 'activity' && (
                      <>
                        <label>
                          Activity Type
                          <input
                            value={itemForm.data.type || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, type: e.target.value } })}
                            placeholder="Event, Workshop, Meeting, Campaign"
                          />
                        </label>

                        <label>
                          Date / Timeline
                          <input
                            value={itemForm.data.date || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, date: e.target.value } })}
                          />
                        </label>

                        <label className="full">
                          Personal Contribution
                          <textarea
                            rows={2}
                            value={itemForm.data.contribution || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, contribution: e.target.value } })}
                          />
                        </label>

                        <label className="full">
                          Outcomes &amp; Results
                          <textarea
                            rows={2}
                            value={itemForm.data.outcome || ''}
                            onChange={(e) => setItemForm({ ...itemForm, data: { ...itemForm.data, outcome: e.target.value } })}
                          />
                        </label>
                      </>
                    )}

                    {/* Image / Attachment Upload */}
                    <div className="full" style={{ border: '1px dashed var(--line)', padding: '16px', borderRadius: '6px', marginTop: '10px' }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>Media Attachment (Image or Certificate PDF)</p>
                      {itemForm.data.image_filename && (
                        <p className="muted" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                          Current Attachment: {itemForm.data.image_filename}
                        </p>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, (url) => {
                              setItemForm((prev) => ({
                                ...prev,
                                data: { ...prev.data, image_filename: url },
                              }));
                            });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setIsCreatingNew(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button className="btn primary" type="submit">
                      Save Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
