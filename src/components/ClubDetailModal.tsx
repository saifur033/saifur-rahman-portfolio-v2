import React from 'react';
import { ContentItem } from '../types';
import { translations } from '../i18n/translations';

interface ClubDetailModalProps {
  club: ContentItem | null;
  activities: ContentItem[];
  crests: ContentItem[];
  lang?: 'en' | 'bn';
  onClose: () => void;
}

export const ClubDetailModal: React.FC<ClubDetailModalProps> = ({
  club,
  activities,
  crests,
  lang = 'en',
  onClose,
}) => {
  if (!club) return null;

  const t = translations[lang] || translations.en;
  const tm = t.clubModal;

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
        className="room-panel"
        style={{
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--panel)',
          padding: '28px',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p className="eyebrow" style={{ margin: 0 }}>{tm.kicker}</p>
          <button
            className="dialog-close"
            type="button"
            onClick={onClose}
            aria-label={tm.close}
            style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ×
          </button>
        </div>

        <h1 style={{ marginTop: 0 }}>{club.title}</h1>
        {club.data.institution && <p className="subline" style={{ fontWeight: 600 }}>{club.data.institution}</p>}
        {club.data.relationship && <p className="muted">{club.data.relationship}</p>}
        {club.data.description && <p style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>{club.data.description}</p>}

        {club.data.website && (
          <p style={{ marginTop: '16px' }}>
            <a href={club.data.website} target="_blank" rel="noopener noreferrer" className="btn">
              {tm.visitWebsite}
            </a>
          </p>
        )}

        {activities.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h3 className="subheading">{tm.relatedActivities} ({activities.length})</h3>
            <div style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
              {activities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    border: '1px solid var(--line)',
                    padding: '16px',
                    borderRadius: '6px',
                    background: 'var(--ivory)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong>{act.title}</strong>
                    <span className="activity-date">{act.data.date}</span>
                  </div>
                  {act.data.description && <p style={{ margin: '4px 0' }}>{act.data.description}</p>}
                  {act.data.outcome && <p className="muted" style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>{tm.outcome}:</strong> {act.data.outcome}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {crests.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h3 className="subheading">{tm.relatedHonors} ({crests.length})</h3>
            <div style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
              {crests.map((crest) => (
                <div
                  key={crest.id}
                  style={{
                    border: '1px solid var(--line)',
                    padding: '16px',
                    borderRadius: '6px',
                    background: 'var(--ivory)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong>{crest.title}</strong>
                    <span className="muted">{crest.data.date}</span>
                  </div>
                  {crest.data.description && <p style={{ margin: '4px 0' }}>{crest.data.description}</p>}
                  {crest.data.reason && <p className="muted" style={{ margin: '4px 0', fontSize: '0.9rem' }}>{crest.data.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'right' }}>
          <button className="btn" type="button" onClick={onClose}>
            {tm.close}
          </button>
        </div>
      </div>
    </div>
  );
};
