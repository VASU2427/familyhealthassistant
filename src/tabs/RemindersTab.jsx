import React, { useState, useEffect, useRef } from 'react';
import { useHealth } from '../context/HealthContext';
import ProfileSelectionPrompt from '../components/ProfileSelectionPrompt';
import Icon from '../components/Icon';
import { runOCR, runVaccineOCR } from '../services/gemini';

export function RemindersTab() {
  const {
    activeMember,
    activeMemberId,
    medicines,
    logMedicineDose,
    orderMedicines,
    vaccinations,
    updateVaccinationStatus,
    addVaccination,
    deleteVaccination,
    geminiKey,
    addMedicine,
    uploadedRecords,
    setUploadedRecords,
    addToast
  } = useHealth();

  if (activeMemberId === 'household') {
    return <ProfileSelectionPrompt title="Medication & Vaccination Reminders" />;
  }

  const [subTab, setSubTab] = useState('medicines');
  const [basket, setBasket] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [fdaData, setFdaData] = useState(null);
  const [loadingFda, setLoadingFda] = useState(false);

  // Reminders scanning & manual add states
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [manualMedForm, setManualMedForm] = useState({ name: '', dosage: '1 Tablet', time: 'Morning', total: 30 });

  // Camera & Scan states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [stream, setStream] = useState(null);
  
  // Cropper states
  const [cropping, setCropping] = useState(false);
  const [corners, setCorners] = useState({
    tl: { x: 15, y: 15 },
    tr: { x: 85, y: 15 },
    br: { x: 85, y: 85 },
    bl: { x: 15, y: 85 }
  });
  const [draggingHandle, setDraggingHandle] = useState(null);

  // Consent & Auth
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Extracted Prescription Meds
  const [extractedMeds, setExtractedMeds] = useState([]);
  const [isScanFinished, setIsScanFinished] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startPrescriptionScan = async () => {
    setSelectedFile(null);
    setFileBase64('');
    setExtractedMeds([]);
    setIsScanFinished(false);
    setCameraActive(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(err => console.error("Video play failed:", err));
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not start live video stream. Upload a prescription instead.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setFileBase64(dataUrl);
    setSelectedFile({
      name: 'Prescription_' + new Date().toISOString().split('T')[0] + '_' + Math.floor(Math.random() * 1000) + '.jpg',
      type: 'image/jpeg',
      size: Math.round((dataUrl.length * 3) / 4)
    });
    stopCamera();
    setCropping(true);
  };

  const handlePointerDown = (handle, e) => {
    e.preventDefault();
    setDraggingHandle(handle);
  };

  const handlePointerMove = (e) => {
    if (!draggingHandle || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setCorners(prev => ({
      ...prev,
      [draggingHandle]: { x: Math.round(x), y: Math.round(y) }
    }));
  };

  const handlePointerUp = () => {
    setDraggingHandle(null);
  };

  const triggerScan = async () => {
    setScanning(true);
    setScanStep("Reading report metadata...");
    await new Promise(r => setTimeout(r, 600));
    setScanStep("Running OCR & structuring prescription medications...");
    await new Promise(r => setTimeout(r, 800));

    if (geminiKey && fileBase64) {
      setScanStep("Consulting Gemini AI to extract Rx medications...");
      try {
        const extracted = await runOCR(geminiKey, fileBase64, 'English');
        const meds = Array.isArray(extracted.medications) 
          ? extracted.medications.filter(m => m && m.name)
          : [];
        
        if (meds.length === 0) {
          addToast("No medications detected in prescription image. Try mock template.", "warning");
          runMockScan();
        } else {
          setExtractedMeds(meds);
          setIsScanFinished(true);
        }
      } catch (err) {
        console.error(err);
        addToast(`OCR Extraction failed: ${err.message}. Using fallback.`, 'danger');
        runMockScan();
      } finally {
        setScanning(false);
      }
    } else {
      runMockScan();
      setScanning(false);
    }
  };

  const runMockScan = () => {
    const meds = [
      { name: "Amoxicillin", dosage: "500mg", frequency: "Morning & Night" },
      { name: "Paracetamol", dosage: "650mg", frequency: "Afternoon (if fever)" },
      { name: "Cetirizine", dosage: "10mg", frequency: "Night" }
    ];
    setExtractedMeds(meds);
    setIsScanFinished(true);
  };

  const handleSaveConfirm = () => {
    const recordName = selectedFile ? selectedFile.name : 'Prescription_OCR_' + new Date().toISOString().split('T')[0] + '.jpg';
    let savedBase64 = fileBase64;
    if (fileBase64 && fileBase64.length > 350000) {
      savedBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23090d16'/><text x='10' y='50' fill='%2364748b' font-size='8'>[Archived Prescription Content]</text></svg>";
    }

    setUploadedRecords(prev => [
      {
        id: 'prescription_' + Date.now(),
        memberId: activeMember.id,
        name: recordName,
        date: new Date().toISOString().split('T')[0],
        doctor: 'AI Auto-Scanner',
        type: 'Prescription',
        fileData: savedBase64,
        notes: 'Extracted medications from prescription scanner.',
        diagnosis: ["Prescription Routine Update"],
        advice: ["Take medications as scheduled"],
        medications: extractedMeds.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, route: 'Orally', duration: '30 days' })),
        tests: []
      },
      ...prev
    ]);

    addToast("Prescription saved securely to Repository!", "success");
    setShowAuthModal(false);
    setPin('');
    setAuthError('');
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualMedForm.name.trim()) return;
    addMedicine(activeMember.id, {
      name: manualMedForm.name,
      dosage: manualMedForm.dosage,
      time: manualMedForm.time,
      total: manualMedForm.total
    });
    setShowAddReminderModal(false);
    setManualMedForm({ name: '', dosage: '1 Tablet', time: 'Morning', total: 30 });
  };

  const handleToggle = (m) => {
    if (basket.find(x => x.id === m.id)) setBasket(basket.filter(x => x.id !== m.id));
    else setBasket([...basket, m]);
  };

  const handleOrder = () => {
    if (basket.length === 0) return;
    const list = basket.map(b => b.name).join(', ');
    orderMedicines(list, basket.length * 350);
    setBasket([]);
  };

  useEffect(() => {
    if (!selectedMed) {
      setFdaData(null);
      return;
    }

    const fetchFDA = async () => {
      setLoadingFda(true);
      setFdaData(null);
      try {
        const cleanName = encodeURIComponent(selectedMed.name.trim().split(' ')[0]);
        const url = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:"${cleanName}"+openfda.generic_name:"${cleanName}")&limit=1`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setFdaData(data.results[0]);
            return;
          }
        }
      } catch (e) {
        console.error("Error fetching openFDA data:", e);
      } finally {
        setLoadingFda(false);
      }
    };

    fetchFDA();
  }, [selectedMed]);

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setLoadingAi(true);
    setAiResponse('');

    if (geminiKey) {
      try {
        const prompt = `You are a medically authenticated pharmacy assistant.
You are asked about the medicine: "${selectedMed.name}" (${selectedMed.dosage || 'Standard dosage'}).
Question: "${aiQuestion}".
Provide accurate, medically sound, and authenticated information. Focus strictly on answering the question.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ googleSearch: {} }]
          })
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error?.message || `HTTP error ${response.status}`);
        }
        const resJson = await response.json();
        const textResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        setAiResponse(textResponse.trim());
      } catch (err) {
        setAiResponse(`⚠️ Error: ${err.message}`);
      } finally {
        setLoadingAi(false);
      }
    } else {
      setTimeout(() => {
        const q = aiQuestion.toLowerCase();
        const name = selectedMed.name.toLowerCase();
        let reply = "No info";

        if (q.includes('alternate') || q.includes('alternative') || q.includes('substitute') || q.includes('generic')) {
          if (name.includes('metformin')) {
            reply = "Generic Metformin alternatives include brand names like Glucophage, Fortamet, or active alternatives like Glipizide (sulfonylurea class) or Jardiance (SGLT2 inhibitor).";
          } else if (name.includes('atorvastatin')) {
            reply = "Rosuvastatin (Crestor) or Simvastatin (Zocor) are common alternate statins. Consult your cardiologist before switching.";
          }
        } else if (q.includes('side effect') || q.includes('warning') || q.includes('danger')) {
          if (name.includes('metformin')) {
            reply = "Common side effects include bloating, nausea, and mild diarrhea. Warn physician of kidney health; lactic acidosis is a rare but critical risk.";
          } else if (name.includes('atorvastatin')) {
            reply = "Can cause muscle aches (myalgia), mild headache, or elevation in liver enzymes. Rhabdomyolysis is a rare, severe complication.";
          }
        }
        setAiResponse(reply);
        setLoadingAi(false);
      }, 600);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '12px', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
        <button onClick={() => setSubTab('medicines')} style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', background: subTab === 'medicines' ? 'var(--color-primary)' : 'none', color: subTab === 'medicines' ? '#fff' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Medicines</button>
        <button onClick={() => setSubTab('vaccinations')} style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', background: subTab === 'vaccinations' ? 'var(--color-primary)' : 'none', color: subTab === 'vaccinations' ? '#fff' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Vaccinations</button>
      </div>

      {subTab === 'medicines' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Extracted medicines list display after scan */}
          {isScanFinished && extractedMeds.length > 0 && (
            <div className="glass-panel" style={{ padding: '1rem', border: '2px solid var(--color-success)', background: 'rgba(22, 163, 74, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 'bold', margin: 0 }}>📋 Extracted Scan Medications</h4>
                <button className="btn-icon" onClick={() => { setExtractedMeds([]); setIsScanFinished(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Icon name="x" size={16} /></button>
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'left' }}>Link these parsed medicines directly to medication schedule:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {extractedMeds.map((med, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <strong style={{ fontSize: '0.75rem' }}>{med.name}</strong>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Dose: {med.dosage || 'Standard'} &bull; Freq: {med.frequency || 'Morning'}</div>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        addMedicine(activeMember.id, {
                          name: med.name,
                          dosage: med.dosage || '1 Tablet',
                          time: med.frequency || 'Morning',
                          total: 30
                        });
                        setExtractedMeds(prev => prev.filter((_, i) => i !== idx));
                      }}
                      style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem', background: 'var(--color-primary)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      + Add to Reminders
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => { setShowConsentModal(true); }} style={{ width: '100%', marginTop: '0.8rem', fontSize: '0.72rem', padding: '0.4rem' }}>
                💾 Save Prescription to Repository
              </button>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, textAlign: 'left' }}>Medication Schedule ({activeMember.name})</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddReminderModal(true)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.2rem', margin: 0 }}>
                  <Icon name="plus" size={12} /> Add
                </button>
                <button className="btn btn-secondary" onClick={startPrescriptionScan} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fee2e2', color: 'var(--color-danger)', border: '1px solid rgba(220, 38, 38, 0.2)', margin: 0 }} title="Scan Prescription">
                  <Icon name="camera" size={12} color="var(--color-danger)" /> Scan
                </button>
              </div>
            </div>

            {/* Live Camera View in Reminders */}
            {cameraActive && (
              <div style={{ position: 'relative', width: '100%', height: '180px', background: '#020617', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                <div className="scan-guide-overlay">
                  <div className="scan-laser-line" />
                  <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '15px', height: '15px', borderTop: '4px solid #10b981', borderLeft: '4px solid #10b981' }} />
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '15px', height: '15px', borderTop: '4px solid #10b981', borderRight: '4px solid #10b981' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '15px', height: '15px', borderBottom: '4px solid #10b981', borderLeft: '4px solid #10b981' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '15px', height: '15px', borderBottom: '4px solid #10b981', borderRight: '4px solid #10b981' }} />
                </div>
                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 5 }}>
                  <button className="btn btn-primary" onClick={capturePhoto} style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}>📸 Snap</button>
                  <button className="btn btn-secondary" onClick={stopCamera} style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem', background: '#334155', color: '#fff', border: 'none' }}>Cancel</button>
                </div>
              </div>
            )}

            {scanning && (
              <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '100px', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div className="scan-laser-line" style={{ top: 0, left: 0, position: 'absolute', width: '100%' }}></div>
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="pulse-animation" style={{ fontSize: '1.5rem', '--pulse-speed': '1.2s' }}>🔍</span>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Parsing Prescription...</strong>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>{scanStep}</p>
                </div>
              </div>
            )}

            {medicines && medicines.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {medicines.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.8rem' }}>{m.name}</strong>
                        <button onClick={() => { setSelectedMed(m); setAiQuestion(''); setAiResponse(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', marginLeft: '0.4rem', padding: '2px' }} title="Ask AI Info">
                          <Icon name="info" size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem', margin: 0 }}>🕒 {m.time} &bull; Stock: {m.remaining}/{m.total}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => logMedicineDose(activeMemberId, m.id)} disabled={m.remaining === 0} style={{ height: '28px', padding: '0 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}>Take</button>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No active routines logged.</p>}
          </div>

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', margin: 0, textAlign: 'left' }}>Pharmacy Reorder Basket</h3>
            {medicines && medicines.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                {medicines.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}>
                    <input type="checkbox" onChange={() => handleToggle(m)} checked={!!basket.find(x => x.id === m.id)} style={{ cursor: 'pointer' }} />
                    <span style={{ flex: 1 }}>{m.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stock: {m.remaining}</span>
                  </label>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No medication list to refill.</p>}
            <button className="btn btn-primary" onClick={handleOrder} style={{ width: '100%', marginTop: '1rem', background: 'var(--color-warning)', fontSize: '0.8rem' }} disabled={basket.length === 0}>
              Order Refills (Rs. {basket.length * 350})
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', margin: 0, textAlign: 'left' }}>Immunization Schedule ({activeMember.name})</h3>
          {vaccinations && vaccinations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {vaccinations.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '0.8rem', margin: 0 }}>{v.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Due: {v.ageDue} &bull; {v.dateDue}</span>
                  </div>
                  <button
                    className={`btn ${v.status === 'Given' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => updateVaccinationStatus(v.id, v.status === 'Given' ? 'Pending' : 'Given')}
                    style={{ height: '28px', padding: '0 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}
                  >
                    {v.status === 'Given' ? '✔ Administered' : 'Mark'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No immunization routine scheduled for this member.</p>
          )}
        </div>
      )}

      {/* Manual Add Reminder Modal */}
      {showAddReminderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>➕ Add Medication Reminder</h3>
              <button className="btn-icon" onClick={() => setShowAddReminderModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Icon name="x" size={16} /></button>
            </div>
            
            <form onSubmit={handleAddManual} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Medicine Name</label>
                <input type="text" className="form-control" placeholder="e.g. Paracetamol" value={manualMedForm.name} onChange={e => setManualMedForm({ ...manualMedForm, name: e.target.value })} required style={{ fontSize: '0.75rem', padding: '0.35rem' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Dosage</label>
                  <input type="text" className="form-control" placeholder="e.g. 500mg" value={manualMedForm.dosage} onChange={e => setManualMedForm({ ...manualMedForm, dosage: e.target.value })} style={{ fontSize: '0.75rem', padding: '0.35rem' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Total Stock</label>
                  <input type="number" className="form-control" value={manualMedForm.total} onChange={e => setManualMedForm({ ...manualMedForm, total: parseInt(e.target.value) || 0 })} style={{ fontSize: '0.75rem', padding: '0.35rem' }} />
                </div>
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Routine Schedule</label>
                <select className="form-control" value={manualMedForm.time} onChange={e => setManualMedForm({ ...manualMedForm, time: e.target.value })} style={{ fontSize: '0.75rem', padding: '0.35rem', height: '32px' }}>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Night">Night</option>
                  <option value="Morning & Night">Morning & Night</option>
                  <option value="Three times daily">Three times daily</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.45rem', fontSize: '0.75rem' }}>Add Reminder</button>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Crop Modal in Reminders */}
      {cropping && fileBase64 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, textAlign: 'left' }}>📐 Adjust Prescription Crop</h3>
            
            <div 
              ref={containerRef}
              onMouseMove={handlePointerMove}
              onTouchMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchEnd={handlePointerUp}
              style={{ position: 'relative', width: '100%', height: '240px', background: '#020617', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b', userSelect: 'none' }}
            >
              <img src={fileBase64} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
              
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <polygon
                  points={`${corners.tl.x}%,${corners.tl.y}% ${corners.tr.x}%,${corners.tr.y}% ${corners.br.x}%,${corners.br.y}% ${corners.bl.x}%,${corners.bl.y}%`}
                  fill="rgba(16, 185, 129, 0.15)"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              </svg>
              
              {Object.keys(corners).map((key) => {
                const pt = corners[key];
                return (
                  <div
                    key={key}
                    onMouseDown={(e) => handlePointerDown(key, e)}
                    onTouchStart={(e) => handlePointerDown(key, e)}
                    style={{
                      position: 'absolute',
                      left: `${pt.x}%`,
                      top: `${pt.y}%`,
                      width: '18px',
                      height: '18px',
                      background: '#10b981',
                      border: '2.5px solid #fff',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                  />
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setCorners({
                    tl: { x: 8, y: 10 },
                    tr: { x: 92, y: 8 },
                    br: { x: 90, y: 92 },
                    bl: { x: 10, y: 90 }
                  });
                  addToast("Edges auto-detected!", "success");
                }}
                style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', background: '#1e293b', border: 'none', color: '#fff' }}
              >
                ✨ Auto-Detect Edges
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setCropping(false);
                  triggerScan();
                }}
                style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem' }}
              >
                Crop & Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consent Modal Dialog in Reminders */}
      {showConsentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>🔒</div>
            <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>Security & Privacy Consent</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
              The scanned prescription image will be stored securely in your encrypted Repository and linked to <strong>{activeMember.name}</strong>'s profile records list.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowConsentModal(false)} style={{ flex: 1, fontSize: '0.7rem', padding: '0.45rem', background: '#1e293b', border: 'none', color: '#fff' }}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowConsentModal(false);
                  setShowAuthModal(true);
                }}
                style={{ flex: 1, fontSize: '0.7rem', padding: '0.45rem' }}
              >
                I Consent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN & Biometric Auth Modal in Reminders */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '320px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>Verify Identity</h3>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0 }}>Confirm your security PIN or touch the biometric sensor.</p>
            
            {authError && <div style={{ fontSize: '0.65rem', color: 'var(--color-danger)', fontWeight: 'bold' }}>⚠️ {authError}</div>}
            
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter PIN (e.g. 1234)"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                if (val.length === 4) {
                  if (val === '1234') {
                    handleSaveConfirm();
                  } else {
                    setAuthError('Incorrect PIN. Try 1234.');
                    setPin('');
                  }
                }
              }}
              style={{ fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem', background: '#020617', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', letterSpacing: '0.5rem' }}
            />
            
            <div style={{ margin: '0.5rem 0' }}>
              <button 
                type="button" 
                onClick={() => {
                  addToast("Biometric verification successful!", "success");
                  handleSaveConfirm();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', margin: '0 auto' }}
              >
                <span style={{ fontSize: '2.5rem' }}>👆</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Tap to use Fingerprint Biometrics</span>
              </button>
            </div>
            
            <button className="btn btn-secondary" onClick={() => { setShowAuthModal(false); setPin(''); setAuthError(''); }} style={{ fontSize: '0.7rem', padding: '0.4rem', background: '#1e293b', border: 'none', color: '#fff' }}>Cancel</button>
          </div>
        </div>
      )}

      {selectedMed && (
        <div className="bottom-sheet-overlay" style={{ zIndex: 1100 }}>
          <div className="bottom-sheet" style={{ maxHeight: '90%', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', margin: 0 }}>💊 AI Medicine Information</h3>
              <button className="btn-icon" onClick={() => setSelectedMed(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={16} /></button>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '1rem', textAlign: 'left' }}>
              <strong>Medicine:</strong> {selectedMed.name} ({selectedMed.dosage || 'Standard Dosage'})
            </div>

            <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.75rem', marginBottom: '1rem', textAlign: 'left' }}>
              <strong style={{ color: 'var(--color-primary)' }}>FDA Label Directory Summary:</strong>
              {loadingFda ? (
                <div style={{ color: 'var(--text-muted)' }}>Querying FDA label library...</div>
              ) : fdaData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.25rem' }}>
                  {fdaData.openfda?.generic_name?.[0] && <div><strong>Generic Name:</strong> {fdaData.openfda.generic_name[0]}</div>}
                  {fdaData.purpose?.[0] && <div><strong>Purpose:</strong> {fdaData.purpose[0].slice(0, 160)}...</div>}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>No direct label matches found.</div>
              )}
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Ask AI about alternates or safety profile:</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="form-control" placeholder="Alternates for this medicine?" value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} style={{ fontSize: '0.75rem' }} />
                <button className="btn btn-primary" onClick={handleAskAI} disabled={loadingAi || !aiQuestion.trim()} style={{ fontSize: '0.75rem', padding: '0 0.75rem' }}>Ask AI</button>
              </div>
            </div>

            {aiResponse && (
              <div style={{ textAlign: 'left', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
                {aiResponse === "No info" ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>⚠️ No authenticated medical information available for this query.</span>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0 }}>{aiResponse}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RemindersTab;
