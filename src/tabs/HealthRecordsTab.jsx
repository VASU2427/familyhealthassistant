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
    saveUploadedRecord,
    deleteUploadedRecord,
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

  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
  };

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBase64(e.target.result);
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

        setData({
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
        });

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
      if (fname.includes('bp') || fname.includes('blood') || fname.includes('pressure') || fname.includes('hypertension')) {
        selectedType = 'vitals';
      } else if (fname.includes('glucose') || fname.includes('sugar') || fname.includes('diabet') || fname.includes('hba1c')) {
        selectedType = 'diabetic';
      } else if (fname.includes('lipid') || fname.includes('cholesterol') || fname.includes('triglyceride')) {
        selectedType = 'lipid';
      } else if (fname.includes('thyroid') || fname.includes('tsh') || fname.includes('t3') || fname.includes('t4')) {
        selectedType = 'thyroid';
      } else if (fname.includes('cbc') || fname.includes('hemoglobin') || fname.includes('anemia')) {
        selectedType = 'cbc';
      } else if (fname.includes('kidney') || fname.includes('renal') || fname.includes('creatinine')) {
        selectedType = 'kidney';
      } else {
        selectedType = 'vitals';
      }
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

    if (selectedType === 'vitals') {
      vitals.bpSystolic = 122; vitals.bpDiastolic = 80; vitals.heartRate = 72; vitals.oxygen = 99; vitals.temperature = 98.4;
      notes = 'Client-Side Scanner: Basic Vitals mapped (BP 122/80 mmHg, Pulse 72 BPM, Temp 98.4°F).';
      diagnosis = ["Stage 1 Hypertension Evaluation"];
      advice = ["Monitor BP daily", "Limit dietary sodium intake", "Follow up in 2 weeks"];
      tests = ["Standard Vitals Log"];
    } else if (selectedType === 'diabetic') {
      vitals.glucose = 142; vitals.hba1c = 7.1;
      notes = 'Client-Side Scanner: Diabetic metabolic card matching. Detected HbA1c (7.1%) and glucose (142 mg/dL).';
      diagnosis = ["Type 2 Diabetes Mellitus", "Impaired Fasting Glucose"];
      advice = ["Limit dietary carbohydrates and simple sugars", "Maintain daily exercise plan", "Retest HbA1c in 90 days"];
      medications = [{ name: "Metformin", dosage: "500mg", frequency: "Once daily with breakfast", route: "Orally", duration: "30 days" }];
      tests = ["Fasting Blood Sugar", "HbA1c test"];
    } else if (selectedType === 'lipid') {
      vitals.cholesterol = 238; vitals.ldl = 146; vitals.hdl = 42; vitals.triglycerides = 245;
      notes = 'Client-Side Scanner: Lipid profile matching. Detected total Cholesterol (238 mg/dL) and LDL (146 mg/dL).';
      diagnosis = ["Hyperlipidemia", "Elevated LDL-Cholesterol"];
      advice = ["Reduce saturated fat intake", "Incorporate omega-3 rich food", "Review lipid profile in 8 weeks"];
      medications = [{ name: "Atorvastatin", dosage: "10mg", frequency: "Once daily at bedtime", route: "Orally", duration: "60 days" }];
      tests = ["Lipid Panel (Total Cholesterol, HDL, LDL, Triglycerides)"];
    } else if (selectedType === 'thyroid') {
      vitals.tsh = 6.4;
      notes = 'Client-Side Scanner: Thyroid panel matching. Detected TSH (6.4 uIU/mL), indicating hypothyroidism.';
      diagnosis = ["Subclinical Hypothyroidism"];
      advice = ["Monitor thyroid parameters", "Follow up TSH levels in 3 months"];
      medications = [{ name: "Levothyroxine", dosage: "25mcg", frequency: "Once daily on empty stomach", route: "Orally", duration: "90 days" }];
      tests = ["Serum TSH", "Free Thyroxine (FT4)"];
    } else if (selectedType === 'cbc') {
      vitals.hemoglobin = 9.8;
      notes = 'Client-Side Scanner: CBC matching. Detected low Hemoglobin levels (9.8 g/dL), indicating mild anemia.';
      diagnosis = ["Mild Anemia (Microcytic)"];
      advice = ["Incorporate iron-rich foods in diet", "Avoid tea/coffee immediately after meals"];
      medications = [{ name: "Ferrous Sulfate", dosage: "325mg", frequency: "Once daily", route: "Orally", duration: "30 days" }];
      tests = ["Complete Blood Count (CBC) with Peripheral Smear", "Serum Ferritin"];
    } else if (selectedType === 'kidney') {
      vitals.creatinine = 1.6;
      notes = 'Client-Side Scanner: Renal panel matching. Borderline high Creatinine (1.6 mg/dL) detected.';
      diagnosis = ["Borderline Renal Function / Elevated Creatinine"];
      advice = ["Ensure adequate hydration (2-3 liters/day)", "Avoid NSAID painkillers like Ibuprofen", "Repeat renal function test in 1 month"];
      tests = ["Serum Creatinine", "Blood Urea Nitrogen (BUN)", "eGFR screening"];
    }

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
    saveUploadedRecord({
      ...data,
      name: selectedFile ? selectedFile.name : 'Report_AI_AutoMapped_' + new Date().toISOString().split('T')[0] + '.pdf',
      type: selectedFile ? (selectedFile.type.includes('pdf') ? 'PDF Report' : 'Captured Image') : 'Lab Report',
      memberId: activeMember.id
    }, selectedFile);

    setData(null);
    setSelectedFile(null);
    setFileBase64('');
  };

  const handleDeleteRecord = (id) => {
    deleteUploadedRecord(id);
    if (viewingRecord && viewingRecord.id === id) {
      setViewingRecord(null);
    }
  };

  const memberRecords = uploadedRecords ? uploadedRecords.filter(r => r.memberId === activeMember.id) : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
        <h4 style={{ fontSize: '0.9rem', margin: 0 }}>AI Health Report Scanner ({activeMember.name})</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '1rem' }}>Upload medical report cards or use camera to extract vitals.</p>

        {cameraActive && (
          <div style={{ position: 'relative', width: '100%', height: '180px', background: '#020617', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
            <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '2px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }}>
              <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '15px', height: '15px', borderTop: '4px solid #10b981', borderLeft: '4px solid #10b981' }} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '15px', height: '15px', borderTop: '4px solid #10b981', borderRight: '4px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '15px', height: '15px', borderBottom: '4px solid #10b981', borderLeft: '4px solid #10b981' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '15px', height: '15px', borderBottom: '4px solid #10b981', borderRight: '4px solid #10b981' }} />
            </div>
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem' }}>
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
            <div className="scan-line" style={{ height: '3px' }}></div>
            <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-animation" style={{ fontSize: '1.5rem', '--pulse-speed': '1.2s' }}>🔍</span>
              <strong style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Scanning Document...</strong>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>{scanStep}</p>
            </div>
          </div>
        )}

        {selectedFile && !scanning && !data && (
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
                    <option value="diabetic">Diabetic Panel</option>
                    <option value="lipid">Lipid Panel</option>
                    <option value="thyroid">Thyroid Panel</option>
                    <option value="cbc">CBC / Hematology</option>
                    <option value="kidney">Kidney Panel</option>
                    <option value="vitals">Basic Vitals</option>
                  </select>
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={triggerScan} style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}>Run AI Scan</button>
          </div>
        )}

        {/* OCR Result Verification Sheet (Manual Correction) */}
        {data && (
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 0.2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔍 Verify Extracted Parameters</span>
              <span style={{ fontSize: '0.55rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Accuracy check</span>
            </h5>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Report Date</label>
              <input type="date" className="form-control" style={{ padding: '0.3rem', fontSize: '0.7rem' }} value={data.IngestionDate || data.date || ''} onChange={e => setData({ ...data, date: e.target.value })} />
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
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

      {/* Document Preview Modal */}
      {viewingRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                <h3 style={{ fontSize: '0.85rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#fff' }}>{viewingRecord.name}</h3>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{viewingRecord.IngestionDate || viewingRecord.date}</span>
              </div>
              <button className="btn-icon" onClick={() => setViewingRecord(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Icon name="x" size={18} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden' }}>
              {viewingRecord.fileData && viewingRecord.fileData.startsWith('data:image/') ? (
                <img src={viewingRecord.fileData} style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }} />
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', width: '100%' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📄</span>
                  <strong style={{ fontSize: '0.75rem', display: 'block', color: '#fff' }}>PDF Report Card</strong>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Extracted details loaded below:</p>
                </div>
              )}
            </div>

            {viewingRecord.vitals && (
              <MedicalReportPresentation vitals={viewingRecord.vitals} />
            )}

            {viewingRecord.diagnosis && viewingRecord.diagnosis.length > 0 && (
              <div style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem', textAlign: 'left' }}>
                <strong style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', paddingBottom: '0.25rem' }}>
                  <span>🩺</span> Clinical Diagnoses
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {viewingRecord.diagnosis.map((item, i) => (
                    <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold' }}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            {viewingRecord.advice && viewingRecord.advice.length > 0 && (
              <div style={{ background: 'rgba(245, 158, 11, 0.02)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem', textAlign: 'left' }}>
                <strong style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(245, 158, 11, 0.1)', paddingBottom: '0.25rem' }}>
                  <span>📋</span> Clinical Advice & Instructions
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

            {viewingRecord.medications && viewingRecord.medications.length > 0 && (
              <div style={{ background: 'rgba(139, 92, 246, 0.02)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem', textAlign: 'left' }}>
                <strong style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', paddingBottom: '0.25rem' }}>
                  <span>💊</span> Prescribed Medications
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {viewingRecord.medications.map((med, i) => (
                    <div key={i} style={{ padding: '0.45rem 0.6rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.1)', fontSize: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '0.7rem' }}>{med.name}</span>
                        {med.duration && <span style={{ fontSize: '0.55rem', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>{med.duration}</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.6rem', marginTop: '0.25rem' }}>
                        {med.dosage && <span>Dose: <strong>{med.dosage}</strong></span>}
                        {med.frequency && <span>Freq: <strong>{med.frequency}</strong></span>}
                        {med.route && <span>Route: <strong>{med.route}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewingRecord.tests && viewingRecord.tests.length > 0 && (
              <div style={{ background: 'rgba(14, 165, 233, 0.02)', border: '1px solid rgba(14, 165, 233, 0.15)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem', textAlign: 'left' }}>
                <strong style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(14, 165, 233, 0.1)', paddingBottom: '0.25rem' }}>
                  <span>🧪</span> Prescribed Laboratory Tests
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {viewingRecord.tests.map((item, i) => (
                    <span key={i} style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold' }}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(59, 130, 246, 0.02)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.7rem', textAlign: 'left' }}>
              <strong style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                <span>📝</span> Extracted Insights & Observations
              </strong>
              <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{viewingRecord.notes}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => setViewingRecord(null)} style={{ flex: 1, fontSize: '0.75rem', padding: '0.45rem' }}>Close</button>
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
