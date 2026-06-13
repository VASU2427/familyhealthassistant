import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { renderAvatar, themeColors } from '../components/MemberAvatar';
import Icon from '../components/Icon';
import GlanceCard from '../components/GlanceCard';
import { compressAvatar } from '../utils/image';

const formatHistoryDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: dateStr.split('-')[2] || '28', month: 'MAY' };
  const day = d.getDate().toString();
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return { day, month };
};

export function DashboardTab() {
  const {
    activeMember,
    activeMemberId,
    setActiveMemberId,
    members,
    allMedicines,
    allVaccinations,
    allAppointments,
    allVitals,
    addFamilyMember,
    pregnancyChecklist,
    babyMilestones,
    setActiveTab,
    medicalHistories,
    addMedicalHistory
  } = useHealth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAbhaSectionAddDash, setShowAbhaSectionAddDash] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [insuranceModalData, setInsuranceModalData] = useState(null);

  const [addForm, setAddForm] = useState({
    name: '',
    relation: 'Spouse',
    mobile: '',
    age: '',
    gender: 'Female',
    pregnancyMode: false,
    pregnancyWeeks: 12,
    dueDate: '',
    newbornMode: false,
    birthDate: '',
    weight: '',
    bloodGroup: '',
    avatar: '',
    colorTheme: 'teal',
    abhaId: '',
    abhaAddress: '',
    insuranceProvider: '',
    insurancePolicyName: '',
    insurancePolicyNumber: '',
    insuranceSumInsured: '',
    insuranceExpiry: '',
    insuranceTPA: ''
  });

  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    issue: '',
    doctor: '',
    diagnosis: '',
    treatment: '',
    prescriptionName: '',
    prescriptionDosage: '',
    prescriptionDuration: '',
    allergies: '',
    vitalsBP: '',
    vitalsHR: '',
    vitalsWeight: '',
    labReports: '',
    hospitalVisits: 'Outpatient Clinic',
    notes: '',
    chronicDisease: ''
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const newId = await addFamilyMember({
      ...addForm,
      age: parseFloat(addForm.age),
      weight: parseFloat(addForm.weight) || 60
    });
    if (newId) {
      setActiveMemberId(newId);
    }
    setShowAddModal(false);
    setAddForm({
      name: '',
      relation: 'Spouse',
      mobile: '',
      age: '',
      gender: 'Female',
      pregnancyMode: false,
      pregnancyWeeks: 12,
      dueDate: '',
      newbornMode: false,
      birthDate: '',
      weight: '',
      bloodGroup: '',
      avatar: '',
      colorTheme: 'teal',
      abhaId: '',
      abhaAddress: '',
      insuranceProvider: '',
      insurancePolicyName: '',
      insurancePolicyNumber: '',
      insuranceSumInsured: '',
      insuranceExpiry: '',
      insuranceTPA: ''
    });
  };

  const selectProfile = (id) => {
    setActiveMemberId(id);
  };

  const handleHistorySubmit = (e) => {
    e.preventDefault();

    const recordVitals = {};
    if (historyForm.vitalsBP) recordVitals['BP'] = historyForm.vitalsBP;
    if (historyForm.vitalsHR) recordVitals['HR'] = historyForm.vitalsHR + ' bpm';
    if (historyForm.vitalsWeight) recordVitals['Weight'] = historyForm.vitalsWeight + ' kg';

    const record = {
      date: historyForm.date,
      issue: historyForm.issue,
      doctor: historyForm.doctor,
      diagnosis: historyForm.diagnosis,
      treatment: historyForm.treatment,
      prescriptions: historyForm.prescriptionName ? [{
        name: historyForm.prescriptionName,
        dosage: historyForm.prescriptionDosage,
        duration: historyForm.prescriptionDuration,
        startDate: historyForm.date,
        endDate: historyForm.date
      }] : [],
      allergies: historyForm.allergies || 'None reported',
      vitals: recordVitals,
      labReports: historyForm.labReports ? historyForm.labReports.split(',').map(s => s.trim()) : [],
      hospitalVisits: historyForm.hospitalVisits,
      notes: historyForm.notes,
      chronicDisease: historyForm.chronicDisease || 'None'
    };

    addMedicalHistory(activeMemberId, record);
    setShowAddHistoryModal(false);
    setHistoryForm({
      date: new Date().toISOString().split('T')[0],
      issue: '',
      doctor: '',
      diagnosis: '',
      treatment: '',
      prescriptionName: '',
      prescriptionDosage: '',
      prescriptionDuration: '',
      allergies: '',
      vitalsBP: '',
      vitalsHR: '',
      vitalsWeight: '',
      labReports: '',
      hospitalVisits: 'Outpatient Clinic',
      notes: '',
      chronicDisease: ''
    });
  };

  const getAlerts = () => {
    const list = [];
    const targetMembers = activeMemberId === 'household' ? members : members.filter(m => m.id === activeMemberId);

    targetMembers.forEach(m => {
      // Medicine stock check
      const meds = allMedicines[m.id] || [];
      meds.forEach(med => {
        if (med.remaining <= 5) {
          list.push({
            id: `med_${med.id}`,
            text: `${m.name}: Low medicine stock for ${med.name} (${med.remaining}/${med.total} left)`,
            type: 'warning',
            time: '10:30 AM'
          });
        }
      });

      // Vaccination check
      const vacs = allVaccinations ? allVaccinations.filter(v => v.memberId === m.id && v.status !== 'Given') : [];
      vacs.forEach(v => {
        const diff = Math.ceil((new Date(v.dateDue) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff <= 7 && diff >= -2) {
          list.push({
            id: `vac_${v.id}`,
            text: `${m.name}: Vaccination due for ${v.name} by ${v.dateDue}`,
            type: 'danger',
            time: '9:00 AM'
          });
        }
      });
    });

    if (list.length === 0) {
      list.push({ id: 'all_clear', text: 'All routines and vitals are stable.', type: 'info', time: 'Just now' });
    }
    return list.slice(0, 3);
  };

  const appointmentsList = activeMemberId === 'household'
    ? allAppointments
    : allAppointments.filter(a => a.memberId === activeMemberId);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Scrollable Family Members Selector Carousel */}
      <div>
        <div className="family-members-header">
          <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Family Members</strong>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <span
              style={{ fontSize: '0.72rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '700' }}
              onClick={() => setActiveTab('profiles')}
            >
              Manage
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>|</span>
            <span
              style={{ fontSize: '0.72rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '700' }}
              onClick={() => setShowAddModal(true)}
            >
              + Add
            </span>
          </div>
        </div>

        <div className="family-members-scroll">
          {members.map(m => {
            const isActive = activeMemberId === m.id;
            const memberTheme = m.colorTheme || 'teal';
            const memberPrimaryColor = themeColors[memberTheme]?.primary || 'var(--color-primary)';
            return (
              <div
                key={m.id}
                className={`member-circle-pill ${isActive ? 'active' : ''}`}
                onClick={() => selectProfile(m.id)}
                style={isActive ? { borderColor: memberPrimaryColor, background: themeColors[memberTheme]?.primaryLight } : {}}
              >
                <div className="avatar-wrapper" style={{ border: isActive ? `2.5px solid ${memberPrimaryColor}` : `2px solid ${memberPrimaryColor}88`, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.12)' }}>
                  {renderAvatar(m, '100%')}
                  <span className="avatar-status-dot success"></span>
                </div>
                <span className="member-name-text">{m.name}</span>
                <span className="member-age-text">{m.age ? `${m.age} yrs` : 'Baby'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Glance Health Summary Card */}
      <GlanceCard
        activeMemberId={activeMemberId}
        members={members}
        allVitals={allVitals}
        selectProfile={selectProfile}
        onLogMedicalEvent={() => setShowAddHistoryModal(true)}
        activeMember={activeMember}
      />

      {activeMemberId !== 'household' && (
        <>
          {/* ABHA ID & Health Insurance Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {/* ABHA Card */}
            <div className="glass-panel" style={{ 
              background: `linear-gradient(135deg, ${themeColors[activeMember?.colorTheme || 'teal']?.primary || 'var(--color-primary)'}e8 0%, ${themeColors[activeMember?.colorTheme || 'teal']?.primary || 'var(--color-primary)'}99 100%)`,
              color: '#ffffff',
              borderRadius: '16px',
              padding: '1rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(14, 159, 110, 0.15)',
              border: 'none',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, display: 'block', fontWeight: 'bold' }}>Ayushman Bharat Digital Mission</span>
                  <strong style={{ fontSize: '0.82rem', letterSpacing: '-0.01em' }}>ABHA Health Card</strong>
                </div>
                <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🆔</span>
              </div>
              
              {activeMember.abhaId ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '1.15rem', 
                      fontWeight: 'bold', 
                      letterSpacing: '2px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}>
                      {activeMember.abhaId}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(activeMember.abhaId);
                        alert('ABHA ID copied to clipboard!');
                      }} 
                      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', color: '#fff', padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.58rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.62rem', opacity: 0.9 }}>
                      <div style={{ textTransform: 'uppercase', fontSize: '0.48rem', opacity: 0.7 }}>Health Address</div>
                      <strong style={{ fontSize: '0.68rem' }}>{activeMember.abhaAddress || `${activeMember.name.toLowerCase().replace(/\s+/g, '')}@abdm`}</strong>
                    </div>
                    <button 
                      onClick={() => {
                        setQrModalData({ name: activeMember.name, abhaId: activeMember.abhaId, abhaAddress: activeMember.abhaAddress });
                        setShowQrModal(true);
                      }}
                      style={{ background: '#ffffff', color: themeColors[activeMember?.colorTheme || 'teal']?.primary || 'var(--color-primary)', border: 'none', borderRadius: '8px', padding: '0.35rem 0.65rem', fontWeight: 'bold', fontSize: '0.62rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                    >
                      🔍 View QR
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.85, display: 'block', marginBottom: '0.5rem' }}>No ABHA ID linked to this profile.</span>
                  <button 
                    onClick={() => setActiveTab('profiles')}
                    style={{ background: '#ffffff', color: themeColors[activeMember?.colorTheme || 'teal']?.primary || 'var(--color-primary)', border: 'none', borderRadius: '8px', padding: '0.35rem 0.75rem', fontWeight: 'bold', fontSize: '0.62rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                  >
                    Link ABHA ID
                  </button>
                </div>
              )}
            </div>

            {/* Insurance Card */}
            <div className="glass-panel" style={{ 
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '1rem',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'left',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                  <div>
                    <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block' }}>
                      {activeMember.insuranceProvider || 'Health Insurance'}
                    </strong>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                      {activeMember.insurancePolicyName || 'No policy registered'}
                    </span>
                  </div>
                </div>
                
                {activeMember.insuranceExpiry && (
                  <span className={`alert-badge ${
                    Math.ceil((new Date(activeMember.insuranceExpiry) - new Date()) / (1000 * 60 * 60 * 24)) <= 30
                      ? 'warning'
                      : 'success'
                  }`} style={{ fontSize: '0.52rem', padding: '0.1rem 0.3rem' }}>
                    {Math.ceil((new Date(activeMember.insuranceExpiry) - new Date()) / (1000 * 60 * 60 * 24)) <= 0
                      ? 'Expired'
                      : Math.ceil((new Date(activeMember.insuranceExpiry) - new Date()) / (1000 * 60 * 60 * 24)) <= 30
                      ? 'Expiring soon'
                      : 'Active'
                  }
                  </span>
                )}
              </div>

              {activeMember.insurancePolicyNumber ? (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Policy No:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{activeMember.insurancePolicyNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sum Insured:</span>
                    <strong style={{ color: 'var(--color-primary)', fontWeight: '800' }}>₹{activeMember.insuranceSumInsured}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expiry Date:</span>
                    <strong>{activeMember.insuranceExpiry}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                    <span>TPA Partner:</span>
                    <span>{activeMember.insuranceTPA || 'Direct Settlement'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setInsuranceModalData(activeMember);
                      setShowInsuranceModal(true);
                    }}
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none', borderRadius: '6px', padding: '0.3rem 0', fontWeight: 'bold', fontSize: '0.6rem', cursor: 'pointer', marginTop: '0.35rem', width: '100%' }}
                  >
                    View Coverage T&C & Claim Helpline
                  </button>
                </div>
              ) : (
                <div style={{ padding: '0.75rem 0', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Secure your family. Link active health insurance policies.</span>
                  <button 
                    onClick={() => setActiveTab('profiles')}
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', fontWeight: 'bold', fontSize: '0.6rem', cursor: 'pointer' }}
                  >
                    Add Policy Details
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Allergies & Chronic Conditions Card */}
          <div className="glass-panel" style={{ padding: '0.85rem', marginBottom: '0.2rem', borderLeft: '4px solid #ef4444', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'block' }}>Allergies & Chronic Conditions</strong>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                <strong>Allergies:</strong> {activeMember.allergies && activeMember.allergies.length > 0 ? activeMember.allergies.join(', ') : 'None reported'} &bull;
                <strong> Chronic Conditions:</strong> {activeMember.conditions && activeMember.conditions.length > 0 ? activeMember.conditions.join(', ') : 'None'}
              </div>
            </div>
          </div>

          {/* Chronological Health History Timeline */}
          <div style={{ marginTop: '0.25rem' }}>
            <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.65rem' }}>
              Medical & Consultation History
            </strong>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', paddingLeft: '0.85rem', borderLeft: '2px solid var(--border-color)', margin: '0.25rem 0.25rem 1rem 0.5rem' }}>
              {(medicalHistories[activeMemberId] || []).length === 0 ? (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'left', padding: '0.5rem 0' }}>No medical history logged yet.</div>
              ) : (
                (medicalHistories[activeMemberId] || []).map((history) => (
                  <div key={history.id} style={{ position: 'relative', textAlign: 'left' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-1.15rem',
                      top: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      border: '2px solid var(--bg-secondary)',
                      boxShadow: '0 0 0 2px var(--color-primary-light)'
                    }}></div>

                    <div style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      📅 {history.date}
                    </div>

                    <div className="glass-panel" style={{ padding: '0.85rem', marginTop: '0.25rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{history.issue}</strong>
                        <span className="alert-badge info" style={{ fontSize: '0.52rem', padding: '0.05rem 0.25rem' }}>{history.hospitalVisits}</span>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div>🧑‍⚕️ <strong>Doctor:</strong> {history.doctor}</div>
                        <div>📋 <strong>Diagnosis:</strong> {history.diagnosis ? (Array.isArray(history.diagnosis) ? history.diagnosis.join(', ') : history.diagnosis) : ''}</div>
                        <div>💊 <strong>Treatment:</strong> {history.treatment ? (Array.isArray(history.treatment) ? history.treatment.join(', ') : history.treatment) : ''}</div>
                        {history.notes && <div>📝 <strong>Doctor Notes:</strong> {history.notes}</div>}
                        {history.allergies && history.allergies !== 'None' && history.allergies !== 'None reported' && (
                          <div>⚠️ <strong>Allergies:</strong> <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>{history.allergies}</span></div>
                        )}
                        {history.chronicDisease && history.chronicDisease !== 'None' && (
                          <div>🧬 <strong>Chronic Disease:</strong> <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>{history.chronicDisease}</span></div>
                        )}

                        {history.prescriptions && history.prescriptions.length > 0 && (
                          <div style={{ marginTop: '0.35rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
                            <strong style={{ fontSize: '0.65rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>Prescribed Medication:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {history.prescriptions.map((p, pIdx) => (
                                <div key={pIdx} style={{ background: 'var(--bg-primary)', padding: '0.35rem', borderRadius: '6px', fontSize: '0.65rem' }}>
                                  💊 <strong>{p.name}</strong> &bull; {p.dosage} &bull; {p.duration} <br/>
                                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Period: {p.startDate} to {p.endDate}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {history.vitals && Object.keys(history.vitals).length > 0 && (
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                            {Object.entries(history.vitals).map(([k, v]) => (
                              <span key={k} style={{ fontSize: '0.55rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}

                        {history.labReports && history.labReports.length > 0 && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.65rem', color: 'var(--color-info)' }}>
                            🧪 <strong>Lab Reports:</strong> {history.labReports.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Medication History Tracking List */}
          <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.65rem' }}>
              Medication History Tracking
            </strong>
            <div className="glass-panel" style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'left' }}>
              {(() => {
                const allMeds = [];
                (medicalHistories[activeMemberId] || []).forEach(history => {
                  if (history.prescriptions && history.prescriptions.length > 0) {
                    history.prescriptions.forEach(p => {
                      allMeds.push({
                        ...p,
                        doctor: history.doctor,
                        date: history.date
                      });
                    });
                  }
                });

                if (allMeds.length === 0) {
                  return <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No historical medications recorded.</div>;
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {allMeds.map((med, idx) => (
                      <div key={idx} style={{ paddingBottom: '0.5rem', borderBottom: idx === allMeds.length - 1 ? 'none' : '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{med.name}</strong>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            Dosage: {med.dosage} &bull; Duration: {med.duration} <br/>
                            Prescribing Doctor: {med.doctor} <br/>
                            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Period: {med.startDate} to {med.endDate}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span className="alert-badge success" style={{ fontSize: '0.5rem', padding: '0.05rem 0.25rem' }}>Completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Emergency SOS Quick Dial */}
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', background: 'var(--color-danger-light)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="phone" size={18} color="var(--color-danger)" />
          <div style={{ textAlign: 'left' }}>
            <strong style={{ fontSize: '0.8rem' }}>Emergency Quick Dial</strong>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Dispatches help & sends alert SMS</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => alert('🚨 SOS Broadcasted!')} style={{ background: 'var(--color-danger)', fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>SOS</button>
      </div>

      {/* Quick Actions 2-Column Grid */}
      <div className="quick-actions-section">
        <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'left', marginBottom: '0.5rem' }}>Quick Actions</strong>
        <div className="quick-actions-grid">
          <div className="action-card-el" onClick={() => setActiveTab('remind')}>
            <div className="action-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>%E2%9C%85</div> {/* Placeholder for emoji/icon */}
            <div className="action-details-box" style={{ textAlign: 'left' }}>
              <span className="action-title-lbl">Medicines</span>
              <span className="action-subtitle-lbl">Dose Schedules</span>
            </div>
          </div>
          <div className="action-card-el" onClick={() => setActiveTab('teleconsult')}>
            <div className="action-icon-box" style={{ background: '#f3e8ff', color: '#7c3aed' }}>🩺</div>
            <div className="action-details-box" style={{ textAlign: 'left' }}>
              <span className="action-title-lbl">Consult Doctor</span>
              <span className="action-subtitle-lbl">Book Video Visit</span>
            </div>
          </div>
          <div className="action-card-el" onClick={() => setActiveTab('records')}>
            <div className="action-icon-box" style={{ background: '#def7ec', color: '#0e9f6e' }}>📁</div>
            <div className="action-details-box" style={{ textAlign: 'left' }}>
              <span className="action-title-lbl">Health Files</span>
              <span className="action-subtitle-lbl">Lab report vaults</span>
            </div>
          </div>
          <div className="action-card-el" onClick={() => { setActiveTab('remind'); }}>
            <div className="action-icon-box" style={{ background: '#fee2e2', color: '#dc2626' }}>💉</div>
            <div className="action-details-box" style={{ textAlign: 'left' }}>
              <span className="action-title-lbl">Vaccinations</span>
              <span className="action-subtitle-lbl">Immunizations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Family ABHA & Insurance Portfolio Summary (Household View Only) */}
      {activeMemberId === 'household' && (
        <div style={{ marginTop: '0.2rem' }}>
          <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'left', marginBottom: '0.5rem' }}>
            Family Health Cards & Insurance
          </strong>
          <div className="glass-panel" style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {members.map((m, idx) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: idx === members.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${themeColors[m.colorTheme || 'teal']?.primary || 'var(--border-color)'}` }}>
                      {renderAvatar(m, '100%')}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)', display: 'block' }}>{m.name}</strong>
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>
                        ABHA: {m.abhaId ? 'Linked' : 'Not set'} &bull; Ins: {m.insuranceProvider ? 'Active' : 'Not set'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {m.insuranceSumInsured ? (
                      <strong style={{ fontSize: '0.7rem', color: 'var(--color-primary)', display: 'block' }}>₹{m.insuranceSumInsured} Cover</strong>
                    ) : (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>No Cover</span>
                    )}
                    {m.abhaAddress && <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block' }}>{m.abhaAddress}</span>}
                  </div>
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Total Household Cover:</span>
                <strong style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: '800' }}>
                  ₹{(() => {
                    let total = 0;
                    const policies = new Set();
                    members.forEach(m => {
                      if (m.insurancePolicyNumber && m.insuranceSumInsured) {
                        const key = `${m.insuranceProvider}-${m.insurancePolicyNumber}`;
                        if (!policies.has(key)) {
                          policies.add(key);
                          const num = parseInt(m.insuranceSumInsured.replace(/,/g, ''));
                          if (!isNaN(num)) total += num;
                        }
                      }
                    });
                    return total.toLocaleString('en-IN');
                  })()}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div style={{ marginTop: '0.2rem' }}>
        <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'left', marginBottom: '0.5rem' }}>Active Health Alerts</strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {getAlerts().map(a => (
            <div key={a.id} className={`glass-panel alert-message-row ${a.type}`} style={{ padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
                <Icon name={a.type === 'danger' ? 'alert' : 'check'} size={14} color={a.type === 'danger' ? 'var(--color-danger)' : a.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)'} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>{a.text}</span>
              </div>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Consultations */}
      <div style={{ marginTop: '0.2rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Consultations</strong>
          <span
            style={{ fontSize: '0.7rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '700' }}
            onClick={() => setActiveTab('teleconsult')}
          >
            Book New
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {appointmentsList.length > 0 ? (
            appointmentsList.map(app => {
              const appMember = members.find(m => m.id === app.memberId);
              const appDayMonth = formatHistoryDate(app.date);
              return (
                <div key={app.id} className="glass-panel" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '8px', width: '38px', height: '38px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>{appDayMonth.day}</span>
                      <span style={{ fontSize: '0.42rem', fontWeight: 'bold' }}>{appDayMonth.month}</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block' }}>{app.docName}</strong>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{app.specialty} &bull; {app.time} &bull; {appMember ? appMember.name : 'Household'}</span>
                    </div>
                  </div>
                  <span className="alert-badge success" style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{app.type}</span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              No upcoming appointments scheduled.
            </div>
          )}
        </div>
      </div>

      {/* Add medical history record bottom-sheet */}
      {showAddHistoryModal && (
        <div className="bottom-sheet-overlay" style={{ zIndex: 1100 }}>
          <div className="bottom-sheet" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Log Medical Record Event</h3>
              <button onClick={() => setShowAddHistoryModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>×</button>
            </div>
            <form onSubmit={handleHistorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="form-group"><label>Event Date</label><input type="date" className="form-control" value={historyForm.date} onChange={e => setHistoryForm({...historyForm, date: e.target.value})} required /></div>
              <div className="form-group"><label>Health Issue / Event Title</label><input type="text" className="form-control" placeholder="e.g. Fever checkup, Annual screening" value={historyForm.issue} onChange={e => setHistoryForm({...historyForm, issue: e.target.value})} required /></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group"><label>Consulting Doctor</label><input type="text" className="form-control" placeholder="e.g. Dr. Roy" value={historyForm.doctor} onChange={e => setHistoryForm({...historyForm, doctor: e.target.value})} required /></div>
                <div className="form-group">
                  <label>Visit Type</label>
                  <select className="form-control" value={historyForm.hospitalVisits} onChange={e => setHistoryForm({...historyForm, hospitalVisits: e.target.value})}>
                    <option value="Outpatient Clinic">Outpatient Clinic</option>
                    <option value="Hospital Admission">Hospital Admission</option>
                    <option value="Teleconsultation">Teleconsultation</option>
                    <option value="Emergency Room">Emergency Room</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group"><label>Diagnosis Details</label><textarea className="form-control" style={{ height: '50px' }} placeholder="Diagnosis details..." value={historyForm.diagnosis} onChange={e => setHistoryForm({...historyForm, diagnosis: e.target.value})} required /></div>
              <div className="form-group"><label>Treatment Details</label><textarea className="form-control" style={{ height: '50px' }} placeholder="e.g. Rest, Hydration, Exercises" value={historyForm.treatment} onChange={e => setHistoryForm({...historyForm, treatment: e.target.value})} required /></div>
              
              <strong style={{ fontSize: '0.75rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.2rem', marginTop: '0.25rem', textAlign: 'left' }}>Prescribed Medication (Optional)</strong>
              <div className="form-group"><label>Medicine Name</label><input type="text" className="form-control" placeholder="e.g. Paracetamol 650mg" value={historyForm.prescriptionName} onChange={e => setHistoryForm({...historyForm, prescriptionName: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group"><label>Dosage</label><input type="text" className="form-control" placeholder="e.g. 1 twice daily" value={historyForm.prescriptionDosage} onChange={e => setHistoryForm({...historyForm, prescriptionDosage: e.target.value})} /></div>
                <div className="form-group"><label>Duration</label><input type="text" className="form-control" placeholder="e.g. 5 Days" value={historyForm.prescriptionDuration} onChange={e => setHistoryForm({...historyForm, prescriptionDuration: e.target.value})} /></div>
              </div>
              
              <strong style={{ fontSize: '0.75rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.2rem', marginTop: '0.25rem', textAlign: 'left' }}>Vitals & Lab Reports (Optional)</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group"><label>Blood Pressure</label><input type="text" className="form-control" placeholder="120/80" value={historyForm.vitalsBP} onChange={e => setHistoryForm({...historyForm, vitalsBP: e.target.value})} /></div>
                <div className="form-group"><label>Pulse (bpm)</label><input type="number" className="form-control" placeholder="72" value={historyForm.vitalsHR} onChange={e => setHistoryForm({...historyForm, vitalsHR: e.target.value})} /></div>
                <div className="form-group"><label>Weight (kg)</label><input type="number" step="0.1" className="form-control" placeholder="75" value={historyForm.vitalsWeight} onChange={e => setHistoryForm({...historyForm, vitalsWeight: e.target.value})} /></div>
              </div>
              
              <div className="form-group"><label>Lab Reports / Scan Results</label><input type="text" className="form-control" placeholder="e.g. Lipid Profile, Ultrasound Scan" value={historyForm.labReports} onChange={e => setHistoryForm({...historyForm, labReports: e.target.value})} /></div>
              <div className="form-group"><label>Chronic Disease / Condition Notes</label><input type="text" className="form-control" placeholder="e.g. Diabetes, Hypertension" value={historyForm.chronicDisease} onChange={e => setHistoryForm({...historyForm, chronicDisease: e.target.value})} /></div>
              <div className="form-group"><label>Doctor Special Notes</label><textarea className="form-control" style={{ height: '40px' }} placeholder="Special instructions or precautions..." value={historyForm.notes} onChange={e => setHistoryForm({...historyForm, notes: e.target.value})} /></div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Save Medical Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Add member bottom-sheet modal */}
      {showAddModal && (
        <div className="bottom-sheet-overlay" style={{ zIndex: 1100 }}>
          <div className="bottom-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Register Family Member</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>×</button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '0.35rem' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: '2px dashed var(--color-primary)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onClick={() => document.getElementById('new-avatar-input-dash').click()}
                  title="Upload profile picture"
                >
                  {addForm.avatar ? (
                    <img src={addForm.avatar} alt="New Profile Pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '0.25rem' }}>
                      <Icon name="camera" size={18} color="var(--text-secondary)" />
                      <div style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>Upload</div>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Tap to select profile photo</span>
                <input
                  type="file"
                  id="new-avatar-input-dash"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const base64 = await compressAvatar(file);
                        setAddForm(prev => ({ ...prev, avatar: base64 }));
                      } catch (err) {
                        console.error("Failed to compress avatar:", err);
                      }
                    }
                  }}
                />
              </div>
              <div className="form-group"><label>Full Name</label><input type="text" className="form-control" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Relation</label>
                  <select className="form-control" value={addForm.relation} onChange={e => setAddForm({...addForm, relation: e.target.value})}>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Grand Father">Grand Father</option>
                    <option value="Grand Mother">Grand Mother</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={addForm.gender} onChange={e => setAddForm({...addForm, gender: e.target.value})}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group"><label>Age</label><input type="number" className="form-control" value={addForm.age} onChange={e => setAddForm({...addForm, age: e.target.value})} required /></div>
                <div className="form-group"><label>Weight (kg)</label><input type="number" step="0.1" className="form-control" value={addForm.weight} onChange={e => setAddForm({...addForm, weight: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select className="form-control" value={addForm.bloodGroup || ''} onChange={e => setAddForm({...addForm, bloodGroup: e.target.value})} required>
                    <option value="">Select Blood</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Profile Theme</label>
                  <select className="form-control" value={addForm.colorTheme || 'teal'} onChange={e => setAddForm({...addForm, colorTheme: e.target.value})} required>
                    <option value="teal">Teal (Green)</option>
                    <option value="blue">Blue (Sky)</option>
                    <option value="rose">Rose (Pink)</option>
                    <option value="amber">Amber (Yellow)</option>
                    <option value="purple">Purple (Violet)</option>
                    <option value="indigo">Indigo (Navy)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Pregnancy Mode</label>
                  <select className="form-control" value={addForm.pregnancyMode} onChange={e => setAddForm({...addForm, pregnancyMode: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Newborn Mode</label>
                  <select className="form-control" value={addForm.newbornMode} onChange={e => setAddForm({...addForm, newbornMode: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              {/* Collapsible ABHA & Insurance Section */}
              <div style={{ margin: '0.5rem 0', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                <div 
                  onClick={() => setShowAbhaSectionAddDash(!showAbhaSectionAddDash)} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '0.65rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ABHA & Insurance (Optional)
                  </strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{showAbhaSectionAddDash ? '▲' : '▼'}</span>
                </div>
                {showAbhaSectionAddDash && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', textAlign: 'left' }}>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem' }}>ABHA ID (14 digits)</label>
                      <input type="text" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.abhaId} onChange={e => setAddForm({...addForm, abhaId: e.target.value})} placeholder="91-1234-5678-9012" />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem' }}>ABHA Address</label>
                      <input type="text" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.abhaAddress} onChange={e => setAddForm({...addForm, abhaAddress: e.target.value})} placeholder="username@abdm" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Insurer</label>
                        <input type="text" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.insuranceProvider} onChange={e => setAddForm({...addForm, insuranceProvider: e.target.value})} placeholder="e.g. Star Health" />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Policy Name</label>
                        <input type="text" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.insurancePolicyName} onChange={e => setAddForm({...addForm, insurancePolicyName: e.target.value})} placeholder="e.g. Family Optima" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Policy Number</label>
                        <input type="text" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.insurancePolicyNumber} onChange={e => setAddForm({...addForm, insurancePolicyNumber: e.target.value})} placeholder="POL-123456" />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Sum Insured</label>
                        <input type="text" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.insuranceSumInsured} onChange={e => setAddForm({...addForm, insuranceSumInsured: e.target.value})} placeholder="e.g. 10,00,000" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Expiry Date</label>
                        <input type="date" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.insuranceExpiry} onChange={e => setAddForm({...addForm, insuranceExpiry: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>TPA Partner</label>
                        <input type="text" className="form-control" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} value={addForm.insuranceTPA} onChange={e => setAddForm({...addForm, insuranceTPA: e.target.value})} placeholder="Medi Assist" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>Register Profile</button>
            </form>
          </div>
        </div>
      {/* ABHA QR Code Modal */}
      {showQrModal && qrModalData && (
        <div className="bottom-sheet-overlay" style={{ zIndex: 1200 }} onClick={() => setShowQrModal(false)}>
          <div className="bottom-sheet" style={{ maxWidth: '360px', margin: '0 auto', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>ABHA ID Digital QR</strong>
              <button onClick={() => setShowQrModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://ndhm.gov.in/abha?id=${qrModalData.abhaId}&address=${qrModalData.abhaAddress}`} 
                  alt="ABHA QR Code" 
                  style={{ width: '160px', height: '160px' }}
                />
              </div>
              <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>Scan with any ABDM-enabled health app to share digital records</span>
              
              <div style={{ width: '100%', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '10px', marginTop: '0.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.65rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Name: <strong>{qrModalData.name}</strong></div>
                <div style={{ fontSize: '0.65rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>ABHA ID: <strong>{qrModalData.abhaId}</strong></div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-primary)' }}>Health Address: <strong>{qrModalData.abhaAddress}</strong></div>
              </div>
            </div>
            
            <button className="btn btn-secondary" onClick={() => setShowQrModal(false)} style={{ width: '100%', fontSize: '0.75rem', height: '36px' }}>Close</button>
          </div>
        </div>
      )}

      {/* Insurance T&C & Claims Modal */}
      {showInsuranceModal && insuranceModalData && (
        <div className="bottom-sheet-overlay" style={{ zIndex: 1200 }} onClick={() => setShowInsuranceModal(false)}>
          <div className="bottom-sheet" style={{ maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>🛡️ Policy Coverage & Details</strong>
              <button onClick={() => setShowInsuranceModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>×</button>
            </div>
            
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 'bold' }}>{insuranceModalData.insuranceProvider}</span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{insuranceModalData.insurancePolicyName}</h4>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Policy Number: <strong>{insuranceModalData.insurancePolicyNumber}</strong></div>
              </div>
              
              <div>
                <strong style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>🏥 Key Coverage Terms & Conditions:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    🏢 <strong>Room Rent Limit:</strong> Single Private AC Room fully covered. Deluxe rooms subject to 15% co-pay.
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    ⌛ <strong>Pre-Existing Diseases:</strong> Waiting period of 24 months (2 years) from policy inception.
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    👶 <strong>Maternity Cover (if active):</strong> Covered up to ₹1,00,000 for normal and ₹1,50,000 for C-section (Lakshmi's policy active).
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    💸 <strong>Co-Payment:</strong> 0% for treatments in Network Hospitals; 10% for non-network hospitals.
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: '10px', padding: '0.75rem', marginTop: '0.25rem' }}>
                <strong style={{ fontSize: '0.7rem', color: 'var(--color-danger)', display: 'block', marginBottom: '0.25rem' }}>🚨 Emergency Cashless Claims & TPA:</strong>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>TPA: <strong>{insuranceModalData.insuranceTPA || 'Direct Settlement'}</strong></div>
                  <div>TPA Toll-free Helpline: <strong style={{ color: 'var(--color-danger)' }}>1800-425-4444 / 1800-102-4477</strong></div>
                  <div>Email Support: <strong>claims@tpa-helpline.com</strong></div>
                  <div style={{ fontSize: '0.55rem', marginTop: '0.15rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Note: Pre-authorization request must be submitted within 24 hours of emergency hospitalization.</div>
                </div>
              </div>
              
              <button className="btn btn-primary" onClick={() => setShowInsuranceModal(false)} style={{ width: '100%', fontSize: '0.75rem', marginTop: '0.5rem' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardTab;
