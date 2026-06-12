import React from 'react';
import { renderAvatar, themeColors } from './MemberAvatar';

export function GlanceCard({
  activeMemberId,
  members,
  allVitals,
  selectProfile,
  onLogMedicalEvent,
  activeMember
}) {
  if (activeMemberId === 'household') {
    return (
      <div className="glance-health-card">
        <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.6rem' }}>
          Family Health Summary
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map(m => {
            const memberVitals = allVitals[m.id] || [];
            const latest = memberVitals.length > 0 ? memberVitals[memberVitals.length - 1] : null;

            let isStable = true;
            let statusText = 'Stable';
            let vitalSummaryStr = 'No recent readings';

            if (latest) {
              const sys = latest.bpSystolic;
              const dia = latest.bpDiastolic;
              const gluc = latest.glucose;
              const hr = latest.heartRate;
              const ox = latest.oxygen;

              if (m.id === 'baby') {
                if ((hr && (hr > 140 || hr < 100)) || (ox && ox < 92)) {
                  isStable = false;
                  statusText = hr && hr > 140 ? 'High HR' : 'Low Oxygen';
                }
              } else {
                if ((sys && (sys > 130 || sys < 95)) || (gluc && gluc > 120) || (ox && ox < 94)) {
                  isStable = false;
                  statusText = sys && sys > 130 ? 'Elevated BP' : gluc && gluc > 120 ? 'High Sugar' : 'Low SpO2';
                }
              }

              const bpStr = sys && dia ? `${sys}/${dia} BP` : '';
              const glucStr = gluc ? `${gluc} Sugar` : '';
              const hrStr = hr ? `${hr} HR` : '';
              vitalSummaryStr = [bpStr, glucStr, hrStr].filter(Boolean).join(' • ') || 'Vitals recorded';
            }

            return (
              <div
                key={m.id}
                className="glance-member-row"
                onClick={() => selectProfile(m.id)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <div className="glance-member-left">
                  <div className="glance-avatar" style={{ border: `2px solid ${themeColors[m.colorTheme || 'teal']?.primary || 'var(--color-primary)'}`, boxShadow: '0 3px 6px rgba(0,0,0,0.1)' }}>
                    {renderAvatar(m, '100%')}
                  </div>
                  <div className="glance-member-info">
                    <span className="glance-member-name">{m.name}</span>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{m.relation}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem', flexShrink: 0 }}>
                  <span className={`alert-badge ${isStable ? 'success' : 'danger'}`} style={{ fontSize: '0.52rem', padding: '0.05rem 0.25rem', borderRadius: '4px' }}>
                    {isStable ? '🟢 Stable' : `🔴 ${statusText}`}
                  </span>
                  <span style={{
                    fontSize: '0.58rem',
                    color: 'var(--text-muted)',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: 'right'
                  }}>
                    {vitalSummaryStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Individual Vitals Snapshot
  return (
    <div>
      {/* Back Button to Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '0.85rem' }}>
        <button
          onClick={() => selectProfile('household')}
          style={{
            border: 'none',
            background: 'none',
            color: 'var(--color-primary)',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0.2rem 0'
          }}
        >
          ← Back to Family Dashboard
        </button>
      </div>

      {/* Vitals Snapshot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {activeMember?.name}'s Vitals Snapshot
        </strong>
        <button
          className="btn btn-primary"
          onClick={onLogMedicalEvent}
          style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', borderRadius: '6px' }}
        >
          ➕ Log Medical Event
        </button>
      </div>

      <div className="home-vitals-grid">
        {/* BP Card */}
        {(() => {
          const memberVitals = allVitals[activeMemberId] || [];
          const latest = memberVitals.length > 0 ? memberVitals[memberVitals.length - 1] : null;
          const sys = latest?.bpSystolic;
          const dia = latest?.bpDiastolic;
          const isBpOut = sys && (sys > 130 || sys < 95);
          return (
            <div className="home-vital-box" style={{ '--vital-accent-color': isBpOut ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              <span className="home-vital-title">Blood Pressure</span>
              <div className="home-vital-val">
                {sys && dia ? `${sys}/${dia}` : '--'}
                <span className="home-vital-unit">mmHg</span>
              </div>
              <span style={{ fontSize: '0.56rem', color: isBpOut ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '700', marginTop: '0.15rem' }}>
                {sys && dia ? (isBpOut ? '⚠️ Elevated' : '🟢 Normal') : 'No data'}
              </span>
            </div>
          );
        })()}

        {/* Sugar Card */}
        {(() => {
          const memberVitals = allVitals[activeMemberId] || [];
          const latest = memberVitals.length > 0 ? memberVitals[memberVitals.length - 1] : null;
          const gluc = latest?.glucose;
          const isGlucOut = gluc && gluc > 120;
          return (
            <div className="home-vital-box" style={{ '--vital-accent-color': isGlucOut ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              <span className="home-vital-title">Blood Sugar</span>
              <div className="home-vital-val">
                {gluc ? gluc : '--'}
                <span className="home-vital-unit">mg/dL</span>
              </div>
              <span style={{ fontSize: '0.56rem', color: isGlucOut ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '700', marginTop: '0.15rem' }}>
                {gluc ? (isGlucOut ? '⚠️ High' : '🟢 Normal') : 'No data'}
              </span>
            </div>
          );
        })()}

        {/* Heart Rate Card */}
        {(() => {
          const memberVitals = allVitals[activeMemberId] || [];
          const latest = memberVitals.length > 0 ? memberVitals[memberVitals.length - 1] : null;
          const hr = latest?.heartRate;
          const isHrOut = activeMemberId === 'baby' ? (hr && (hr > 140 || hr < 100)) : (hr && (hr > 100 || hr < 60));
          return (
            <div className="home-vital-box" style={{ '--vital-accent-color': isHrOut ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              <span className="home-vital-title">Heart Rate</span>
              <div className="home-vital-val">
                {hr ? hr : '--'}
                <span className="home-vital-unit">bpm</span>
              </div>
              <span style={{ fontSize: '0.56rem', color: isHrOut ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '700', marginTop: '0.15rem' }}>
                {hr ? (isHrOut ? '⚠️ Abnormal' : '🟢 Normal') : 'No data'}
              </span>
            </div>
          );
        })()}

        {/* SpO2 Card */}
        {(() => {
          const memberVitals = allVitals[activeMemberId] || [];
          const latest = memberVitals.length > 0 ? memberVitals[memberVitals.length - 1] : null;
          const ox = latest?.oxygen;
          const isOxOut = ox && ox < 95;
          return (
            <div className="home-vital-box" style={{ '--vital-accent-color': isOxOut ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              <span className="home-vital-title">Oxygen (SpO2)</span>
              <div className="home-vital-val">
                {ox ? ox : '--'}
                <span className="home-vital-unit">%</span>
              </div>
              <span style={{ fontSize: '0.56rem', color: isOxOut ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '700', marginTop: '0.15rem' }}>
                {ox ? (isOxOut ? '⚠️ Low' : '🟢 Normal') : 'No data'}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default GlanceCard;
