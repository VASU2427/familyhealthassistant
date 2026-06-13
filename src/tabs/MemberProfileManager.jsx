import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { renderAvatar, themeColors } from '../components/MemberAvatar';
import { compressAvatar } from '../utils/image';
import Icon from '../components/Icon';

export function MemberProfileManager() {
  const { 
    members, 
    addFamilyMember, 
    updateFamilyMember, 
    setActiveMemberId, 
    setActiveTab, 
    updateMemberAvatar 
  } = useHealth();

  const [showAdd, setShowAdd] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showAbhaSectionAdd, setShowAbhaSectionAdd] = useState(false);
  const [showAbhaSectionEdit, setShowAbhaSectionEdit] = useState(false);
  
  const initialFormState = { 
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
  };

  const [form, setForm] = useState({ ...initialFormState });
  const [editForm, setEditForm] = useState({ ...initialFormState });

  const handleAdd = async (e) => {
    e.preventDefault();
    const nm = await addFamilyMember({ 
      ...form, 
      age: parseFloat(form.age), 
      weight: parseFloat(form.weight) || 60 
    });
    setActiveMemberId(nm.id);
    setActiveTab('dashboard');
    setShowAdd(false);
    setForm({ ...initialFormState });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateFamilyMember(editingMember.id, { 
      ...editForm, 
      age: parseFloat(editForm.age), 
      weight: parseFloat(editForm.weight) || 60 
    });
    setEditingMember(null);
  };

  const selectProfile = (id) => {
    setActiveMemberId(id);
    setActiveTab('dashboard');
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', margin: 0 }}>Family Profiles</h3>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAdd(true)} 
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <Icon name="userPlus" size={12} /> Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {members.map(m => (
          <div key={m.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div 
                style={{ 
                  position: 'relative', 
                  width: '45px', 
                  height: '45px', 
                  borderRadius: '50%', 
                  background: 'var(--bg-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  overflow: 'hidden',
                  border: `2px solid ${themeColors[m.colorTheme || 'teal']?.primary || 'var(--border-color)'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  flexShrink: 0
                }} 
                onClick={() => document.getElementById(`edit-avatar-input-${m.id}`).click()}
                title="Change profile picture"
              >
                {renderAvatar(m, '100%')}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  background: 'rgba(0, 0, 0, 0.5)', 
                  color: '#fff', 
                  fontSize: '0.45rem', 
                  textAlign: 'center', 
                  padding: '1px 0'
                }}>
                  <Icon name="camera" size={8} color="#fff" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                </div>
              </div>
              <input 
                type="file" 
                id={`edit-avatar-input-${m.id}`} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      const base64 = await compressAvatar(file);
                      updateMemberAvatar(m.id, base64);
                    } catch (err) {
                      console.error("Error setting avatar:", err);
                    }
                  }
                }} 
              />
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0 }}>{m.name}</h4>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <span className="alert-badge" style={{ fontSize: '0.55rem', background: themeColors[m.colorTheme || 'teal']?.primaryLight || 'var(--color-primary-light)', color: themeColors[m.colorTheme || 'teal']?.primary || 'var(--color-primary)', fontWeight: 'bold' }}>{m.relation}</span>
                  {m.bloodGroup && <span className="alert-badge info" style={{ fontSize: '0.55rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>🩸 {m.bloodGroup}</span>}
                  {m.birthDate && <span className="alert-badge" style={{ fontSize: '0.55rem', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>🎂 {m.birthDate}</span>}
                  {m.age && <span className="alert-badge" style={{ fontSize: '0.55rem', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>{m.age} yrs</span>}
                  {m.abhaId && <span className="alert-badge success" style={{ fontSize: '0.55rem', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 'bold' }}>🆔 ABHA</span>}
                  {m.insurancePolicyNumber && <span className="alert-badge info" style={{ fontSize: '0.55rem', background: 'var(--color-info-light)', color: 'var(--color-info)', fontWeight: 'bold' }}>🛡️ Insured</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button className="btn btn-secondary" onClick={() => selectProfile(m.id)} style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>View</button>
              <button className="btn btn-secondary" onClick={() => {
                setEditingMember(m);
                setEditForm({ ...m });
              }} style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add member bottom-sheet */}
      {showAdd && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Register Family Member</h3>
              <button onClick={() => setShowAdd(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>×</button>
            </div>
            <form onSubmit={handleAdd} style={{ marginTop: '0.75rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    overflow: 'hidden', 
                    border: '2px dashed var(--color-primary)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }} 
                  onClick={() => document.getElementById('new-avatar-input').click()}
                  title="Upload profile picture"
                >
                  {form.avatar ? (
                    <img src={form.avatar} alt="New Profile Pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <Icon name="camera" size={20} color="var(--text-secondary)" />
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Upload</div>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Tap to select profile photo</span>
                <input 
                  type="file" 
                  id="new-avatar-input" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const base64 = await compressAvatar(file);
                        setForm(prev => ({ ...prev, avatar: base64 }));
                      } catch (err) {
                        console.error("Failed to compress avatar:", err);
                      }
                    }
                  }} 
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Relation</label>
                  <select className="form-control" value={form.relation} onChange={e => setForm({...form, relation: e.target.value})}>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Grand Father">Grand Father</option>
                    <option value="Grand Mother">Grand Mother</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={form.birthDate || ''} 
                    onChange={e => {
                      const dob = e.target.value;
                      let ageVal = form.age;
                      if (dob) {
                        const birthDateObj = new Date(dob);
                        const diffMs = Date.now() - birthDateObj.getTime();
                        const ageDate = new Date(diffMs);
                        const yrs = Math.abs(ageDate.getUTCFullYear() - 1970);
                        ageVal = yrs.toString();
                      }
                      setForm(prev => ({ ...prev, birthDate: dob, age: ageVal }));
                    }} 
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" className="form-control" value={form.age} onChange={e => setForm({...form, age: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select 
                    className="form-control" 
                    value={form.bloodGroup || ''} 
                    onChange={e => setForm({...form, bloodGroup: e.target.value})}
                    required
                  >
                    <option value="">Select Blood Group</option>
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
                  <select 
                    className="form-control" 
                    value={form.colorTheme || 'teal'} 
                    onChange={e => setForm({...form, colorTheme: e.target.value})}
                    required
                  >
                    <option value="teal">Teal (Green)</option>
                    <option value="blue">Blue (Sky)</option>
                    <option value="rose">Rose (Pink)</option>
                    <option value="amber">Amber (Yellow)</option>
                    <option value="purple">Purple (Violet)</option>
                    <option value="indigo">Indigo (Navy)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.1" className="form-control" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Pregnancy Mode</label>
                  <select className="form-control" value={String(form.pregnancyMode)} onChange={e => setForm({...form, pregnancyMode: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Newborn Mode</label>
                  <select className="form-control" value={String(form.newbornMode)} onChange={e => setForm({...form, newbornMode: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              {/* Collapsible ABHA & Insurance Section */}
              <div style={{ margin: '1rem 0', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                <div 
                  onClick={() => setShowAbhaSectionAdd(!showAbhaSectionAdd)} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '0.72rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ABHA ID & Health Insurance (Optional)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{showAbhaSectionAdd ? '▲' : '▼'}</span>
                </div>
                {showAbhaSectionAdd && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label>ABHA ID (14 digits)</label>
                      <input type="text" className="form-control" value={form.abhaId} onChange={e => setForm({...form, abhaId: e.target.value})} placeholder="91-1234-5678-9012" />
                    </div>
                    <div className="form-group">
                      <label>ABHA Address</label>
                      <input type="text" className="form-control" value={form.abhaAddress} onChange={e => setForm({...form, abhaAddress: e.target.value})} placeholder="username@abdm" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label>Insurer</label>
                        <input type="text" className="form-control" value={form.insuranceProvider} onChange={e => setForm({...form, insuranceProvider: e.target.value})} placeholder="e.g. Star Health" />
                      </div>
                      <div className="form-group">
                        <label>Policy Name</label>
                        <input type="text" className="form-control" value={form.insurancePolicyName} onChange={e => setForm({...form, insurancePolicyName: e.target.value})} placeholder="e.g. Family Optima" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label>Policy Number</label>
                        <input type="text" className="form-control" value={form.insurancePolicyNumber} onChange={e => setForm({...form, insurancePolicyNumber: e.target.value})} placeholder="POL-123456" />
                      </div>
                      <div className="form-group">
                        <label>Sum Insured</label>
                        <input type="text" className="form-control" value={form.insuranceSumInsured} onChange={e => setForm({...form, insuranceSumInsured: e.target.value})} placeholder="e.g. 10,00,000" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input type="date" className="form-control" value={form.insuranceExpiry} onChange={e => setForm({...form, insuranceExpiry: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Third Party Admin (TPA)</label>
                        <input type="text" className="form-control" value={form.insuranceTPA} onChange={e => setForm({...form, insuranceTPA: e.target.value})} placeholder="e.g. Medi Assist" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Register Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit member bottom-sheet */}
      {editingMember && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Edit Profile Details</h3>
              <button onClick={() => setEditingMember(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}><Icon name="x" size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ marginTop: '0.75rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    overflow: 'hidden', 
                    border: '2px dashed var(--color-primary)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }} 
                  onClick={() => document.getElementById('edit-modal-avatar-input').click()}
                  title="Upload profile picture"
                >
                  {editForm.avatar ? (
                    <img src={editForm.avatar} alt="Edit Profile Pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <Icon name="camera" size={20} color="var(--text-secondary)" />
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Upload</div>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Tap to change profile photo</span>
                <input 
                  type="file" 
                  id="edit-modal-avatar-input" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const base64 = await compressAvatar(file);
                        setEditForm(prev => ({ ...prev, avatar: base64 }));
                      } catch (err) {
                        console.error("Failed to compress avatar:", err);
                      }
                    }
                  }} 
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Relation</label>
                  <select className="form-control" value={editForm.relation} onChange={e => setEditForm({...editForm, relation: e.target.value})} disabled={editingMember.id === 'owner'}>
                    <option value="Owner">Owner</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Grand Father">Grand Father</option>
                    <option value="Grand Mother">Grand Mother</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={editForm.birthDate || ''} 
                    onChange={e => {
                      const dob = e.target.value;
                      let ageVal = editForm.age;
                      if (dob) {
                        const birthDateObj = new Date(dob);
                        const diffMs = Date.now() - birthDateObj.getTime();
                        const ageDate = new Date(diffMs);
                        const yrs = Math.abs(ageDate.getUTCFullYear() - 1970);
                        ageVal = yrs.toString();
                      }
                      setEditForm(prev => ({ ...prev, birthDate: dob, age: ageVal }));
                    }} 
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" className="form-control" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select 
                    className="form-control" 
                    value={editForm.bloodGroup || ''} 
                    onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})}
                    required
                  >
                    <option value="">Select Blood Group</option>
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
                  <select 
                    className="form-control" 
                    value={editForm.colorTheme || 'teal'} 
                    onChange={e => setEditForm({...editForm, colorTheme: e.target.value})}
                    required
                  >
                    <option value="teal">Teal (Green)</option>
                    <option value="blue">Blue (Sky)</option>
                    <option value="rose">Rose (Pink)</option>
                    <option value="amber">Amber (Yellow)</option>
                    <option value="purple">Purple (Violet)</option>
                    <option value="indigo">Indigo (Navy)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.1" className="form-control" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Pregnancy Mode</label>
                  <select className="form-control" value={String(editForm.pregnancyMode)} onChange={e => setEditForm({...editForm, pregnancyMode: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Newborn Mode</label>
                  <select className="form-control" value={String(editForm.newbornMode)} onChange={e => setEditForm({...editForm, newbornMode: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              {/* Collapsible ABHA & Insurance Section */}
              <div style={{ margin: '1rem 0', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                <div 
                  onClick={() => setShowAbhaSectionEdit(!showAbhaSectionEdit)} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '0.72rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ABHA ID & Health Insurance (Optional)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{showAbhaSectionEdit ? '▲' : '▼'}</span>
                </div>
                {showAbhaSectionEdit && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label>ABHA ID (14 digits)</label>
                      <input type="text" className="form-control" value={editForm.abhaId || ''} onChange={e => setEditForm({...editForm, abhaId: e.target.value})} placeholder="91-1234-5678-9012" />
                    </div>
                    <div className="form-group">
                      <label>ABHA Address</label>
                      <input type="text" className="form-control" value={editForm.abhaAddress || ''} onChange={e => setEditForm({...editForm, abhaAddress: e.target.value})} placeholder="username@abdm" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label>Insurer</label>
                        <input type="text" className="form-control" value={editForm.insuranceProvider || ''} onChange={e => setEditForm({...editForm, insuranceProvider: e.target.value})} placeholder="e.g. Star Health" />
                      </div>
                      <div className="form-group">
                        <label>Policy Name</label>
                        <input type="text" className="form-control" value={editForm.insurancePolicyName || ''} onChange={e => setEditForm({...editForm, insurancePolicyName: e.target.value})} placeholder="e.g. Family Optima" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label>Policy Number</label>
                        <input type="text" className="form-control" value={editForm.insurancePolicyNumber || ''} onChange={e => setEditForm({...editForm, insurancePolicyNumber: e.target.value})} placeholder="POL-123456" />
                      </div>
                      <div className="form-group">
                        <label>Sum Insured</label>
                        <input type="text" className="form-control" value={editForm.insuranceSumInsured || ''} onChange={e => setEditForm({...editForm, insuranceSumInsured: e.target.value})} placeholder="e.g. 10,00,000" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input type="date" className="form-control" value={editForm.insuranceExpiry || ''} onChange={e => setEditForm({...editForm, insuranceExpiry: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Third Party Admin (TPA)</label>
                        <input type="text" className="form-control" value={editForm.insuranceTPA || ''} onChange={e => setEditForm({...editForm, insuranceTPA: e.target.value})} placeholder="e.g. Medi Assist" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Save Details</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberProfileManager;
