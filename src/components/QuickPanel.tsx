import React from 'react';
import { Profile } from '../types';
import { translations } from '../i18n/translations';

interface QuickPanelProps {
  isOpen: boolean;
  profile: Profile;
  lang?: 'en' | 'bn';
  onClose: () => void;
  onNavigate: (roomId: string) => void;
}

export const QuickPanel: React.FC<QuickPanelProps> = ({
  isOpen,
  profile,
  lang = 'en',
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const t = translations[lang] || translations.en;

  const links = [
    { id: 'about', label: t.rooms.about },
    { id: 'projects', label: t.rooms.projects },
    { id: 'publications', label: t.rooms.publications },
    { id: 'outreach', label: t.rooms.outreach },
    { id: 'certificates', label: t.rooms.certificates },
    { id: 'trophies', label: t.rooms.trophies },
    { id: 'gallery', label: t.rooms.gallery },
    { id: 'contact', label: t.rooms.contact },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="quick-panel"
        style={{
          display: 'block',
          position: 'relative',
          maxWidth: '480px',
          width: '100%',
          background: 'var(--panel)',
          padding: '28px',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="dialog-close"
          type="button"
          aria-label={t.quickView.close}
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="quickTitle" style={{ marginTop: 0 }}>{t.quickView.title}</h2>
        {profile.name && (
          <p>
            <strong>{profile.name}</strong>
            {profile.role ? ` · ${profile.role}` : ''}
          </p>
        )}
        {profile.tagline && <p className="muted">{profile.tagline}</p>}

        <nav aria-label="Quick navigation" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              className="btn"
              style={{ textAlign: 'left', width: '100%' }}
              onClick={() => {
                onNavigate(link.id);
                onClose();
              }}
            >
              {link.label} ↗
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
