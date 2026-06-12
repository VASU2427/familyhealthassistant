import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';

export function PresentationConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    setActiveMemberId, 
    setActiveTab, 
    setWearableSensors, 
    logVitals, 
    resetDatabase, 
    addToast, 
    bookAppointment 
  } = useHealth();

  const triggerHighBP = () => {
    setActiveMemberId('baby');
    setActiveTab('dashboard');
    if (setWearableSensors) {
      setWearableSensors({ heartRate: 145, spo2: 89, temperature: 99.2 });
    }
    logVitals('baby', { 
      bpSystolic: 95, 
      bpDiastolic: 65, 
      glucose: 82, 
      weight: 5.5, 
      heartRate: 145, 
      oxygen: 89, 
      temperature: 99.2 
    });
    addToast('⚠️ Warning: Critical Heart Rate Alert triggered for Sia!', 'danger');
  };

  const triggerScanScenario = () => {
    setActiveTab('records');
    addToast('Scan scenario initiated. Switch to AI Scan inside Records tab.', 'info');
  };

  const triggerTeleconsultScenario = () => {
    bookAppointment({ 
      docName: 'Dr. Vivek Verma', 
      specialty: 'Pediatrician', 
      date: new Date().toISOString().split('T')[0], 
      time: '5:00 PM', 
      type: 'Teleconsultation', 
      memberId: 'baby' 
    });
    setActiveTab('teleconsult');
    addToast('Incoming consult alert synced. Join the teleconsult call below.', 'success');
  };

  return (
    <div className="presentation-console" style={{ height: isOpen ? 'auto' : '40px' }}>
      <div className="presentation-header" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
        <span>🎬 Demo Controls</span>
        <span>{isOpen ? '▼' : '▲'}</span>
      </div>
      {isOpen && (
        <div className="presentation-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <button className="preset-btn" onClick={triggerHighBP} style={{ padding: '0.45rem', fontSize: '0.72rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>🚨 Scenario A: Critical Vitals</button>
          <button className="preset-btn" onClick={triggerScanScenario} style={{ padding: '0.45rem', fontSize: '0.72rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>📄 Scenario B: Test AI Document</button>
          <button className="preset-btn" onClick={triggerTeleconsultScenario} style={{ padding: '0.45rem', fontSize: '0.72rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>📞 Scenario C: Consult Doctor</button>
          <button className="preset-btn" onClick={resetDatabase} style={{ padding: '0.45rem', fontSize: '0.72rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--color-danger)', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>🔄 Reset Database</button>
        </div>
      )}
    </div>
  );
}

export default PresentationConsole;
