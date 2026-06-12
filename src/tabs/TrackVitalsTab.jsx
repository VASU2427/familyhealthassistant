import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import ProfileSelectionPrompt from '../components/ProfileSelectionPrompt';
import Icon from '../components/Icon';

export function TrackVitalsTab() {
  const {
    vitals,
    activeMember,
    activeMemberId,
    logVitals,
    wearableSensors,
    setWearableSensors
  } = useHealth();

  if (activeMemberId === 'household') {
    return <ProfileSelectionPrompt title="Vitals & Health Tracking" />;
  }

  const [activeChartKey, setActiveChartKey] = useState('bpSystolic');
  const [showLogModal, setShowLogModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    bpSystolic: '', bpDiastolic: '', glucose: '', weight: '', heartRate: '', oxygen: '', temperature: '',
    hba1c: '', tsh: '', cholesterol: '', hdl: '', ldl: '', triglycerides: '', creatinine: '', hemoglobin: ''
  });

  const isPlaceholder = (val) => {
    return val === null || val === undefined || val === '' ||
      val === -999 || val === '-999' ||
      val === -99 || val === '-99' ||
      val === 404 || val === '404';
  };

  const getLatestValue = (key) => {
    for (let i = vitals.length - 1; i >= 0; i--) {
      if (!isPlaceholder(vitals[i][key])) {
        return vitals[i][key];
      }
    }
    return '--';
  };

  const latest = {
    bpSystolic: getLatestValue('bpSystolic'),
    bpDiastolic: getLatestValue('bpDiastolic'),
    glucose: getLatestValue('glucose'),
    weight: getLatestValue('weight'),
    heartRate: getLatestValue('heartRate'),
    oxygen: getLatestValue('oxygen'),
    temperature: getLatestValue('temperature'),
    hba1c: getLatestValue('hba1c'),
    tsh: getLatestValue('tsh'),
    cholesterol: getLatestValue('cholesterol'),
    hdl: getLatestValue('hdl'),
    ldl: getLatestValue('ldl'),
    triglycerides: getLatestValue('triglycerides'),
    creatinine: getLatestValue('creatinine'),
    hemoglobin: getLatestValue('hemoglobin')
  };

  const handleLog = (e) => {
    e.preventDefault();
    logVitals(activeMember.id, {
      bpSystolic: form.bpSystolic ? parseInt(form.bpSystolic) : null,
      bpDiastolic: form.bpDiastolic ? parseInt(form.bpDiastolic) : null,
      glucose: form.glucose ? parseInt(form.glucose) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      heartRate: form.heartRate ? parseInt(form.heartRate) : null,
      oxygen: form.oxygen ? parseInt(form.oxygen) : null,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      hba1c: form.hba1c ? parseFloat(form.hba1c) : null,
      tsh: form.tsh ? parseFloat(form.tsh) : null,
      cholesterol: form.cholesterol ? parseInt(form.cholesterol) : null,
      hdl: form.hdl ? parseInt(form.hdl) : null,
      ldl: form.ldl ? parseInt(form.ldl) : null,
      triglycerides: form.triglycerides ? parseInt(form.triglycerides) : null,
      creatinine: form.creatinine ? parseFloat(form.creatinine) : null,
      hemoglobin: form.hemoglobin ? parseFloat(form.hemoglobin) : null
    }, form.date);

    setForm({
      date: new Date().toISOString().split('T')[0],
      bpSystolic: '', bpDiastolic: '', glucose: '', weight: '', heartRate: '', oxygen: '', temperature: '',
      hba1c: '', tsh: '', cholesterol: '', hdl: '', ldl: '', triglycerides: '', creatinine: '', hemoglobin: ''
    });
    setShowLogModal(false);
  };

  const handleShowTooltip = (e, val, date) => {
    const tooltip = document.getElementById('chart-tooltip-el');
    if (tooltip) {
      tooltip.innerHTML = `${date}: <strong>${val}</strong>`;
      tooltip.style.opacity = '1';
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY - 20}px`;
    }
  };

  const handleHideTooltip = () => {
    const tooltip = document.getElementById('chart-tooltip-el');
    if (tooltip) {
      tooltip.style.opacity = '0';
    }
  };

  const renderChart = (key, color) => {
    const filteredVitals = vitals ? vitals.filter(v => v[key] !== null && v[key] !== undefined && v[key] !== '') : [];
    if (filteredVitals.length < 2) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Log at least 2 reports with this parameter to visualize trends.</div>;
    const w = 320, h = 150, pad = 20;
    const values = filteredVitals.map(v => v[key]);
    const max = Math.max(...values) * 1.05;
    const min = Math.min(...values) * 0.95;
    const range = max - min || 10;

    const pts = filteredVitals.map((v, i) => {
      const x = pad + (i / (filteredVitals.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v[key] - min) / range) * (h - pad * 2);
      return { x, y, val: v[key], date: v.date };
    });

    const d = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p, i) => {
      const prev = pts[i];
      return `C ${prev.x + (p.x - prev.x)/2} ${prev.y}, ${prev.x + (p.x - prev.x)/2} ${p.y}, ${p.x} ${p.y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
        <defs>
          <linearGradient id="area-grad-tab" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={pad} x2={w-pad} y2={pad} stroke="var(--border-color)" strokeDasharray="2 2" />
        <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="var(--border-color)" />

        <path d={`${d} L ${pts[pts.length-1].x} ${h-pad} L ${pts[0].x} ${h-pad} Z`} fill="url(#area-grad-tab)" />
        <path d={d} fill="none" stroke={color} strokeWidth="3" />

        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="var(--bg-secondary)"
            stroke={color}
            strokeWidth="2.5"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => handleShowTooltip(e, p.val, p.date)}
            onMouseMove={(e) => handleShowTooltip(e, p.val, p.date)}
            onMouseLeave={handleHideTooltip}
          />
        ))}
      </svg>
    );
  };

  const getChartColor = () => {
    if (activeChartKey.toLowerCase().includes('bp')) return 'var(--color-primary)';
    if (activeChartKey.toLowerCase().includes('glucose') || activeChartKey === 'hba1c') return 'var(--color-warning)';
    if (activeChartKey.toLowerCase().includes('heart') || activeChartKey === 'oxygen') return 'var(--color-danger)';
    if (activeChartKey === 'tsh') return '#a855f7';
    if (['cholesterol', 'hdl', 'ldl', 'triglycerides'].includes(activeChartKey)) return '#14b8a6';
    if (activeChartKey === 'hemoglobin') return '#f43f5e';
    if (activeChartKey === 'creatinine') return '#eab308';
    return 'var(--color-info)';
  };

  const handleSyncWearables = () => {
    setSyncing(true);
    setTimeout(() => {
      logVitals(activeMember.id, {
        bpSystolic: 120 + Math.floor(wearableSensors.heartRate / 8),
        bpDiastolic: 80 + Math.floor(wearableSensors.heartRate / 16),
        glucose: 95,
        weight: activeMember.weight || 60,
        heartRate: wearableSensors.heartRate,
        oxygen: wearableSensors.spo2,
        temperature: wearableSensors.temperature
      });
      setSyncing(false);
    }, 1000);
  };

  const beatSpeed = 60 / wearableSensors.heartRate;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Vitals Logs ({activeMember.name})</h3>
        <button className="btn btn-primary" onClick={() => setShowLogModal(true)} style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px' }}><Icon name="plus" size={12} /> Log Vitals</button>
      </div>

      {/* Vitals Parameter Cards */}
      <div className="vital-grid" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '0.2rem' }}>
        <div className={`glass-panel vital-card ${activeChartKey === 'bpSystolic' ? 'active-card' : ''}`} style={{ '--card-accent': 'var(--color-primary)', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('bpSystolic')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>BP (Systolic/Diastolic)</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.bpSystolic}/{latest.bpDiastolic} <span style={{ fontSize: '0.6rem' }}>mmHg</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'glucose' ? 'active-card' : ''}`} style={{ '--card-accent': 'var(--color-warning)', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('glucose')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Blood Glucose</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.glucose} <span style={{ fontSize: '0.6rem' }}>mg/dL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'heartRate' ? 'active-card' : ''}`} style={{ '--card-accent': 'var(--color-danger)', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('heartRate')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Pulse (Heart Rate)</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.heartRate} <span style={{ fontSize: '0.6rem' }}>bpm</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'temperature' ? 'active-card' : ''}`} style={{ '--card-accent': 'var(--color-info)', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('temperature')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Body Temp</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.temperature}<span>°F</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'oxygen' ? 'active-card' : ''}`} style={{ '--card-accent': 'var(--color-danger)', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('oxygen')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>SpO2 (Blood Oxygen)</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.oxygen}<span>%</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'hba1c' ? 'active-card' : ''}`} style={{ '--card-accent': 'var(--color-warning)', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('hba1c')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Diabetes (HbA1c)</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.hba1c || '--'}<span>%</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'tsh' ? 'active-card' : ''}`} style={{ '--card-accent': '#a855f7', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('tsh')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Thyroid (TSH)</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.tsh || '--'} <span style={{ fontSize: '0.55rem' }}>uIU/mL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'cholesterol' ? 'active-card' : ''}`} style={{ '--card-accent': '#14b8a6', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('cholesterol')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Cholesterol</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.cholesterol || '--'} <span style={{ fontSize: '0.55rem' }}>mg/dL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'ldl' ? 'active-card' : ''}`} style={{ '--card-accent': '#14b8a6', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('ldl')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>LDL Cholesterol</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.ldl || '--'} <span style={{ fontSize: '0.55rem' }}>mg/dL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'hdl' ? 'active-card' : ''}`} style={{ '--card-accent': '#14b8a6', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('hdl')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>HDL Cholesterol</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.hdl || '--'} <span style={{ fontSize: '0.55rem' }}>mg/dL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'triglycerides' ? 'active-card' : ''}`} style={{ '--card-accent': '#14b8a6', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('triglycerides')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Triglycerides</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.triglycerides || '--'} <span style={{ fontSize: '0.55rem' }}>mg/dL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'creatinine' ? 'active-card' : ''}`} style={{ '--card-accent': '#eab308', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('creatinine')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Creatinine</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.creatinine || '--'} <span style={{ fontSize: '0.55rem' }}>mg/dL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'hemoglobin' ? 'active-card' : ''}`} style={{ '--card-accent': '#f43f5e', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('hemoglobin')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Hemoglobin</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.hemoglobin || '--'} <span style={{ fontSize: '0.55rem' }}>g/dL</span></div>
        </div>
        <div className={`glass-panel vital-card ${activeChartKey === 'weight' ? 'active-card' : ''}`} style={{ '--card-accent': 'var(--color-info)', padding: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveChartKey('weight')}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Body Weight</span>
          <div className="vital-value" style={{ fontSize: '1rem', marginTop: '0.15rem' }}>{latest.weight} <span style={{ fontSize: '0.6rem' }}>kg</span></div>
        </div>
      </div>

      {/* Analytics Trend Area */}
      <div className="glass-panel" style={{ padding: '0.85rem' }}>
        <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'left', marginBottom: '0.65rem' }}>
          Longitudinal Analytics: {activeChartKey.toUpperCase()}
        </strong>
        <div style={{ height: '160px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderChart(activeChartKey, getChartColor())}
        </div>
      </div>

      {/* Smartwatch Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '0.65rem', alignItems: 'center' }}>
        <div className="glass-panel" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid #334155', borderRadius: '16px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '92px', height: '92px', borderRadius: '50%', border: '4px solid #1e293b', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>HEART RATE</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {wearableSensors.heartRate}
            </span>
            <Icon name="heart" size={14} color="var(--color-danger)" className="pulse-animation" style={{ '--pulse-speed': `${beatSpeed}s` }} />
          </div>
          <span style={{ fontSize: '0.55rem', color: '#64748b', position: 'absolute', bottom: '10px' }}>🩸 {wearableSensors.spo2}% SpO2</span>
        </div>
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Smartwatch Simulator</h4>
          <div className="glass-panel" style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>Pulse: <strong>{wearableSensors.heartRate} BPM</strong></label>
              <input type="range" min="50" max="170" value={wearableSensors.heartRate} onChange={e => setWearableSensors({...wearableSensors, heartRate: parseInt(e.target.value)})} style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>SpO2: <strong>{wearableSensors.spo2}%</strong></label>
              <input type="range" min="88" max="100" value={wearableSensors.spo2} onChange={e => setWearableSensors({...wearableSensors, spo2: parseInt(e.target.value)})} style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
            </div>
            <button className="btn btn-primary" onClick={handleSyncWearables} disabled={syncing} style={{ width: '100%', fontSize: '0.75rem', padding: '0.3rem' }}>{syncing ? 'Syncing...' : 'Sync Wearable Data'}</button>
          </div>
        </div>
      </div>

      {/* Log Vitals Modal Sheet */}
      {showLogModal && (
        <div className="bottom-sheet-overlay" style={{ zIndex: 1100 }}>
          <div className="bottom-sheet" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Manual Health Record Entry</h3>
              <button className="btn-icon" onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Icon name="x" size={16} /></button>
            </div>
            <form onSubmit={handleLog}>
              <div className="form-group" style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
                <label style={{ fontSize: '0.65rem' }}>Record Date</label>
                <input type="date" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>

              <strong style={{ fontSize: '0.7rem', color: 'var(--color-primary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', textAlign: 'left' }}>Basic Vitals</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>BP Systolic (mmHg)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.bpSystolic} onChange={e => setForm({...form, bpSystolic: e.target.value})} /></div>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>BP Diastolic (mmHg)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.bpDiastolic} onChange={e => setForm({...form, bpDiastolic: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>Glucose (mg/dL)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.glucose} onChange={e => setForm({...form, glucose: e.target.value})} /></div>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>Pulse (BPM)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.heartRate} onChange={e => setForm({...form, heartRate: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>Temp (°F)</label><input type="number" step="0.1" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.temperature} onChange={e => setForm({...form, temperature: e.target.value})} /></div>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>SpO2 (%)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.oxygen} onChange={e => setForm({...form, oxygen: e.target.value})} /></div>
              </div>

              <strong style={{ fontSize: '0.7rem', color: 'var(--color-primary)', display: 'block', marginBottom: '0.4rem', marginTop: '0.6rem', textTransform: 'uppercase', textAlign: 'left' }}>Lab Metrics (Optional)</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>HbA1c (%)</label><input type="number" step="0.1" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.hba1c} onChange={e => setForm({...form, hba1c: e.target.value})} /></div>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>TSH (uIU/mL)</label><input type="number" step="0.01" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.tsh} onChange={e => setForm({...form, tsh: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>Cholesterol (mg/dL)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.cholesterol} onChange={e => setForm({...form, cholesterol: e.target.value})} /></div>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>Triglycerides (mg/dL)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.triglycerides} onChange={e => setForm({...form, triglycerides: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>HDL (mg/dL)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.hdl} onChange={e => setForm({...form, hdl: e.target.value})} /></div>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>LDL (mg/dL)</label><input type="number" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.ldl} onChange={e => setForm({...form, ldl: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>Creatinine (mg/dL)</label><input type="number" step="0.01" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.creatinine} onChange={e => setForm({...form, creatinine: e.target.value})} /></div>
                <div className="form-group" style={{ textAlign: 'left' }}><label style={{ fontSize: '0.65rem' }}>Hemoglobin (g/dL)</label><input type="number" step="0.1" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={form.hemoglobin} onChange={e => setForm({...form, hemoglobin: e.target.value})} /></div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.4rem', padding: '0.45rem', fontSize: '0.75rem' }}>Save Parameters</button>
            </form>
          </div>
        </div>
      )}

      {/* Shared Tooltip Element */}
      <div id="chart-tooltip-el" className="chart-tooltip">Tooltip</div>
    </div>
  );
}

export default TrackVitalsTab;
