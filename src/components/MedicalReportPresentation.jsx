import React from 'react';

export function getParameterStatus(name, val) {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  if (isNaN(num)) return null;

  if (name === 'hba1c') {
    if (num < 5.7) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    if (num < 6.5) return { status: 'Elevated', color: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'tsh') {
    if (num < 0.4) return { status: 'Low', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' };
    if (num <= 4.5) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'cholesterol') {
    if (num < 200) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    if (num < 240) return { status: 'Elevated', color: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'ldl') {
    if (num < 100) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    if (num < 160) return { status: 'Elevated', color: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'hdl') {
    if (num < 40) return { status: 'Low', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
    return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
  }
  if (name === 'triglycerides') {
    if (num < 150) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    if (num < 200) return { status: 'Elevated', color: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'hemoglobin') {
    if (num < 12.0) return { status: 'Low', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
    if (num <= 17.5) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'creatinine') {
    if (num < 0.6) return { status: 'Low', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' };
    if (num <= 1.2) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'heartRate') {
    if (num < 60) return { status: 'Low', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' };
    if (num <= 100) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  if (name === 'oxygen') {
    if (num < 95) return { status: 'Low', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
    return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
  }
  if (name === 'temperature') {
    if (num < 97.0) return { status: 'Low', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' };
    if (num < 99.5) return { status: 'Normal', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' };
    return { status: 'High', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' };
  }
  return null;
}

export function BPParamItem({ sys, dia }) {
  if (!sys && !dia) return null;
  let status = 'Normal';
  let color = 'var(--color-success)';
  let bg = 'rgba(16, 185, 129, 0.08)';
  let border = 'rgba(16, 185, 129, 0.2)';

  const s = parseInt(sys);
  const d = parseInt(dia);

  if (s >= 130 || d >= 80) {
    status = 'High';
    color = 'var(--color-danger)';
    bg = 'rgba(239, 68, 68, 0.08)';
    border = 'rgba(239, 68, 68, 0.2)';
  } else if (s >= 120 && d < 80) {
    status = 'Elevated';
    color = '#eab308';
    bg = 'rgba(234, 179, 8, 0.08)';
    border = 'rgba(234, 179, 8, 0.2)';
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', marginBottom: '0.3rem' }}>
      <div style={{ textAlign: 'left' }}>
        <span style={{ fontSize: '0.7rem', color: '#e2e8f0', fontWeight: '500', display: 'block' }}>Blood Pressure</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Ref: &lt; 120/80 mmHg</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: status !== 'Normal' ? color : '#fff' }}>
          {sys || '--'}/{dia || '--'} <span style={{ fontSize: '0.6rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>mmHg</span>
        </span>
        <span style={{
          fontSize: '0.55rem',
          padding: '0.12rem 0.4rem',
          borderRadius: '100px',
          background: bg,
          color: color,
          border: `1px solid ${border}`,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.3px'
        }}>{status}</span>
      </div>
    </div>
  );
}

export function LabParamItem({ label, val, unit, name, refRange }) {
  if (val === null || val === undefined || val === '') return null;
  const statusInfo = getParameterStatus(name, val);

  const badgeStyle = statusInfo ? {
    fontSize: '0.55rem',
    padding: '0.12rem 0.4rem',
    borderRadius: '100px',
    background: statusInfo.bg,
    color: statusInfo.color,
    border: `1px solid ${statusInfo.border}`,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  } : null;

  const valueColor = statusInfo && statusInfo.status !== 'Normal' ? statusInfo.color : '#fff';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', marginBottom: '0.3rem' }}>
      <div style={{ textAlign: 'left' }}>
        <span style={{ fontSize: '0.7rem', color: '#e2e8f0', fontWeight: '500', display: 'block' }}>{label}</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Ref: {refRange}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: valueColor }}>
          {val} <span style={{ fontSize: '0.6rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{unit}</span>
        </span>
        {badgeStyle && (
          <span style={badgeStyle}>{statusInfo.status}</span>
        )}
      </div>
    </div>
  );
}

export function MedicalReportPresentation({ vitals }) {
  if (!vitals) return null;

  const hasVitals = vitals.bpSystolic || vitals.bpDiastolic || vitals.heartRate || vitals.oxygen || vitals.temperature || vitals.weight;
  const hasGlycemic = vitals.glucose || vitals.hba1c;
  const hasLipid = vitals.cholesterol || vitals.ldl || vitals.hdl || vitals.triglycerides;
  const hasThyroid = vitals.tsh;
  const hasCbc = vitals.hemoglobin;
  const hasRenal = vitals.creatinine;

  if (!hasVitals && !hasGlycemic && !hasLipid && !hasThyroid && !hasCbc && !hasRenal) {
    return (
      <div style={{ padding: '0.75rem', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
        ℹ️ No clinical parameters were detected or saved in this report.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {hasVitals && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem' }}>🩺</span>
            <strong style={{ fontSize: '0.7rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Cardiovascular & Vitals</strong>
          </div>
          <BPParamItem sys={vitals.bpSystolic} dia={vitals.bpDiastolic} />
          <LabParamItem label="Pulse Rate" val={vitals.heartRate} unit="BPM" name="heartRate" refRange="60 - 100 BPM" />
          <LabParamItem label="Blood Oxygen (SpO2)" val={vitals.oxygen} unit="%" name="oxygen" refRange="95 - 100 %" />
          <LabParamItem label="Body Temperature" val={vitals.temperature} unit="°F" name="temperature" refRange="97.0 - 99.0 °F" />
          <LabParamItem label="Body Weight" val={vitals.weight} unit="kg" name="weight" refRange="N/A" />
        </div>
      )}

      {hasGlycemic && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem' }}>🩸</span>
            <strong style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Metabolic & Glycemic Profile</strong>
          </div>
          <LabParamItem label="Blood Glucose" val={vitals.glucose} unit="mg/dL" name="glucose" refRange="&lt; 100 mg/dL" />
          <LabParamItem label="HbA1c (Glycated Hb)" val={vitals.hba1c} unit="%" name="hba1c" refRange="&lt; 5.7 %" />
        </div>
      )}

      {hasLipid && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem' }}>🧪</span>
            <strong style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Lipid Panel (Cardio Health)</strong>
          </div>
          <LabParamItem label="Total Cholesterol" val={vitals.cholesterol} unit="mg/dL" name="cholesterol" refRange="&lt; 200 mg/dL" />
          <LabParamItem label="LDL Cholesterol (Bad)" val={vitals.ldl} unit="mg/dL" name="ldl" refRange="&lt; 100 mg/dL" />
          <LabParamItem label="HDL Cholesterol (Good)" val={vitals.hdl} unit="mg/dL" name="hdl" refRange="&gt; 40 mg/dL" />
          <LabParamItem label="Serum Triglycerides" val={vitals.triglycerides} unit="mg/dL" name="triglycerides" refRange="&lt; 150 mg/dL" />
        </div>
      )}

      {hasThyroid && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem' }}>🦋</span>
            <strong style={{ fontSize: '0.7rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Thyroid Function</strong>
          </div>
          <LabParamItem label="Thyroid Stimulating Hormone (TSH)" val={vitals.tsh} unit="uIU/mL" name="tsh" refRange="0.40 - 4.50 uIU/mL" />
        </div>
      )}

      {hasCbc && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem' }}>🔴</span>
            <strong style={{ fontSize: '0.7rem', color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Hematology (CBC)</strong>
          </div>
          <LabParamItem label="Hemoglobin" val={vitals.hemoglobin} unit="g/dL" name="hemoglobin" refRange="12.0 - 17.5 g/dL" />
        </div>
      )}

      {hasRenal && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem' }}>💧</span>
            <strong style={{ fontSize: '0.7rem', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Renal Function (Kidney)</strong>
          </div>
          <LabParamItem label="Serum Creatinine" val={vitals.creatinine} unit="mg/dL" name="creatinine" refRange="0.60 - 1.20 mg/dL" />
        </div>
      )}
    </div>
  );
}

export default MedicalReportPresentation;
