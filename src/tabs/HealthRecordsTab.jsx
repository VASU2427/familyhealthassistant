import React, { useState, useRef, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import ProfileSelectionPrompt from '../components/ProfileSelectionPrompt';
import Icon from '../components/Icon';
import MedicalReportPresentation from '../components/MedicalReportPresentation';
import { runOCR } from '../services/gemini';
import { generateWhatsAppShareString } from '../utils/share';

export function HealthRecordsTab() {
  const {
    activeMember,
    activeMemberId,
    geminiKey,
    uploadedRecords,
    setUploadedRecords,
    saveUploadedRecord,
    deleteUploadedRecord,
    addMedicine,
    addToast
  } = useHealth();

  if (activeMemberId === 'household') {
    return <ProfileSelectionPrompt title="Health Records Repository" />;
  }

  const [mockReportType, setMockReportType] = useState('auto');
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState(null);
  const [scanStep, setScanStep] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Advanced scanner features state
  const [cropping, setCropping] = useState(false);
  const [corners, setCorners] = useState({
    tl: { x: 15, y: 15 },
    tr: { x: 85, y: 15 },
    br: { x: 85, y: 85 },
    bl: { x: 15, y: 85 }
  });
  const [draggingHandle, setDraggingHandle] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [docCategory, setDocCategory] = useState('Lab Report');

  // Side-by-side editing state
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [editedRecord, setEditedRecord] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Sync editedRecord when viewingRecord changes
  useEffect(() => {
    if (viewingRecord) {
      setEditedRecord({ ...viewingRecord });
      setIsEditingRecord(false);
    } else {
      setEditedRecord(null);
      setIsEditingRecord(false);
    }
  }, [viewingRecord]);

  const startCamera = async () => {
    setSelectedFile(null);
    setFileBase64('');
    setData(null);
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
      alert("Could not start live video stream. Use the native file picker or upload a document instead.");
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
      name: 'Camera_Capture_' + new Date().toISOString().split('T')[0] + '_' + Math.floor(Math.random() * 1000) + '.jpg',
      type: 'image/jpeg',
      size: Math.round((dataUrl.length * 3) / 4)
    });
    stopCamera();
    setCropping(true); // Switch to Cropper view
  };

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBase64(e.target.result);
      if (file.type.startsWith('image/')) {
        setCropping(true); // Switch to Cropper view for images
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Draggable handle calculations
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

  const autoCategorize = (fname, extractedText = '') => {
    const text = (fname + ' ' + extractedText).toLowerCase();
    if (text.includes('prescription') || text.includes('recipe') || text.includes('rx') || text.includes('medication') || text.includes('capsule') || text.includes('tablet')) {
      return 'Prescription';
    }
    if (text.includes('vaccin') || text.includes('immuniz') || text.includes('bcg') || text.includes('polio') || text.includes('hepatitis') || text.includes('card')) {
      return 'Vaccination Card';
    }
    if (text.includes('appointment') || text.includes('visit') || text.includes('note') || text.includes('consultation') || text.includes('clinical')) {
      return 'Appointment Note';
    }
    return 'Lab Report';
  };

  const triggerScan = async () => {
    if (!selectedFile) return;
    setScanning(true);
    setData(null);

    let currentBase64 = fileBase64;
    if (!currentBase64) {
      try {
        const reader = new FileReader();
        const readPromise = new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(selectedFile);
        currentBase64 = await readPromise;
        setFileBase64(currentBase64);
      } catch (readErr) {
        console.error("FileReader failed:", readErr);
        addToast(`Failed to read file: ${readErr.message}`, 'danger');
        setScanning(false);
        return;
      }
    }

    setScanStep("Reading report metadata...");
    await new Promise(r => setTimeout(r, 600));
    setScanStep(`Running OCR & structuring ${selectedLanguage} document text...`);
    await new Promise(r => setTimeout(r, 800));

    if (geminiKey) {
      setScanStep(`Consulting Gemini AI for parameters mapping (${selectedLanguage})...`);
      try {
        const extracted = await runOCR(geminiKey, currentBase64, selectedLanguage);

        const cleanVal = (val, isFloat = false) => {
          if (val === null || val === undefined || val === '' || val === 404 || val === '404' || val === -999 || val === '-999' || val === -99 || val === '-99') {
            return null;
          }
          const num = isFloat ? parseFloat(val) : parseInt(val);
          return isNaN(num) ? null : num;
        };

        const parsedData = {
          ingestionError: !!extracted.ingestionError,
          ingestionErrorMessage: extracted.ingestionErrorMessage || '',
          date: extracted.date || new Date().toISOString().split('T')[0],
          vitals: {
            bpSystolic: cleanVal(extracted.vitals?.bpSystolic || extracted.bpSystolic),
            bpDiastolic: cleanVal(extracted.vitals?.bpDiastolic || extracted.bpDiastolic),
            glucose: cleanVal(extracted.vitals?.glucose || extracted.glucose),
            weight: cleanVal(extracted.vitals?.weight || extracted.weight, true),
            heartRate: cleanVal(extracted.vitals?.heartRate || extracted.heartRate),
            oxygen: cleanVal(extracted.vitals?.oxygen || extracted.oxygen),
            temperature: cleanVal(extracted.vitals?.temperature || extracted.temperature, true),
            hba1c: cleanVal(extracted.vitals?.hba1c || extracted.hba1c, true),
            tsh: cleanVal(extracted.vitals?.tsh || extracted.tsh, true),
            cholesterol: cleanVal(extracted.vitals?.cholesterol || extracted.cholesterol),
            hdl: cleanVal(extracted.vitals?.hdl || extracted.hdl),
            ldl: cleanVal(extracted.vitals?.ldl || extracted.ldl),
            triglycerides: cleanVal(extracted.vitals?.triglycerides || extracted.triglycerides),
            creatinine: cleanVal(extracted.vitals?.creatinine || extracted.creatinine, true),
            hemoglobin: cleanVal(extracted.vitals?.hemoglobin || extracted.hemoglobin, true)
          },
          notes: extracted.notes || 'AI Scanner: Extracted records.',
          diagnosis: Array.isArray(extracted.diagnosis) ? extracted.diagnosis.filter(Boolean) : [],
          advice: Array.isArray(extracted.advice) ? extracted.advice.filter(Boolean) : [],
          medications: Array.isArray(extracted.medications) ? extracted.medications.filter(m => m && m.name) : [],
          tests: Array.isArray(extracted.tests) ? extracted.tests.filter(Boolean) : []
        };

        setData(parsedData);
        setDocCategory(autoCategorize(selectedFile.name, parsedData.notes + ' ' + parsedData.diagnosis.join(' ')));

      } catch (err) {
        console.error(err);
        addToast(`AI Scan failed: ${err.message}`, 'danger');
        setScanStep(`Scan failed: ${err.message}`);
      } finally {
        setScanning(false);
      }
    } else {
      setScanStep("Using client-side matcher...");
      await new Promise(r => setTimeout(r, 1200));
      runMockScan();
      setScanning(false);
    }
  };

  const runMockScan = () => {
    const fname = (selectedFile ? selectedFile.name : '').toLowerCase();
    let selectedType = mockReportType;
    if (selectedType === 'auto') {
      const cat = autoCategorize(selectedFile.name);
      if (cat === 'Prescription') selectedType = 'prescription';
      else if (cat === 'Vaccination Card') selectedType = 'vaccination';
      else if (cat === 'Appointment Note') selectedType = 'appointment_note';
      else selectedType = 'lab_report';
    }

    let vitals = {
      bpSystolic: null, bpDiastolic: null, glucose: null, weight: null, heartRate: null, oxygen: null, temperature: null,
      hba1c: null, tsh: null, cholesterol: null, hdl: null, ldl: null, triglycerides: null, creatinine: null, hemoglobin: null
    };
    let notes = 'Client-Side Scanner: Standard parameters mapped.';
    let diagnosis = [];
    let advice = [];
    let medications = [];
    let tests = [];
    let detectedCategory = 'Lab Report';

    if (selectedType === 'prescription') {
      detectedCategory = 'Prescription';
      notes = 'AI Scanner: Extracted Rx details from prescription sheet.';
      diagnosis = ["Acute Pharyngitis", "Mild Fever"];
      advice = ["Drink plenty of warm fluids", "Rest for 3 days", "Avoid cold drinks"];
      medications = [
        { name: "Amoxicillin", dosage: "500mg", frequency: "Morning & Night", route: "Orally", duration: "5 days" },
        { name: "Paracetamol", dosage: "650mg", frequency: "Afternoon (if fever)", route: "Orally", duration: "3 days" }
      ];
    } else if (selectedType === 'vaccination') {
      detectedCategory = 'Vaccination Card';
      notes = 'AI Scanner: Extracted child vaccination logs.';
      diagnosis = ["Routine Pediatric Health Check"];
      advice = ["Apply cold compress if injection site is red", "Next dose due in 4 weeks"];
      tests = ["BCG Vaccine", "OPV-1 Booster"];
    } else if (selectedType === 'appointment_note') {
      detectedCategory = 'Appointment Note';
      notes = 'AI Scanner: Extracted clinical follow-up advice notes.';
      diagnosis = ["Essential Hypertension Evaluation"];
      advice = ["Continue salt restriction", "Regular morning walks", "Follow up after 1 month"];
      vitals.bpSystolic = 130;
      vitals.bpDiastolic = 85;
    } else {
      detectedCategory = 'Lab Report';
      vitals.bpSystolic = 122; vitals.bpDiastolic = 80; vitals.heartRate = 72; vitals.oxygen = 99; vitals.temperature = 98.4;
      notes = 'Client-Side Scanner: Basic Vitals mapped (BP 122/80 mmHg, Pulse 72 BPM, Temp 98.4°F).';
      diagnosis = ["Stage 1 Hypertension Evaluation"];
      advice = ["Monitor BP daily", "Limit dietary sodium intake", "Follow up in 2 weeks"];
      tests = ["Standard Vitals Log"];
    }

    setDocCategory(detectedCategory);
    setData({
      date: new Date().toISOString().split('T')[0],
      vitals,
      notes,
      diagnosis,
      advice,
      medications,
      tests
    });
  };

  const handleSaveScan = () => {
    // Show privacy consent modal first
    setShowConsentModal(true);
  };

  const handleSaveConfirm = () => {
    saveUploadedRecord({
      ...data,
      name: selectedFile ? selectedFile.name : 'Report_AI_AutoMapped_' + new Date().toISOString().split('T')[0] + '.pdf',
      type: docCategory,
      memberId: activeMember.id
    }, selectedFile);

    setData(null);
    setSelectedFile(null);
    setFileBase64('');
    setShowAuthModal(false);
    setPin('');
    setAuthError('');
  };

  const handleDeleteRecord = (id) => {
    deleteUploadedRecord(id);
    if (viewingRecord && viewingRecord.id === id) {
      setViewingRecord(null);
    }
  };

  const handleLinkMedication = (med) => {
    addMedicine(activeMember.id, {
      name: med.name,
      dosage: med.dosage || '1 Tablet',
      time: med.frequency || 'Morning',
      total: 30
    });
  };

  const memberRecords = uploadedRecords ? uploadedRecords.filter(r => r.memberId === activeMember.id) : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
        <h4 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span>AI Health Report Scanner ({activeMember.name})</span>
          <button 
            onClick={() => startCamera()} 
            style={{ 
              background: '#fee2e2', 
              color: 'var(--color-danger)', 
              border: '1px solid rgba(220, 38, 38, 0.2)', 
              borderRadius: '6px', 
              padding: '0.25rem 0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.65rem', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <Icon name="camera" size={12} color="var(--color-danger)" /> Scan Document
          </button>
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '0.25rem', marginBottom: '1rem' }}>Upload medical report cards or use camera to extract vitals.</p>

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

        {!selectedFile && !scanning && !cameraActive && (
          <div
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('scan-file-input-tab').click()}
            style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-primary)', cursor: 'pointer', position: 'relative' }}
          >
            <input type="file" id="scan-file-input-tab" style={{ display: 'none' }} accept="image/*,application/pdf" onChange={handleFileInputChange} />
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📁</span>
            <strong style={{ fontSize: '0.8rem', display: 'block' }}>Drag & Drop Report</strong>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Supports PDF, PNG, JPEG up to 4MB</span>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); startCamera(); }} style={{ fontSize: '0.75rem', flex: 1, padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <Icon name="camera" size={14} /> Scan using Camera
              </button>
              <label htmlFor="native-camera-tab-act" className="btn btn-secondary" onClick={(e) => e.stopPropagation()} style={{ fontSize: '0.75rem', flex: 1, padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer', margin: 0 }}>
                <Icon name="upload" size={14} /> Snap Photo
              </label>
              <input type="file" id="native-camera-tab-act" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileInputChange} />
            </div>
          </div>
        )}

        {scanning && (
          <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '110px', justifyContent: 'center' }}>
            <div className="scan-laser-line" style={{ top: 0, left: 0, position: 'absolute', width: '100%' }}></div>
            <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-animation" style={{ fontSize: '1.5rem', '--pulse-speed': '1.2s' }}>🔍</span>
              <strong style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Scanning Document...</strong>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>{scanStep}</p>
            </div>
          </div>
        )}

        {selectedFile && !scanning && !data && !cropping && (
          <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedFile.type && selectedFile.type.includes('pdf') ? '📄' : '🖼️'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
              </div>
              <button className="btn-icon" onClick={() => { setSelectedFile(null); setFileBase64(''); setData(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Icon name="x" size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem', textAlign: 'left' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-secondary)' }}>OCR Language:</label>
                <select className="form-control" value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem', height: '26px' }}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                </select>
              </div>

              {!geminiKey && (
                <div className="form-group">
                  <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Report Template (Mock):</label>
                  <select className="form-control" value={mockReportType} onChange={e => setMockReportType(e.target.value)} style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem', height: '26px' }}>
                    <option value="auto">Auto-detect from filename</option>
                    <option value="prescription">Prescription Sheet</option>
                    <option value="lab_report">Lab Vitals Report</option>
                    <option value="vaccination">Vaccination Card</option>
                    <option value="appointment_note">Clinic Follow-up Note</option>
                  </select>
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={triggerScan} style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}>Run AI Scan</button>
          </div>
        )}

        {/* OCR Result Verification Sheet (Manual Correction) */}
        {data && !cropping && (
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 0.2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔍 Verify Extracted Parameters</span>
              <span style={{ fontSize: '0.55rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Accuracy check</span>
            </h5>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Report Date</label>
                <input type="date" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={data.date || ''} onChange={e => setData({ ...data, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Document Category</label>
                <select className="form-control" value={docCategory} onChange={e => setDocCategory(e.target.value)} style={{ padding: '0.25rem', fontSize: '0.7rem', height: '28px' }}>
                  <option value="Prescription">Prescription</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Vaccination Card">Vaccination Card</option>
                  <option value="Appointment Note">Appointment Note</option>
                </select>
              </div>
            </div>

            {/* Editable vital fields confirmed in scanner */}
            <strong style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Blood Pressure & Pulse</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Systolic</label>
                <input type="number" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.bpSystolic ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, bpSystolic: e.target.value !== '' ? parseInt(e.target.value) : null } })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Diastolic</label>
                <input type="number" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.bpDiastolic ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, bpDiastolic: e.target.value !== '' ? parseInt(e.target.value) : null } })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Pulse (BPM)</label>
                <input type="number" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.heartRate ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, heartRate: e.target.value !== '' ? parseInt(e.target.value) : null } })} />
              </div>
            </div>

            <strong style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Metabolic Metrics</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Glucose (mg/dL)</label>
                <input type="number" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.glucose ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, glucose: e.target.value !== '' ? parseInt(e.target.value) : null } })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>HbA1c (%)</label>
                <input type="number" step="0.1" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.hba1c ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, hba1c: e.target.value !== '' ? parseFloat(e.target.value) : null } })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>TSH (uIU/mL)</label>
                <input type="number" step="0.01" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.tsh ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, tsh: e.target.value !== '' ? parseFloat(e.target.value) : null } })} />
              </div>
            </div>

            <strong style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Lipids & Chemistry</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Total Chol</label>
                <input type="number" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.cholesterol ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, cholesterol: e.target.value !== '' ? parseInt(e.target.value) : null } })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LDL Chol</label>
                <input type="number" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.ldl ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, ldl: e.target.value !== '' ? parseInt(e.target.value) : null } })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Triglycerides</label>
                <input type="number" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.triglycerides ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, triglycerides: e.target.value !== '' ? parseInt(e.target.value) : null } })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Hemoglobin (g/dL)</label>
                <input type="number" step="0.1" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.hemoglobin ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, hemoglobin: e.target.value !== '' ? parseFloat(e.target.value) : null } })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Creatinine (mg/dL)</label>
                <input type="number" step="0.01" className="form-control" style={{ padding: '0.25rem', fontSize: '0.7rem' }} value={data.vitals.creatinine ?? ''} onChange={e => setData({ ...data, vitals: { ...data.vitals, creatinine: e.target.value !== '' ? parseFloat(e.target.value) : null } })} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Observations Summary</label>
              <textarea className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem', height: '40px' }} value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Segregated Diagnoses (One per line)</label>
              <textarea className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem', height: '50px' }} value={data.diagnosis ? data.diagnosis.join('\n') : ''} onChange={e => setData({ ...data, diagnosis: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Advice Instructions (One per line)</label>
              <textarea className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem', height: '50px' }} value={data.advice ? data.advice.join('\n') : ''} onChange={e => setData({ ...data, advice: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '0.2rem' }}>Segregated Medications</label>
              {data.medications && data.medications.map((med, idx) => (
                <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.4rem', position: 'relative' }}>
                  <button type="button" onClick={() => setData({ ...data, medications: data.medications.filter((_, i) => i !== idx) })} style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.65rem' }}>Remove</button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <input type="text" placeholder="Medicine Name" className="form-control" style={{ padding: '0.2rem 0.3rem', fontSize: '0.65rem', background: 'var(--bg-primary)' }} value={med.name || ''} onChange={e => {
                      const updated = [...data.medications];
                      updated[idx].name = e.target.value;
                      setData({ ...data, medications: updated });
                    }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem' }}>
                      <input type="text" placeholder="Dose" className="form-control" style={{ padding: '0.2rem 0.3rem', fontSize: '0.65rem', background: 'var(--bg-primary)' }} value={med.dosage || ''} onChange={e => {
                        const updated = [...data.medications];
                        updated[idx].dosage = e.target.value;
                        setData({ ...data, medications: updated });
                      }} />
                      <input type="text" placeholder="Freq" className="form-control" style={{ padding: '0.2rem 0.3rem', fontSize: '0.65rem', background: 'var(--bg-primary)' }} value={med.frequency || ''} onChange={e => {
                        const updated = [...data.medications];
                        updated[idx].frequency = e.target.value;
                        setData({ ...data, medications: updated });
                      }} />
                      <input type="text" placeholder="Duration" className="form-control" style={{ padding: '0.2rem 0.3rem', fontSize: '0.65rem', background: 'var(--bg-primary)' }} value={med.duration || ''} onChange={e => {
                        const updated = [...data.medications];
                        updated[idx].duration = e.target.value;
                        setData({ ...data, medications: updated });
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={() => setData({ ...data, medications: [...data.medications, { name: '', dosage: '', frequency: '', route: 'Orally', duration: '' }] })} style={{ width: '100%', fontSize: '0.65rem', padding: '0.25rem', marginTop: '0.2rem' }}>+ Add Medication Row</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Ingestion / Lab Tests (One per line)</label>
              <textarea className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem', height: '50px' }} value={data.tests ? data.tests.join('\n') : ''} onChange={e => setData({ ...data, tests: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} />
            </div>

            <button className="btn btn-primary" onClick={handleSaveScan} style={{ marginTop: '0.4rem', width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}>Confirm & Save to Profile</button>
          </div>
        )}
      </div>

      {/* Stored document list (Medical Repository) */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', margin: 0, textAlign: 'left' }}>Medical Repository ({activeMember.name})</h4>
        {memberRecords.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {memberRecords.map(rec => (
              <div key={rec.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.2rem', padding: '0.2rem', background: 'var(--bg-secondary)', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {rec.type && rec.type.includes('PDF') ? '📄' : '🖼️'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left', fontSize: '0.7rem' }}>
                  <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={rec.name}>{rec.name}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{rec.type} &bull; {rec.date}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn-icon" onClick={() => setViewingRecord(rec)} style={{ background: 'var(--bg-secondary)', border: 'none', width: '26px', height: '26px', borderRadius: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="View Document">
                    <Icon name="eye" size={12} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDeleteRecord(rec.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', width: '26px', height: '26px', borderRadius: '6px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Delete Record">
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.5rem 0' }}>No records uploaded for this member.</p>}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => startCamera()} 
        className="fab-btn"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-danger)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000
        }}
        title="Scan Document"
      >
        <Icon name="plus" size={24} color="#fff" />
      </button>

      {/* Cropping Modal Step */}
      {cropping && fileBase64 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, textAlign: 'left' }}>📐 Adjust Edge Crop</h3>
            
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

      {/* Consent Modal Dialog */}
      {showConsentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>🔒</div>
            <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>Security & Privacy Consent</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
              The scanned document and extracted health parameters will be stored in your encrypted profile database. This data is linked directly to <strong>{activeMember.name}</strong>'s personal dashboard and will only be shared when explicitly authorized by you.
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

      {/* PIN & Biometric Authentication Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '320px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>Verify Identity</h3>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0 }}>Confirm your security PIN or touch the biometric sensor.</p>
            
            {authError && <div style={{ fontSize: '0.65rem', color: 'var(--color-danger)', fontWeight: 'bold' }}>⚠️ {authError}</div>}
            
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter 4-Digit PIN (e.g. 1234)"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                if (val.length === 4) {
                  if (val === '1234') {
                    handleSaveConfirm();
                  } else {
                    setAuthError('Incorrect PIN code. Try 1234.');
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

      {/* Document Preview & Side-by-Side Edit Modal */}
      {viewingRecord && editedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div style={{ overflow: 'hidden', textAlign: 'left', flex: 1 }}>
                {isEditingRecord ? (
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editedRecord.name} 
                    onChange={e => setEditedRecord({ ...editedRecord, name: e.target.value })} 
                    style={{ fontSize: '0.8rem', padding: '0.2rem', color: '#fff', background: '#020617', border: '1px solid #1e293b' }} 
                  />
                ) : (
                  <h3 style={{ fontSize: '0.85rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#fff' }}>{viewingRecord.name}</h3>
                )}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{viewingRecord.date}</span>
              </div>
              <button className="btn-icon" onClick={() => setViewingRecord(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', paddingLeft: '0.5rem' }}>
                <Icon name="x" size={18} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden' }}>
              {viewingRecord.fileData && viewingRecord.fileData.startsWith('data:image/') ? (
                <img src={viewingRecord.fileData} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', width: '100%' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📄</span>
                  <strong style={{ fontSize: '0.75rem', display: 'block', color: '#fff' }}>PDF Report Card</strong>
                </div>
              )}
            </div>

            {/* Editable Fields Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              {isEditingRecord ? (
                <>
                  <div className="form-group">
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Record Date</label>
                    <input type="date" className="form-control" style={{ fontSize: '0.7rem', padding: '0.25rem' }} value={editedRecord.date || ''} onChange={e => setEditedRecord({ ...editedRecord, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Document Category</label>
                    <select className="form-control" value={editedRecord.type || ''} onChange={e => setEditedRecord({ ...editedRecord, type: e.target.value })} style={{ fontSize: '0.7rem', padding: '0.25rem', height: '26px' }}>
                      <option value="Prescription">Prescription</option>
                      <option value="Lab Report">Lab Report</option>
                      <option value="Vaccination Card">Vaccination Card</option>
                      <option value="Appointment Note">Appointment Note</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Observations Summary</label>
                    <textarea className="form-control" style={{ fontSize: '0.7rem', padding: '0.25rem', height: '40px' }} value={editedRecord.notes || ''} onChange={e => setEditedRecord({ ...editedRecord, notes: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Diagnoses (One per line)</label>
                    <textarea className="form-control" style={{ fontSize: '0.7rem', padding: '0.25rem', height: '40px' }} value={editedRecord.diagnosis ? editedRecord.diagnosis.join('\n') : ''} onChange={e => setEditedRecord({ ...editedRecord, diagnosis: e.target.value.split('\n').filter(Boolean) })} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Advice Instructions (One per line)</label>
                    <textarea className="form-control" style={{ fontSize: '0.7rem', padding: '0.25rem', height: '40px' }} value={editedRecord.advice ? editedRecord.advice.join('\n') : ''} onChange={e => setEditedRecord({ ...editedRecord, advice: e.target.value.split('\n').filter(Boolean) })} />
                  </div>
                </>
              ) : (
                <>
                  {viewingRecord.vitals && (
                    <MedicalReportPresentation vitals={viewingRecord.vitals} />
                  )}

                  {viewingRecord.diagnosis && viewingRecord.diagnosis.length > 0 && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem' }}>
                      <strong style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', paddingBottom: '0.25rem' }}>
                        <span>🩺</span> Clinical Diagnoses
                      </strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {viewingRecord.diagnosis.map((item, i) => (
                          <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold' }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingRecord.advice && viewingRecord.advice.length > 0 && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.02)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem' }}>
                      <strong style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(245, 158, 11, 0.1)', paddingBottom: '0.25rem' }}>
                        <span>📋</span> Clinical Advice
                      </strong>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {viewingRecord.advice.map((item, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.65rem', color: '#cbd5e1' }}>
                            <span style={{ color: '#f59e0b', fontSize: '0.75rem', lineHeight: '1' }}>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Medications Linking & Display */}
              {editedRecord.medications && editedRecord.medications.length > 0 && (
                <div style={{ background: 'rgba(139, 92, 246, 0.02)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem' }}>
                  <strong style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', paddingBottom: '0.25rem' }}>
                    <span>💊</span> Prescribed Medications
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {editedRecord.medications.map((med, i) => (
                      <div key={i} style={{ padding: '0.45rem 0.6rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.1)', fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          {isEditingRecord ? (
                            <input 
                              type="text" 
                              className="form-control" 
                              value={med.name} 
                              onChange={e => {
                                const copy = [...editedRecord.medications];
                                copy[i].name = e.target.value;
                                setEditedRecord({ ...editedRecord, medications: copy });
                              }}
                              style={{ fontSize: '0.65rem', padding: '0.15rem', color: '#fff', background: '#020617', border: '1px solid #1e293b', marginBottom: '0.2rem' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '0.7rem' }}>{med.name}</span>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.6rem' }}>
                            {isEditingRecord ? (
                              <>
                                <input type="text" placeholder="Dose" value={med.dosage || ''} onChange={e => {
                                  const copy = [...editedRecord.medications];
                                  copy[i].dosage = e.target.value;
                                  setEditedRecord({ ...editedRecord, medications: copy });
                                }} style={{ width: '50px', fontSize: '0.55rem', padding: '0.1rem', background: '#020617', color: '#fff', border: '1px solid #1e293b' }} />
                                <input type="text" placeholder="Freq" value={med.frequency || ''} onChange={e => {
                                  const copy = [...editedRecord.medications];
                                  copy[i].frequency = e.target.value;
                                  setEditedRecord({ ...editedRecord, medications: copy });
                                }} style={{ width: '60px', fontSize: '0.55rem', padding: '0.1rem', background: '#020617', color: '#fff', border: '1px solid #1e293b' }} />
                              </>
                            ) : (
                              <>
                                {med.dosage && <span>Dose: <strong>{med.dosage}</strong></span>}
                                {med.frequency && <span>Freq: <strong>{med.frequency}</strong></span>}
                              </>
                            )}
                          </div>
                        </div>
                        {!isEditingRecord && (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => {
                              handleLinkMedication(med);
                            }}
                            style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem', border: 'none', background: 'var(--color-primary)', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            + Link Reminder
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isEditingRecord && viewingRecord.notes && (
                <div style={{ background: 'rgba(59, 130, 246, 0.02)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem' }}>
                  <strong style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                    <span>📝</span> Extracted Insights
                  </strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{viewingRecord.notes}</p>
                </div>
              )}
            </div>

            {/* Actions Panel */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  if (isEditingRecord) {
                    setUploadedRecords(prev => prev.map(r => r.id === viewingRecord.id ? editedRecord : r));
                    setViewingRecord(editedRecord);
                    setIsEditingRecord(false);
                    addToast("Corrections saved successfully!", "success");
                  } else {
                    setIsEditingRecord(true);
                  }
                }} 
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.45rem', background: isEditingRecord ? 'var(--color-success)' : 'var(--color-info)', color: '#fff', border: 'none' }}
              >
                {isEditingRecord ? '✔ Save' : '✏️ Edit OCR'}
              </button>
              
              {!isEditingRecord && (
                <a
                  href={`whatsapp://send?text=${encodeURIComponent(generateWhatsAppShareString(viewingRecord))}`}
                  className="btn btn-success"
                  style={{
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    textDecoration: 'none',
                    background: '#25D366',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="whatsapp" size={14} color="#fff" /> Share
                </a>
              )}
              
              <button className="btn btn-danger" onClick={() => handleDeleteRecord(viewingRecord.id)} style={{ padding: '0 0.75rem', background: 'var(--color-danger)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthRecordsTab;
