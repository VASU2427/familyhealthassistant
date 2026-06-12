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
    colorTheme: 'teal'
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
      colorTheme: 'teal'
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>Register Profile</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardTab;
