import React, { useState, useEffect, useRef } from 'react';
import { useHealth } from '../context/HealthContext';
import { renderAvatar } from '../components/MemberAvatar';
import ProfileSelectionPrompt from '../components/ProfileSelectionPrompt';
import Icon from '../components/Icon';

const doctorsList = [
  { id: 'd1', name: 'Dr. Anita Roy', specialty: 'Gynecologist', hospital: 'Care Womens Hospital', fee: 'Rs. 800', rating: '4.9 (240)', availability: 'Available Today' },
  { id: 'd2', name: 'Dr. Vivek Verma', specialty: 'Pediatrician', hospital: 'Childrens Clinic', fee: 'Rs. 600', rating: '4.8 (310)', availability: 'Available Today' },
  { id: 'd3', name: 'Dr. S. K. Gupta', specialty: 'General Physician', hospital: 'City Medical Center', fee: 'Rs. 500', rating: '4.7 (185)', availability: 'Available Today' },
  { id: 'd4', name: 'Dr. Preeti Sharma', specialty: 'Cardiologist', hospital: 'Metro Heart Institute', fee: 'Rs. 1000', rating: '4.9 (95)', availability: 'Available in 2 Days' }
];

const labPackages = [
  {
    id: 'pkg1',
    name: 'Basic Vitals Screening',
    description: 'Essential health checkup containing blood glucose, hemoglobin, and baseline vitals mapping.',
    fasting: 'No fasting required. Any time of day.',
    cost: 699,
    tests: ['Blood Glucose', 'Hemoglobin'],
    simulatedVitals: { glucose: 95, hemoglobin: 13.8 }
  },
  {
    id: 'pkg2',
    name: 'Cardiovascular & Lipid Panel',
    description: 'Detailed assessment of cholesterol, triglycerides, HDL, and LDL levels to monitor heart health.',
    fasting: 'Requires 10-12 hours of overnight fasting.',
    cost: 899,
    tests: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides'],
    simulatedVitals: { cholesterol: 185, hdl: 46, ldl: 110, triglycerides: 145 }
  },
  {
    id: 'pkg3',
    name: 'Comprehensive Metabolic Profiling',
    description: 'Complete metabolic health analysis covering blood sugar, full lipid panel, kidney function (creatinine), and blood count.',
    fasting: 'Requires 10-12 hours of overnight fasting.',
    cost: 1699,
    tests: ['Blood Glucose', 'Total Cholesterol', 'HDL', 'LDL', 'Triglycerides', 'Creatinine', 'Hemoglobin'],
    simulatedVitals: { glucose: 102, cholesterol: 194, hdl: 49, ldl: 117, triglycerides: 139, creatinine: 0.9, hemoglobin: 14.1 }
  }
];

export function TeleConsultation() {
  const { 
    appointments, 
    bookAppointment, 
    activeMember, 
    addMedicine, 
    activeMemberId, 
    members, 
    logVitals,
    sampleCollections, 
    bookSampleCollection, 
    updateCollectionStatus, 
    cancelCollection, 
    markCollectionSynced, 
    addToast
  } = useHealth();

  if (activeMemberId === 'household') {
    return <ProfileSelectionPrompt title="Doctor Teleconsultations & Lab Tests" />;
  }
  
  const [activeCall, setActiveCall] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [pendingPrescription, setPendingPrescription] = useState(null);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'doctor', text: 'Hello! I am reviewing the health records. How can I help you today?', time: 'Just now' }
  ]);
  const videoRef = useRef(null);

  // Labs specific state
  const [clinicSubTab, setClinicSubTab] = useState('telehealth'); // 'telehealth' or 'labs'
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bookingForm, setBookingForm] = useState({ 
    memberId: 'owner', 
    date: '', 
    timeSlot: '08:00 AM - 10:00 AM', 
    address: 'Plot 42, Hitech City, Hyderabad, 500081', 
    notes: '' 
  });
  const [activeTrackerId, setActiveTrackerId] = useState(null);

  useEffect(() => {
    let streamRef = null;
    if (activeCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => { 
          streamRef = s;
          if (videoRef.current) videoRef.current.srcObject = s; 
        })
        .catch(e => console.warn('Camera/mic access blocked or not available:', e));
    }
    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeCall]);

  const handleSendMsg = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, time: 'Now' }]);
    setChatInput('');

    setTimeout(() => {
      let doctorText = 'I am prescribing Calcium Tablets to support your calcium levels. You can sync it directly to your routine below.';
      if (userMsg.toLowerCase().includes('dizzy') || userMsg.toLowerCase().includes('vitamin')) {
        doctorText = 'Understood. I\'ve written a prescription for Calcium Tablets. Sync it below.';
        setPendingPrescription({ name: 'Calcium Tablets', dosage: '500mg', time: 'After Lunch', total: 30 });
      }
      setMessages(prev => [...prev, { sender: 'doctor', text: doctorText, time: 'Just now' }]);
    }, 1200);
  };

  const runSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { 
      alert('Browser Speech-to-Text not supported in this browser.'); 
      return; 
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    setIsListening(true);
    recognition.start();
    recognition.onresult = (event) => {
      setChatInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const syncPrescription = () => {
    if (!pendingPrescription) return;
    addMedicine(activeMemberId, pendingPrescription);
    setPendingPrescription(null);
    addToast('Prescribed medicine added to schedule!', 'success');
  };

  const sendDoctorPresetQuestion = (questionText) => {
    setChatInput(questionText);
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'user', text: questionText, time: 'Now' }]);
      setChatInput('');
      setTimeout(() => {
        let docReply = 'Let me look at your records. I recommend checking your daily vital graphs.';
        if (questionText.toLowerCase().includes('dizzy')) {
          docReply = 'Dizziness is common. I am prescribing Calcium Tablets to support your levels. You can sync this directly to your routine.';
          setPendingPrescription({ name: 'Calcium Tablets', dosage: '500mg', time: 'After Lunch', total: 30 });
        }
        setMessages(prev => [...prev, { sender: 'doctor', text: docReply, time: 'Just now' }]);
      }, 1200);
    }, 200);
  };

  const memberCollections = activeMemberId === 'household'
    ? sampleCollections || []
    : (sampleCollections || []).filter(c => c.memberId === activeMemberId);

  const memberAppointments = activeMemberId === 'household'
    ? appointments || []
    : (appointments || []).filter(app => app.memberId === activeMemberId);

  return (
    <div className="fade-in">
      {/* Sub-tab switcher */}
      {!activeCall && (
        <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '8px', padding: '0.2rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
          <button 
            style={{ 
              flex: 1, 
              padding: '0.45rem', 
              fontSize: '0.75rem', 
              borderRadius: '6px', 
              border: 'none', 
              background: clinicSubTab === 'telehealth' ? 'var(--color-primary)' : 'transparent', 
              color: clinicSubTab === 'telehealth' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} 
            onClick={() => setClinicSubTab('telehealth')}
          >
            Telehealth Consults
          </button>
          <button 
            style={{ 
              flex: 1, 
              padding: '0.45rem', 
              fontSize: '0.75rem', 
              borderRadius: '6px', 
              border: 'none', 
              background: clinicSubTab === 'labs' ? 'var(--color-primary)' : 'transparent', 
              color: clinicSubTab === 'labs' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} 
            onClick={() => setClinicSubTab('labs')}
          >
            Home Lab Tests
          </button>
        </div>
      )}

      {!activeCall ? (
        clinicSubTab === 'telehealth' ? (
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', margin: 0 }}>Book Telehealth Consultations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {doctorsList.map(doc => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{doc.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.specialty} &bull; {doc.hospital}</span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Rating: {doc.rating} &bull; {doc.fee}</p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      bookAppointment({ 
                        docName: doc.name, 
                        specialty: doc.specialty, 
                        date: new Date().toISOString().split('T')[0], 
                        time: '5:00 PM', 
                        type: 'Teleconsultation', 
                        memberId: activeMemberId 
                      });
                    }} 
                    style={{ height: '28px', padding: '0 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}
                  >
                    Book
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ margin: '1.25rem 0 0.5rem 0', fontSize: '0.95rem' }}>Booked Appointments</h3>
            {memberAppointments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {memberAppointments.map(app => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div>
                      <strong>{app.docName}</strong> ({app.specialty})
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>📅 Scheduled: {app.date} at {app.time}</p>
                    </div>
                    {app.type === 'Teleconsultation' && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => setActiveCall(app)} 
                        style={{ background: 'var(--color-success)', height: '28px', padding: '0 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: 'none' }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>No consultations booked.</p>
            )}
          </div>
        ) : (
          /* Labs View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <span style={{ fontSize: '1.1rem' }}>🧪</span> Active Home Collections
              </h3>
              {memberCollections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {memberCollections.map(col => {
                    const colMember = members.find(m => m.id === col.memberId) || { name: 'Owner', avatar: '👨' };
                    const isTracking = activeTrackerId === col.id;
                    return (
                      <div key={col.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', background: 'var(--bg-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {renderAvatar(colMember, '1.2rem')}
                            <div>
                              <h4 style={{ fontWeight: '700', fontSize: '0.78rem', margin: 0 }}>{colMember.name}</h4>
                              <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: 0 }}>Scheduled: {col.date} &bull; {col.timeSlot}</p>
                            </div>
                          </div>
                          <span className={`alert-badge ${
                            col.status === 'Scheduled' ? 'warning' :
                            col.status === 'Sample Collected' ? 'info' :
                            col.status === 'In Lab' ? 'info' : 'success'
                          }`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>
                            {col.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          <strong>Tests:</strong> {col.tests.join(', ')}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                          {col.status === 'Scheduled' && (
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => setActiveTrackerId(isTracking ? null : col.id)}
                              style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', height: 'auto', borderRadius: '4px' }}
                            >
                              {isTracking ? 'Close Tracker' : 'Track Phlebotomist'}
                            </button>
                          )}

                          {col.status !== 'Report Ready' && (
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => {
                                const stages = ['Scheduled', 'Sample Collected', 'In Lab', 'Report Ready'];
                                const curIndex = stages.indexOf(col.status);
                                if (curIndex !== -1 && curIndex < stages.length - 1) {
                                  updateCollectionStatus(col.id, stages[curIndex + 1]);
                                }
                              }}
                              style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', height: 'auto', borderRadius: '4px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                            >
                              ⏩ Advance Stage
                            </button>
                          )}

                          {col.status === 'Report Ready' && (
                            <button 
                              className="btn btn-primary" 
                              disabled={col.synced}
                              onClick={() => {
                                logVitals(col.memberId, col.simulatedVitals, col.date);
                                markCollectionSynced(col.id);
                              }}
                              style={{ 
                                fontSize: '0.65rem', 
                                padding: '0.25rem 0.5rem', 
                                height: 'auto', 
                                borderRadius: '4px', 
                                background: col.synced ? 'var(--border-color)' : 'var(--color-success)', 
                                color: '#fff', 
                                border: 'none',
                                cursor: col.synced ? 'default' : 'pointer'
                              }}
                            >
                              {col.synced ? '✔ Synced to Profile' : '📥 Sync Vitals to Profile'}
                            </button>
                          )}

                          {col.status === 'Scheduled' && (
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => cancelCollection(col.id)}
                              style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', height: 'auto', borderRadius: '4px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>

                        {isTracking && (
                          <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.68rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem', marginBottom: '0.2rem' }}>
                              <strong>Phlebotomist Live Tracker</strong>
                              <span style={{ color: 'var(--color-success)' }}>● On the way</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Agent: <strong>Ramesh Kumar</strong></span>
                              <span>Contact: <strong>+91-98765-43210</strong></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Estimated Arrival: <strong>12 mins</strong></span>
                              <span>Box Temp: <strong style={{ color: 'var(--color-success)' }}>4.2°C (Optimal)</strong></span>
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                              *Cold-chain box is monitored in real-time to preserve blood samples.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', margin: 0 }}>No home collections scheduled.</p>
              )}
            </div>

            <h3 style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>Available Test Packages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {labPackages.map(pkg => (
                <div key={pkg.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>{pkg.name}</h4>
                      <span style={{ fontSize: '0.62rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '0.1rem', display: 'block' }}>{pkg.fasting}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-success)' }}>Rs. {pkg.cost}</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.25', margin: 0 }}>{pkg.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', margin: '0.2rem 0' }}>
                    {pkg.tests.map((t, idx) => (
                      <span key={idx} className="alert-badge" style={{ fontSize: '0.55rem', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>{t}</span>
                    ))}
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setBookingForm({
                        memberId: activeMemberId === 'household' ? 'owner' : activeMemberId,
                        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        timeSlot: '08:00 AM - 10:00 AM',
                        address: 'Plot 42, Hitech City, Hyderabad, 500081',
                        notes: ''
                      });
                      setShowBookingSheet(true);
                    }}
                    style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.75rem', padding: '0.4rem' }}
                  >
                    Book Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Immersive Phone Consult Screen overlay */
        <div style={{ display: 'flex', flexDirection: 'column', background: '#020617', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, padding: '44px 1rem 20px 1rem', overflow: 'hidden' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Doctor profile card */}
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 0.75rem auto' }}>👩‍⚕️</div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: 0 }}>{activeCall.docName}</h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '0.2rem', display: 'block' }}>Connecting HD Feed...</span>
              
              <div className="voice-wave-container" style={{ justifyContent: 'center', display: 'flex', gap: '3px', marginTop: '0.75rem' }}>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
              </div>
            </div>
            
            {/* Self camera feed */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ position: 'absolute', bottom: '1rem', right: '0rem', width: '90px', height: '120px', borderRadius: '12px', border: '2px solid #334155', objectFit: 'cover' }} 
            />
          </div>

          {/* Call Controls HUD */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', zIndex: 1001, marginBottom: '0.5rem' }}>
            <button className="btn-icon" onClick={() => setShowChatDrawer(!showChatDrawer)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', fontSize: '1.1rem' }}>💬</button>
            <button className="btn-icon" onClick={runSpeechToText} style={{ background: isListening ? 'var(--color-danger)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', fontSize: '1.1rem' }}>🎙️</button>
            <button 
              className="btn btn-primary" 
              onClick={() => setActiveCall(null)} 
              style={{ background: 'var(--color-danger)', borderRadius: '50%', width: '42px', height: '42px', padding: 0, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icon name="x" size={18} color="#fff" />
            </button>
          </div>

          {/* Translucent Chat Overlay Drawer */}
          {showChatDrawer && (
            <div style={{ background: 'rgba(30, 41, 59, 0.95)', borderTop: '1px solid #334155', position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', padding: '1rem', display: 'flex', flexDirection: 'column', zIndex: 1002, borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <strong>Call Chat Logs</strong>
                <span onClick={() => setShowChatDrawer(false)} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>Close</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingRight: '0.25rem', textAlign: 'left' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? 'var(--color-primary)' : '#334155', padding: '0.45rem', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', maxWidth: '85%' }}>
                    {m.text}
                  </div>
                ))}
                {pendingPrescription && (
                  <div style={{ background: 'rgba(10, 158, 124, 0.2)', border: '1px solid var(--color-primary)', padding: '0.5rem', borderRadius: '6px', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Pending Refill Sync:</span>
                    <p style={{ fontSize: '0.65rem', color: '#fff', margin: '0.2rem 0' }}>{pendingPrescription.name} ({pendingPrescription.dosage})</p>
                    <button className="btn btn-primary" onClick={syncPrescription} style={{ width: '100%', padding: '0.25rem', fontSize: '0.7rem', marginTop: '0.25rem' }}>Sync to Routine</button>
                  </div>
                )}
              </div>
              
              {/* Presenter Question Aids */}
              <div style={{ padding: '0.35rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                <button type="button" onClick={() => sendDoctorPresetQuestion('I am Lakshmi and feeling dizzy')} style={{ padding: '0.25rem 0.4rem', background: '#020617', border: 'none', borderRadius: '4px', color: '#94a3b8', fontSize: '0.65rem', cursor: 'pointer' }}>Ask dizziness</button>
              </div>

              <form onSubmit={handleSendMsg} style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                <input type="text" placeholder="Speak/type text..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="form-control" style={{ background: '#020617', border: '1px solid #334155', color: '#fff', fontSize: '0.75rem', height: '32px' }} />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 0.5rem', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="send" size={12} /></button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Booking sheet overlay */}
      {showBookingSheet && selectedPackage && (
        <div className="bottom-sheet-overlay" style={{ zIndex: 2000 }}>
          <div className="bottom-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0 }}>Book {selectedPackage.name}</h3>
              <button onClick={() => setShowBookingSheet(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>×</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              bookSampleCollection(
                bookingForm.memberId,
                selectedPackage.tests,
                bookingForm.address,
                bookingForm.date,
                bookingForm.timeSlot,
                selectedPackage.cost,
                bookingForm.notes,
                selectedPackage.simulatedVitals
              );
              setShowBookingSheet(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.65rem' }}>Patient Name</label>
                <select 
                  className="form-control" 
                  style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                  value={bookingForm.memberId} 
                  onChange={e => setBookingForm({ ...bookingForm, memberId: e.target.value })}
                  required
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.65rem' }}>Preferred Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                    value={bookingForm.date} 
                    onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.65rem' }}>Time Slot</label>
                  <select 
                    className="form-control" 
                    style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                    value={bookingForm.timeSlot} 
                    onChange={e => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    required
                  >
                    <option value="06:00 AM - 08:00 AM (Fasting Preferred)">06:00 AM - 08:00 AM (Fasting)</option>
                    <option value="08:00 AM - 10:00 AM (Fasting Preferred)">08:00 AM - 10:00 AM (Fasting)</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.65rem' }}>Collection Address</label>
                <textarea 
                  className="form-control" 
                  style={{ padding: '0.35rem', fontSize: '0.75rem', height: '50px', resize: 'none' }}
                  value={bookingForm.address} 
                  onChange={e => setBookingForm({ ...bookingForm, address: e.target.value })}
                  placeholder="Enter full address for sample collection..."
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.65rem' }}>Special Instructions (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                  value={bookingForm.notes} 
                  onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="e.g., Doorbell not working, call before arrival"
                />
              </div>

              <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Total Cost</span>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-success)' }}>Rs. {selectedPackage.cost}</div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.75rem' }}>Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeleConsultation;
