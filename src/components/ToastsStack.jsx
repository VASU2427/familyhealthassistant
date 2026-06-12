import React from 'react';
import { useHealth } from '../context/HealthContext';
import Icon from './Icon';

export function ToastsStack() {
  const { toasts, removeToast } = useHealth();
  return (
    <div className="toast-container" style={{ position: 'fixed', bottom: '70px', left: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div 
          key={t.id} 
          className="toast-card" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '0.65rem 0.85rem', 
            background: 'var(--bg-glass)', 
            border: '1px solid var(--border-color)', 
            borderLeft: '4px solid var(--color-primary)', 
            borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            pointerEvents: 'auto',
            borderLeftColor: t.type === 'success' ? 'var(--color-success)' : t.type === 'warning' ? 'var(--color-warning)' : t.type === 'danger' ? 'var(--color-danger)' : 'var(--color-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <Icon 
              name={t.type === 'danger' ? 'alert' : 'check'} 
              size={14} 
              color={t.type === 'danger' ? 'var(--color-danger)' : 'var(--color-success)'} 
            />
            <span>{t.text}</span>
          </div>
          <button 
            onClick={() => removeToast(t.id)} 
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastsStack;
