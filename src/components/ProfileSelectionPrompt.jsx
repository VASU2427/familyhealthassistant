import React from 'react';
import { useHealth } from '../context/HealthContext';
import { renderAvatar, themeColors } from './MemberAvatar';

export function ProfileSelectionPrompt({ title }) {
  const { members, setActiveMemberId } = useHealth();
  
  return (
    <div className="fade-in" style={{ padding: '1rem', textAlign: 'center' }}>
      <div style={{ margin: '1.5rem auto 1rem auto', width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
        👥
      </div>
      <h3 style={{ fontSize: '0.95rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
        Select a Profile
      </h3>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '260px', margin: '0 auto 1.5rem auto' }}>
        Please select a family member to access their personalized {title}.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {members.map(m => {
          const memberTheme = m.colorTheme || 'teal';
          const memberPrimaryColor = themeColors[memberTheme]?.primary || 'var(--color-primary)';
          return (
            <div
              key={m.id}
              className="glass-panel"
              onClick={() => setActiveMemberId(m.id)}
              style={{
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `2px solid ${memberPrimaryColor}`,
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                  flexShrink: 0
                }}
              >
                {renderAvatar(m, '100%')}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block' }}>{m.name}</strong>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{m.relation}</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>→</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProfileSelectionPrompt;
