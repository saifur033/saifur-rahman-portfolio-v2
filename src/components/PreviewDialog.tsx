import React from 'react';
import { translations } from '../i18n/translations';

interface PreviewDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  imageSrc?: string;
  lang?: 'en' | 'bn';
  onClose: () => void;
}

export const PreviewDialog: React.FC<PreviewDialogProps> = ({
  isOpen,
  title,
  description,
  imageSrc,
  lang = 'en',
  onClose,
}) => {
  if (!isOpen) return null;

  const t = translations[lang] || translations.en;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        className="preview-dialog"
        style={{
          position: 'relative',
          maxWidth: '650px',
          width: '100%',
          background: 'var(--panel)',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'block',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="dialog-close"
          type="button"
          aria-label={t.preview.close}
          onClick={onClose}
        >
          ×
        </button>

        {imageSrc && (
          <img
            src={imageSrc}
            alt={title}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'contain',
              marginBottom: '16px',
              borderRadius: '4px',
              background: '#111',
            }}
          />
        )}

        <h2 id="previewTitle" style={{ marginTop: 0 }}>
          {title}
        </h2>
        <p id="previewDescription" style={{ color: 'var(--muted)' }}>
          {description}
        </p>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button className="btn" type="button" onClick={onClose}>
            {t.preview.close}
          </button>
        </div>
      </div>
    </div>
  );
};
