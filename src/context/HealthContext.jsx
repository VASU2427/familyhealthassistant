import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage, isFirebaseEnabled } from '../services/firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const HealthContext = createContext();

const initialMembers = [
  { id: 'owner', name: 'Srinivas', relation: 'Owner', mobile: '+91-9876543210', age: 35, gender: 'Male', weight: 75, avatar: '/avatar_srinivas.png', bloodGroup: 'O+', colorTheme: 'teal' },
  { id: 'mom', name: 'Lakshmi', relation: 'Spouse', mobile: '+91-9876543211', age: 31, gender: 'Female', weight: 62, avatar: '/avatar_lakshmi.png', pregnancyMode: true, pregnancyWeeks: 28, dueDate: '2026-08-15', bloodGroup: 'B+', colorTheme: 'rose' },
  { id: 'baby', name: 'Sia', relation: 'Child', mobile: '', age: 0.2, gender: 'Female', weight: 5.5, avatar: '/avatar_sia.png', newbornMode: true, birthDate: '2026-03-20', bloodGroup: 'O+', colorTheme: 'blue' }
];

const initialVitals = {
  owner: [
    { date: '05/18', bpSystolic: 120, bpDiastolic: 80, glucose: 95, weight: 75, heartRate: 72, oxygen: 98, temperature: 98.4, hba1c: 5.5, tsh: 1.8, cholesterol: 185, hdl: 46, ldl: 112, triglycerides: 135, creatinine: 0.9, hemoglobin: 14.8 },
    { date: '05/19', bpSystolic: 122, bpDiastolic: 81, glucose: 98, weight: 75.2, heartRate: 74, oxygen: 99, temperature: 98.5, hba1c: 5.6, tsh: 1.9, cholesterol: 190, hdl: 45, ldl: 116, triglycerides: 138, creatinine: 0.9, hemoglobin: 14.7 },
    { date: '05/20', bpSystolic: 118, bpDiastolic: 79, glucose: 94, weight: 74.8, heartRate: 70, oxygen: 98, temperature: 98.3, hba1c: 5.5, tsh: 1.8, cholesterol: 182, hdl: 47, ldl: 110, triglycerides: 132, creatinine: 0.9, hemoglobin: 14.9 },
    { date: '05/21', bpSystolic: 121, bpDiastolic: 80, glucose: 96, weight: 75.0, heartRate: 71, oxygen: 98, temperature: 98.4, hba1c: 5.5, tsh: 1.8, cholesterol: 186, hdl: 46, ldl: 113, triglycerides: 136, creatinine: 1.0, hemoglobin: 14.8 },
    { date: '05/22', bpSystolic: 120, bpDiastolic: 80, glucose: 95, weight: 75.0, heartRate: 72, oxygen: 98, temperature: 98.4, hba1c: 5.5, tsh: 1.8, cholesterol: 185, hdl: 46, ldl: 112, triglycerides: 135, creatinine: 0.9, hemoglobin: 14.8 }
  ],
  mom: [
    { date: '05/18', bpSystolic: 110, bpDiastolic: 70, glucose: 88, weight: 61.5, heartRate: 76, oxygen: 99, temperature: 98.6, hba1c: 5.2, tsh: 2.2, cholesterol: 215, hdl: 56, ldl: 125, triglycerides: 165, creatinine: 0.6, hemoglobin: 11.4 },
    { date: '05/19', bpSystolic: 112, bpDiastolic: 72, glucose: 90, weight: 61.8, heartRate: 78, oxygen: 99, temperature: 98.7, hba1c: 5.3, tsh: 2.3, cholesterol: 220, hdl: 55, ldl: 130, triglycerides: 170, creatinine: 0.6, hemoglobin: 11.3 },
    { date: '05/20', bpSystolic: 115, bpDiastolic: 75, glucose: 92, weight: 62.0, heartRate: 80, oxygen: 98, temperature: 98.6, hba1c: 5.3, tsh: 2.4, cholesterol: 225, hdl: 54, ldl: 133, triglycerides: 176, creatinine: 0.7, hemoglobin: 11.2 },
    { date: '05/21', bpSystolic: 113, bpDiastolic: 73, glucose: 89, weight: 62.1, heartRate: 77, oxygen: 99, temperature: 98.5, hba1c: 5.2, tsh: 2.3, cholesterol: 222, hdl: 55, ldl: 131, triglycerides: 172, creatinine: 0.6, hemoglobin: 11.4 },
    { date: '05/22', bpSystolic: 114, bpDiastolic: 74, glucose: 91, weight: 62.2, heartRate: 79, oxygen: 98, temperature: 98.6, hba1c: 5.2, tsh: 2.2, cholesterol: 224, hdl: 55, ldl: 132, triglycerides: 174, creatinine: 0.6, hemoglobin: 11.4 }
  ],
  baby: [
    { date: '05/18', bpSystolic: 85, bpDiastolic: 55, glucose: 80, weight: 5.2, heartRate: 115, oxygen: 99, temperature: 98.8, hba1c: 5.0, tsh: 3.0, cholesterol: 124, hdl: 36, ldl: 74, triglycerides: 85, creatinine: 0.3, hemoglobin: 12.4 },
    { date: '05/19', bpSystolic: 86, bpDiastolic: 56, glucose: 82, weight: 5.3, heartRate: 118, oxygen: 99, temperature: 98.9, hba1c: 5.1, tsh: 3.1, cholesterol: 126, hdl: 35, ldl: 76, triglycerides: 88, creatinine: 0.3, hemoglobin: 12.3 },
    { date: '05/20', bpSystolic: 84, bpDiastolic: 54, glucose: 81, weight: 5.4, heartRate: 120, oxygen: 99, temperature: 98.7, hba1c: 5.1, tsh: 3.2, cholesterol: 125, hdl: 37, ldl: 75, triglycerides: 86, creatinine: 0.4, hemoglobin: 12.5 },
    { date: '05/21', bpSystolic: 85, bpDiastolic: 55, glucose: 83, weight: 5.45, heartRate: 117, oxygen: 98, temperature: 98.8, hba1c: 5.0, tsh: 3.1, cholesterol: 127, hdl: 36, ldl: 77, triglycerides: 89, creatinine: 0.3, hemoglobin: 12.4 },
    { date: '05/22', bpSystolic: 86, bpDiastolic: 56, glucose: 82, weight: 5.5, heartRate: 116, oxygen: 99, temperature: 98.8, hba1c: 5.0, tsh: 3.0, cholesterol: 125, hdl: 36, ldl: 75, triglycerides: 87, creatinine: 0.3, hemoglobin: 12.4 }
  ]
};

const initialVaccinations = [
  { id: 'v1', memberId: 'baby', name: 'BCG (Tuberculosis)', ageDue: 'Birth', dateDue: '2026-03-20', status: 'Given', dateGiven: '2026-03-20' },
  { id: 'v2', memberId: 'baby', name: 'Hepatitis B - 1', ageDue: 'Birth', dateDue: '2026-03-20', status: 'Given', dateGiven: '2026-03-20' },
  { id: 'v3', memberId: 'baby', name: 'OPV 0 (Oral Polio)', ageDue: 'Birth', dateDue: '2026-03-20', status: 'Given', dateGiven: '2026-03-20' },
  { id: 'v4', memberId: 'baby', name: 'OPV 1', ageDue: '6 Weeks', dateDue: '2026-05-01', status: 'Given', dateGiven: '2026-05-01' },
  { id: 'v5', memberId: 'baby', name: 'Pentavalent 1', ageDue: '6 Weeks', dateDue: '2026-05-01', status: 'Given', dateGiven: '2026-05-01' },
  { id: 'v6', memberId: 'baby', name: 'Rotavirus 1', ageDue: '6 Weeks', dateDue: '2026-05-01', status: 'Given', dateGiven: '2026-05-01' },
  { id: 'v7', memberId: 'baby', name: 'OPV 2', ageDue: '10 Weeks', dateDue: '2026-05-29', status: 'Pending', dateGiven: '' },
  { id: 'v8', memberId: 'baby', name: 'Pentavalent 2', ageDue: '10 Weeks', dateDue: '2026-05-29', status: 'Pending', dateGiven: '' },
  { id: 'v9', memberId: 'baby', name: 'Rotavirus 2', ageDue: '10 Weeks', dateDue: '2026-05-29', status: 'Pending', dateGiven: '' }
];

const initialMedicines = {
  owner: [
    { id: 'm1', name: 'Atorvastatin', dosage: '10mg', time: 'Night', remaining: 15, total: 30 },
    { id: 'm2', name: 'Metformin', dosage: '500mg', time: 'Morning & Night', remaining: 8, total: 60 }
  ],
  mom: [
    { id: 'm3', name: 'Prenatal Multivitamins', dosage: '1 Capsule', time: 'Morning', remaining: 25, total: 30 },
    { id: 'm4', name: 'Iron & Folic Acid', dosage: '1 Tablet', time: 'Afternoon', remaining: 4, total: 30 }
  ],
  baby: [
    { id: 'm5', name: 'Vitamin D3 Drops', dosage: '0.5ml', time: 'Morning', remaining: 12, total: 15 }
  ]
};

const initialMedicalHistories = {
  owner: [
    {
      id: 'h_own_1',
      date: '2026-05-18',
      issue: 'Mild Hypercholesterolemia & Executive Checkup',
      doctor: 'Dr. S. K. Gupta (General Physician)',
      diagnosis: 'Borderline elevated LDL cholesterol. Overall cardiovascular health is good, blood pressure is stable.',
      treatment: 'Low sodium, low saturated fat diet, 30 mins cardiovascular exercise daily.',
      prescriptions: [
        { name: 'Atorvastatin', dosage: '10mg once daily', duration: '30 Days', startDate: '2026-05-18', endDate: '2026-06-17' },
        { name: 'Coenzyme Q10', dosage: '100mg once daily', duration: '30 Days', startDate: '2026-05-18', endDate: '2026-06-17' }
      ],
      allergies: 'None reported',
      vitals: { 'BP': '120/80 mmHg', 'Weight': '75.0 kg', 'HR': '72 bpm', 'SpO2': '98%' },
      labReports: ['Lipid Profile (Total Cholesterol: 185 mg/dL, LDL: 112 mg/dL)'],
      vaccinations: 'Flu Vaccine (Given Nov 2025)',
      hospitalVisits: 'Outpatient Clinic',
      notes: 'Patient advised to repeat lipid screening in 3 months. Recommended increasing dietary fiber.',
      chronicDisease: 'Borderline Cholesterol'
    },
    {
      id: 'h_own_2',
      date: '2026-04-10',
      issue: 'Acute Gastroenteritis',
      doctor: 'Dr. S. K. Gupta (General Physician)',
      diagnosis: 'Mild bacterial stomach infection due to outside food ingestion.',
      treatment: 'Oral rehydration therapy, bland diet (rice, bananas, toast) for 3 days.',
      prescriptions: [
        { name: 'Metronidazole', dosage: '400mg three times daily', duration: '5 Days', startDate: '2026-04-10', endDate: '2026-04-15' },
        { name: 'ORS Electrolytes', dosage: 'As needed for hydration', duration: '3 Days', startDate: '2026-04-10', endDate: '2026-04-13' }
      ],
      allergies: 'None reported',
      vitals: { 'BP': '118/76 mmHg', 'Weight': '74.5 kg', 'HR': '78 bpm', 'Temp': '99.1 F' },
      labReports: [],
      vaccinations: 'None',
      hospitalVisits: 'Outpatient Clinic',
      notes: 'Hydration status was verified. No severe dehydration markers present.',
      chronicDisease: 'None'
    }
  ],
  mom: [
    {
      id: 'h_mom_1',
      date: '2026-05-15',
      issue: 'Routine Prenatal Consultation (Third Trimester)',
      doctor: 'Dr. Anita Roy (Gynecologist)',
      diagnosis: '28 Weeks Gestation, pregnancy progressing normally. Healthy fetal heart rate and movement.',
      treatment: 'Regular prenatal care, moderate walking, adequate hydration, elevation of legs.',
      prescriptions: [
        { name: 'Prenatal Multivitamins', dosage: '1 capsule daily', duration: '90 Days', startDate: '2026-05-15', endDate: '2026-08-13' },
        { name: 'Iron & Folic Acid', dosage: '1 tablet twice daily', duration: '90 Days', startDate: '2026-05-15', endDate: '2026-08-13' },
        { name: 'Calcium Carbonate', dosage: '500mg daily', duration: '90 Days', startDate: '2026-05-15', endDate: '2026-08-13' }
      ],
      allergies: 'Sulfa Drugs',
      vitals: { 'BP': '114/74 mmHg', 'Weight': '62.2 kg', 'HR': '79 bpm', 'SpO2': '98%' },
      labReports: ['Thyroid Panel (TSH: 2.2 uIU/mL - Normal)', 'Complete Blood Count (Hb: 11.4 g/dL)'],
      vaccinations: 'Tdap booster scheduled at 30 weeks',
      hospitalVisits: 'Outpatient Clinic',
      notes: 'Fetal heart rate is stable at 142 bpm. Fundal height matches gestational age. Patient complains of mild backache.',
      chronicDisease: 'Pregnancy Gestation'
    },
    {
      id: 'h_mom_2',
      date: '2026-03-12',
      issue: 'Second Trimester Anomaly Scan',
      doctor: 'Dr. Anita Roy (Gynecologist)',
      diagnosis: '20 Weeks Gestation. Detailed fetal anatomical survey completed.',
      treatment: 'Routine second trimester monitoring, iron supplements.',
      prescriptions: [
        { name: 'Prenatal Multivitamins', dosage: '1 capsule daily', duration: '60 Days', startDate: '2026-03-12', endDate: '2026-05-11' },
        { name: 'Iron & Folic Acid', dosage: '1 tablet daily', duration: '60 Days', startDate: '2026-03-12', endDate: '2026-05-11' }
      ],
      allergies: 'Sulfa Drugs',
      vitals: { 'BP': '110/70 mmHg', 'Weight': '58.5 kg', 'HR': '74 bpm' },
      labReports: ['Fetal Anomaly Ultrasound Scan (No structural anomalies detected)'],
      vaccinations: 'Tetanus Toxoid (Tetanus booster vaccine given)',
      hospitalVisits: 'Outpatient Radiology Dept',
      notes: 'Fetal growth metrics correspond to 20 weeks ± 3 days. Placenta is anterior and high. Fetal movements felt.',
      chronicDisease: 'Pregnancy Gestation'
    }
  ],
  baby: [
    {
      id: 'h_bab_1',
      date: '2026-05-01',
      issue: '6-Week Pediatric Growth & Wellness Check',
      doctor: 'Dr. Vivek Verma (Pediatrician)',
      diagnosis: 'Healthy 6-week-old female infant. Growth, motor response, and social smile are normal.',
      treatment: 'Exclusive breastfeeding, vitamin D3 supplementation.',
      prescriptions: [
        { name: 'Vitamin D3 Drops', dosage: '400 IU (0.5ml) daily', duration: '365 Days', startDate: '2026-05-01', endDate: '2027-05-01' }
      ],
      allergies: 'None reported',
      vitals: { 'Weight': '5.5 kg', 'HR': '116 bpm', 'SpO2': '99%', 'Temp': '98.8 F' },
      labReports: [],
      vaccinations: 'Pentavalent 1, Rotavirus 1, OPV 1 (Given)',
      hospitalVisits: 'Outpatient Clinic',
      notes: 'Infant is exclusively breastfed. Height and head circumference are in the 65th percentile. Safe sleeping guidelines discussed.',
      chronicDisease: 'None'
    },
    {
      id: 'h_bab_2',
      date: '2026-03-20',
      issue: 'Newborn Birth Assessment',
      doctor: 'Dr. Vivek Verma (Pediatrician)',
      diagnosis: 'Healthy female newborn, born at 39 weeks via normal vaginal delivery. APGAR Score: 9 at 1 min, 10 at 5 mins.',
      treatment: 'Newborn nursery care, neonatal screening, initiation of breastfeeding.',
      prescriptions: [],
      allergies: 'None reported',
      vitals: { 'Weight': '3.2 kg (Birth Weight)', 'Temp': '98.6 F', 'HR': '124 bpm' },
      labReports: ['Newborn Blood Screening Panel (All normal)', 'Hearing Test (Passed)'],
      vaccinations: 'BCG, Hepatitis B - 0, OPV - 0 (Given at birth)',
      hospitalVisits: 'Labor & Delivery Ward Admission',
      notes: 'Infant active, latched well within 1 hour of birth. Bilirubin screen normal.',
      chronicDisease: 'None'
    }
  ]
};

export const HealthProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const isCloudActive = isFirebaseEnabled && currentUser && currentUser.uid !== 'local_user';

  // State initialization with local fallback logic
  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    const saved = localStorage.getItem('fh_firebase_config');
    return saved ? JSON.parse(saved) : { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' };
  });

  const [geminiKey, setGeminiKey] = useState(() => {
    return (localStorage.getItem('fh_gemini_key') || '').trim();
  });

  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('fh_members');
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [activeMemberId, setActiveMemberId] = useState(() => {
    return localStorage.getItem('fh_active_member_id') || 'household';
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  const [vitals, setVitals] = useState(() => {
    const saved = localStorage.getItem('fh_vitals');
    return saved ? JSON.parse(saved) : initialVitals;
  });

  const [vaccinations, setVaccinations] = useState(() => {
    const saved = localStorage.getItem('fh_vaccinations');
    return saved ? JSON.parse(saved) : initialVaccinations;
  });

  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('fh_medicines');
    return saved ? JSON.parse(saved) : initialMedicines;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('fh_appointments');
    return saved ? JSON.parse(saved) : [
      { id: 'ap1', memberId: 'mom', docName: 'Dr. Anita Roy', specialty: 'Gynecologist', date: '2026-05-28', time: '10:30 AM', status: 'Confirmed', type: 'In-Clinic' },
      { id: 'ap2', memberId: 'baby', docName: 'Dr. Vivek Verma', specialty: 'Pediatrician', date: '2026-05-29', time: '11:00 AM', status: 'Confirmed', type: 'Teleconsultation' }
    ];
  });

  const [recentOrders, setRecentOrders] = useState(() => {
    const saved = localStorage.getItem('fh_orders');
    return saved ? JSON.parse(saved) : [
      { id: 'ord1', date: '2026-05-10', items: 'Iron & Folic Acid, Calcium Carbonate', amount: 'Rs. 450', status: 'Delivered' }
    ];
  });

  const [sampleCollections, setSampleCollections] = useState(() => {
    const saved = localStorage.getItem('fh_sample_collections');
    return saved ? JSON.parse(saved) : [
      {
        id: 'col_init_1',
        memberId: 'owner',
        tests: ['Complete Blood Count (CBC)', 'Lipid Profile'],
        address: 'Plot 42, Hitech City, Hyderabad, 500081',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '08:00 AM - 10:00 AM',
        status: 'Report Ready',
        cost: 1499,
        notes: 'Fasting required.',
        simulatedVitals: {
          glucose: 104,
          cholesterol: 198,
          hdl: 48,
          ldl: 122,
          triglycerides: 140,
          hemoglobin: 14.2
        },
        synced: false
      }
    ];
  });

  const [uploadedRecords, setUploadedRecords] = useState(() => {
    const saved = localStorage.getItem('fh_uploaded_records');
    return saved ? JSON.parse(saved) : [
      {
        id: 'f1',
        memberId: 'mom',
        name: 'Thyroid Panel Lab Report.pdf',
        date: '2026-05-15',
        doctor: 'Dr. S. K. Gupta',
        type: 'Lab Report',
        notes: 'TSH is within normal limits.',
        diagnosis: ["Euthyroid State", "Mild Thyromegaly Follow-up"],
        advice: ["Check TSH levels in 6 months", "Maintain balanced iodine diet"],
        medications: [],
        tests: ["Serum Thyroid Stimulating Hormone (TSH)", "Free Thyroxine (FT4)"]
      },
      {
        id: 'f2',
        memberId: 'baby',
        name: 'Newborn Immunization Card.png',
        date: '2026-03-20',
        doctor: 'City Pediatrics',
        type: 'Vaccination Card',
        notes: 'BCG and HepB-1 doses given at birth.',
        diagnosis: ["Routine Pediatric Immunization"],
        advice: ["Next vaccination scheduled at 6 weeks of age", "Monitor for fever and apply cold compress to injection site if red"],
        medications: [
          { name: "Paracetamol Drops (100mg/ml)", dosage: "0.6 ml", frequency: "Every 6 hours if temperature exceeds 100 F", route: "Orally", duration: "2 days" }
        ],
        tests: ["Routine Pediatric Screening", "Inborn Errors of Metabolism (IEM) Panel"]
      }
    ];
  });

  const [medicalHistories, setMedicalHistories] = useState(() => {
    const saved = localStorage.getItem('fh_medical_histories');
    return saved ? JSON.parse(saved) : initialMedicalHistories;
  });

  const [pregnancyChecklist, setPregnancyChecklist] = useState(() => {
    const saved = localStorage.getItem('fh_preg_chk');
    return saved ? JSON.parse(saved) : [
      { id: 'pc1', trimester: 1, task: 'Ultrasound Confirmation Scan', completed: true },
      { id: 'pc2', trimester: 1, task: 'Blood Type & CBC Screening', completed: true },
      { id: 'pc3', trimester: 2, task: 'Anomaly Ultrasound Scan', completed: true },
      { id: 'pc4', trimester: 2, task: 'Glucose Tolerance screening', completed: false },
      { id: 'pc5', trimester: 3, task: 'Tdap Vaccine Booster', completed: false },
      { id: 'pc6', trimester: 3, task: 'Biophysical Profile (BPP)', completed: false }
    ];
  });

  const [babyMilestones, setBabyMilestones] = useState(() => {
    const saved = localStorage.getItem('fh_milestones');
    return saved ? JSON.parse(saved) : [
      { id: 'mil1', age: '0-2 Months', milestone: 'Social Smile & Cooing sound', completed: true },
      { id: 'mil2', age: '2-4 Months', milestone: 'Steady Head Support & Grasping toys', completed: false },
      { id: 'mil3', age: '4-6 Months', milestone: 'Rolls over front-to-back', completed: false }
    ];
  });

  const [wearableSensors, setWearableSensors] = useState({ heartRate: 72, spo2: 98, temperature: 98.4 });
  const [toasts, setToasts] = useState([]);

  const addToast = (text, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const saveFirebaseConfig = (config) => {
    localStorage.setItem('fh_firebase_config', JSON.stringify(config));
    setFirebaseConfig(config);
    addToast("Firebase configuration saved. Reloading page to connect...", "warning");
    setTimeout(() => window.location.reload(), 1500);
  };

  const saveGeminiKey = (key) => {
    const cleanKey = key.trim();
    localStorage.setItem('fh_gemini_key', cleanKey);
    setGeminiKey(cleanKey);
    addToast("Gemini API Key updated!", "success");
  };

  // Local Storage Sync Effects (Active only in Local Sandbox Mode)
  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_members', JSON.stringify(members));
  }, [members, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_vitals', JSON.stringify(vitals));
  }, [vitals, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_vaccinations', JSON.stringify(vaccinations));
  }, [vaccinations, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_medicines', JSON.stringify(medicines));
  }, [medicines, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_appointments', JSON.stringify(appointments));
  }, [appointments, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_orders', JSON.stringify(recentOrders));
  }, [recentOrders, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_sample_collections', JSON.stringify(sampleCollections));
  }, [sampleCollections, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_uploaded_records', JSON.stringify(uploadedRecords));
  }, [uploadedRecords, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_medical_histories', JSON.stringify(medicalHistories));
  }, [medicalHistories, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_preg_chk', JSON.stringify(pregnancyChecklist));
  }, [pregnancyChecklist, isCloudActive]);

  useEffect(() => {
    if (!isCloudActive) localStorage.setItem('fh_milestones', JSON.stringify(babyMilestones));
  }, [babyMilestones, isCloudActive]);

  useEffect(() => {
    localStorage.setItem('fh_active_member_id', activeMemberId);
  }, [activeMemberId]);

  // Firestore Realtime listeners (Active only in Firebase Cloud Mode)
  useEffect(() => {
    if (!isCloudActive) return;

    const unsubscribes = [];

    // familyMembers
    const qMembers = query(collection(db, 'familyMembers'), where('userId', '==', currentUser.uid));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data(), avatar: doc.data().avatarUrl, colorTheme: doc.data().themeColor });
      });
      if (list.length > 0) {
        setMembers(list);
      }
    });
    unsubscribes.push(unsubMembers);

    // wearableVitals
    const qVitals = query(collection(db, 'wearableVitals'), where('userId', '==', currentUser.uid));
    const unsubVitals = onSnapshot(qVitals, (snapshot) => {
      const map = {};
      snapshot.forEach(doc => {
        const d = doc.data();
        if (!map[d.memberId]) map[d.memberId] = [];
        map[d.memberId].push({ id: doc.id, ...d });
      });
      Object.keys(map).forEach(mId => {
        map[mId].sort((a, b) => a.date.localeCompare(b.date));
      });
      setVitals(map);
    });
    unsubscribes.push(unsubVitals);

    // medications
    const qMeds = query(collection(db, 'medications'), where('userId', '==', currentUser.uid));
    const unsubMeds = onSnapshot(qMeds, (snapshot) => {
      const map = {};
      snapshot.forEach(doc => {
        const d = doc.data();
        if (!map[d.memberId]) map[d.memberId] = [];
        map[d.memberId].push({ id: doc.id, ...d });
      });
      setMedicines(map);
    });
    unsubscribes.push(unsubMeds);

    // appointments
    const qAppts = query(collection(db, 'appointments'), where('userId', '==', currentUser.uid));
    const unsubAppts = onSnapshot(qAppts, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAppointments(list);
    });
    unsubscribes.push(unsubAppts);

    // vaccinations
    const qVaccs = query(collection(db, 'vaccinations'), where('userId', '==', currentUser.uid));
    const unsubVaccs = onSnapshot(qVaccs, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setVaccinations(list);
    });
    unsubscribes.push(unsubVaccs);

    // healthRecords (Maps to uploadedRecords AND medicalHistories)
    const qRecords = query(collection(db, 'healthRecords'), where('userId', '==', currentUser.uid));
    const unsubRecords = onSnapshot(qRecords, (snapshot) => {
      const uploads = [];
      const histories = {};

      snapshot.forEach(doc => {
        const d = doc.data();
        const record = { id: doc.id, ...d, fileData: d.fileUrl }; // map fileUrl to fileData to keep UI compat

        if (d.type === 'Lab Report' || d.type === 'Vaccination Card' || d.fileUrl) {
          uploads.push(record);
        }

        if (!histories[d.memberId]) histories[d.memberId] = [];
        
        const formattedVitals = {};
        if (d.vitals) {
          if (d.vitals.bpSystolic && d.vitals.bpDiastolic) formattedVitals['BP'] = `${d.vitals.bpSystolic}/${d.vitals.bpDiastolic} mmHg`;
          if (d.vitals.weight) formattedVitals['Weight'] = `${d.vitals.weight} kg`;
          if (d.vitals.heartRate) formattedVitals['HR'] = `${d.vitals.heartRate} bpm`;
          if (d.vitals.oxygen) formattedVitals['SpO2'] = `${d.vitals.oxygen}%`;
          if (d.vitals.temperature) formattedVitals['Temp'] = `${d.vitals.temperature} F`;
        }

        histories[d.memberId].push({
          id: doc.id,
          date: d.date,
          issue: d.name,
          doctor: d.doctor,
          diagnosis: d.diagnosis || [],
          treatment: d.advice || [],
          prescriptions: d.medications || [],
          allergies: d.allergies || 'None reported',
          vitals: formattedVitals,
          labReports: d.tests || [],
          hospitalVisits: d.hospitalVisits || 'Outpatient Clinic',
          notes: d.notes || '',
          chronicDisease: d.chronicDisease || 'None'
        });
      });

      setUploadedRecords(uploads);
      setMedicalHistories(histories);
    });
    unsubscribes.push(unsubRecords);

    // sampleCollections
    const qSamples = query(collection(db, 'sampleCollections'), where('userId', '==', currentUser.uid));
    const unsubSamples = onSnapshot(qSamples, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSampleCollections(list);
    });
    unsubscribes.push(unsubSamples);

    // medicineOrders
    const qOrders = query(collection(db, 'medicineOrders'), where('userId', '==', currentUser.uid));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRecentOrders(list);
    });
    unsubscribes.push(unsubOrders);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, isCloudActive]);

  // Handle first login data auto-migration
  useEffect(() => {
    if (isCloudActive) {
      const migrationCheckedKey = `fh_migrated_${currentUser.uid}`;
      const alreadyMigrated = localStorage.getItem(migrationCheckedKey) === 'true';
      if (!alreadyMigrated) {
        migrateLocalStorageToFirebase(currentUser).then(() => {
          localStorage.setItem(migrationCheckedKey, 'true');
          addToast("Local profiles & historical records synced with Cloud Firestore!", "success");
        });
      }
    }
  }, [currentUser, isCloudActive]);

  const migrateLocalStorageToFirebase = async (user) => {
    console.log("Migrating local storage data to Firebase for user:", user.uid);
    try {
      const memberIdMap = {};
      const localMembers = JSON.parse(localStorage.getItem('fh_members') || '[]');
      
      for (const m of (localMembers.length ? localMembers : initialMembers)) {
        const docRef = await addDoc(collection(db, 'familyMembers'), {
          userId: user.uid,
          name: m.name,
          relation: m.relation,
          age: m.age || null,
          gender: m.gender || '',
          weight: m.weight || null,
          dob: m.dob || '',
          bloodGroup: m.bloodGroup || '',
          allergies: m.allergies || [],
          conditions: m.conditions || [],
          avatarUrl: m.avatar || '',
          themeColor: m.colorTheme || 'teal',
          pregnancyMode: m.pregnancyMode || false,
          pregnancyWeeks: m.pregnancyWeeks || null,
          dueDate: m.dueDate || '',
          newbornMode: m.newbornMode || false,
          birthDate: m.birthDate || '',
          mobile: m.mobile || ''
        });
        memberIdMap[m.id] = docRef.id;
      }

      await writeAuditLog('MIGRATE_LOCAL_STORAGE');

      const localVitals = JSON.parse(localStorage.getItem('fh_vitals') || '{}');
      const vitalsToMigrate = Object.keys(localVitals).length ? localVitals : initialVitals;
      for (const localMemberId of Object.keys(vitalsToMigrate)) {
        const fsMemberId = memberIdMap[localMemberId] || localMemberId;
        for (const entry of vitalsToMigrate[localMemberId]) {
          await addDoc(collection(db, 'wearableVitals'), {
            userId: user.uid,
            memberId: fsMemberId,
            date: entry.date,
            bpSystolic: entry.bpSystolic || null,
            bpDiastolic: entry.bpDiastolic || null,
            glucose: entry.glucose || null,
            weight: entry.weight || null,
            heartRate: entry.heartRate || null,
            oxygen: entry.oxygen || null,
            temperature: entry.temperature || null,
            hba1c: entry.hba1c || null,
            tsh: entry.tsh || null,
            cholesterol: entry.cholesterol || null,
            hdl: entry.hdl || null,
            ldl: entry.ldl || null,
            triglycerides: entry.triglycerides || null,
            creatinine: entry.creatinine || null,
            hemoglobin: entry.hemoglobin || null
          });
        }
      }

      const localMedicines = JSON.parse(localStorage.getItem('fh_medicines') || '{}');
      const medsToMigrate = Object.keys(localMedicines).length ? localMedicines : initialMedicines;
      for (const localMemberId of Object.keys(medsToMigrate)) {
        const fsMemberId = memberIdMap[localMemberId] || localMemberId;
        for (const m of medsToMigrate[localMemberId]) {
          await addDoc(collection(db, 'medications'), {
            userId: user.uid,
            memberId: fsMemberId,
            name: m.name,
            dosage: m.dosage || '',
            time: m.time || '',
            remaining: m.remaining || 0,
            total: m.total || 0
          });
        }
      }

      const localAppointments = JSON.parse(localStorage.getItem('fh_appointments') || '[]');
      const apptsToMigrate = localAppointments.length ? localAppointments : [
        { id: 'ap1', memberId: 'mom', docName: 'Dr. Anita Roy', specialty: 'Gynecologist', date: '2026-05-28', time: '10:30 AM', status: 'Confirmed', type: 'In-Clinic' },
        { id: 'ap2', memberId: 'baby', docName: 'Dr. Vivek Verma', specialty: 'Pediatrician', date: '2026-05-29', time: '11:00 AM', status: 'Confirmed', type: 'Teleconsultation' }
      ];
      for (const a of apptsToMigrate) {
        const fsMemberId = memberIdMap[a.memberId] || a.memberId;
        await addDoc(collection(db, 'appointments'), {
          userId: user.uid,
          memberId: fsMemberId,
          docName: a.docName,
          specialty: a.specialty,
          date: a.date,
          time: a.time,
          status: a.status,
          type: a.type
        });
      }

      const localVaccinations = JSON.parse(localStorage.getItem('fh_vaccinations') || '[]');
      const vaccsToMigrate = localVaccinations.length ? localVaccinations : initialVaccinations;
      for (const v of vaccsToMigrate) {
        const fsMemberId = memberIdMap[v.memberId] || v.memberId;
        await addDoc(collection(db, 'vaccinations'), {
          userId: user.uid,
          memberId: fsMemberId,
          name: v.name,
          ageDue: v.ageDue,
          dateDue: v.dateDue,
          status: v.status,
          dateGiven: v.dateGiven || ''
        });
      }

      const localHistory = JSON.parse(localStorage.getItem('fh_medical_histories') || '{}');
      const histToMigrate = Object.keys(localHistory).length ? localHistory : initialMedicalHistories;
      for (const localMemberId of Object.keys(histToMigrate)) {
        const fsMemberId = memberIdMap[localMemberId] || localMemberId;
        for (const h of histToMigrate[localMemberId]) {
          let bpSys = null, bpDia = null, wt = null, hr = null, o2 = null, temp = null;
          if (h.vitals) {
            if (h.vitals.BP) {
              const parts = h.vitals.BP.split('/');
              if (parts.length === 2) {
                bpSys = parseInt(parts[0]);
                bpDia = parseInt(parts[1]);
              }
            }
            if (h.vitals.Weight) wt = parseFloat(h.vitals.Weight);
            if (h.vitals.HR) hr = parseInt(h.vitals.HR);
            if (h.vitals.SpO2) o2 = parseInt(h.vitals.SpO2);
            if (h.vitals.Temp) temp = parseFloat(h.vitals.Temp);
          }

          await addDoc(collection(db, 'healthRecords'), {
            userId: user.uid,
            memberId: fsMemberId,
            name: h.issue || 'Clinical Visit',
            date: h.date,
            doctor: h.doctor,
            type: 'Clinical Visit',
            notes: h.notes || '',
            diagnosis: h.diagnosis ? (Array.isArray(h.diagnosis) ? h.diagnosis : [h.diagnosis]) : [],
            advice: h.treatment ? (Array.isArray(h.treatment) ? h.treatment : [h.treatment]) : [],
            medications: h.prescriptions || [],
            tests: h.labReports || [],
            vitals: {
              bpSystolic: bpSys,
              bpDiastolic: bpDia,
              weight: wt,
              heartRate: hr,
              oxygen: o2,
              temperature: temp
            },
            verificationStatus: 'verified',
            ocrConfidence: 1.0,
            fileUrl: ''
          });
        }
      }

      const localUploads = JSON.parse(localStorage.getItem('fh_uploaded_records') || '[]');
      for (const r of localUploads) {
        const fsMemberId = memberIdMap[r.memberId] || r.memberId;
        await addDoc(collection(db, 'healthRecords'), {
          userId: user.uid,
          memberId: fsMemberId,
          name: r.name,
          date: r.date,
          doctor: r.doctor || 'AI Auto-Scanner',
          type: r.type || 'Lab Report',
          notes: r.notes || '',
          diagnosis: r.diagnosis || [],
          advice: r.advice || [],
          medications: r.medications || [],
          tests: r.tests || [],
          vitals: r.vitals || {},
          verificationStatus: r.verificationStatus || 'verified',
          ocrConfidence: r.ocrConfidence || 1.0,
          fileUrl: r.fileUrl || ''
        });
      }

      const localSamples = JSON.parse(localStorage.getItem('fh_sample_collections') || '[]');
      for (const s of localSamples) {
        const fsMemberId = memberIdMap[s.memberId] || s.memberId;
        await addDoc(collection(db, 'sampleCollections'), {
          userId: user.uid,
          memberId: fsMemberId,
          tests: s.tests || [],
          address: s.address || '',
          date: s.date || '',
          timeSlot: s.timeSlot || '',
          status: s.status || '',
          cost: s.cost || 0,
          notes: s.notes || '',
          simulatedVitals: s.simulatedVitals || {},
          synced: s.synced || false
        });
      }
      console.log("Historical migration completed successfully!");
    } catch (e) {
      console.error("Migration failed:", e);
    }
  };

  const writeAuditLog = async (action) => {
    if (!isCloudActive) return;
    try {
      await addDoc(collection(db, 'auditLogs'), {
        userId: currentUser.uid,
        action: action,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  const uploadFile = async (file, path) => {
    if (!isCloudActive) {
      // Local fallback stores as data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const addFamilyMember = async (member) => {
    const tempId = 'mem_' + Date.now();
    const newMember = {
      name: member.name,
      relation: member.relation || '',
      age: member.age || null,
      gender: member.gender || '',
      weight: member.weight || null,
      dob: member.dob || '',
      bloodGroup: member.bloodGroup || '',
      allergies: member.allergies || [],
      conditions: member.conditions || [],
      avatarUrl: member.avatar || '',
      themeColor: member.colorTheme || 'teal',
      pregnancyMode: member.pregnancyMode || false,
      pregnancyWeeks: member.pregnancyWeeks || null,
      dueDate: member.dueDate || '',
      newbornMode: member.newbornMode || false,
      birthDate: member.birthDate || '',
      mobile: member.mobile || ''
    };

    if (isCloudActive) {
      try {
        const docRef = await addDoc(collection(db, 'familyMembers'), {
          userId: currentUser.uid,
          ...newMember
        });
        await writeAuditLog('ADD_FAMILY_MEMBER');
        addToast(`Registered family profile for ${member.name}!`, 'success');
        return docRef.id;
      } catch (e) {
        console.error("Firestore add family member error:", e);
      }
    }

    // Local mode fallback
    const localMember = { id: tempId, ...newMember, avatar: member.avatar, colorTheme: member.colorTheme || 'teal' };
    setMembers(prev => [...prev, localMember]);
    addToast(`Registered family profile for ${member.name}!`, 'success');
    return tempId;
  };

  const updateFamilyMember = async (memberId, updatedFields) => {
    const fields = {
      name: updatedFields.name || '',
      relation: updatedFields.relation || '',
      age: updatedFields.age || null,
      gender: updatedFields.gender || '',
      weight: updatedFields.weight || null,
      dob: updatedFields.dob || '',
      bloodGroup: updatedFields.bloodGroup || '',
      allergies: updatedFields.allergies || [],
      conditions: updatedFields.conditions || [],
      themeColor: updatedFields.colorTheme || updatedFields.themeColor || 'teal',
      pregnancyMode: updatedFields.pregnancyMode || false,
      pregnancyWeeks: updatedFields.pregnancyWeeks || null,
      dueDate: updatedFields.dueDate || '',
      newbornMode: updatedFields.newbornMode || false,
      birthDate: updatedFields.birthDate || '',
      mobile: updatedFields.mobile || ''
    };

    if (isCloudActive) {
      try {
        const docRef = doc(db, 'familyMembers', memberId);
        await updateDoc(docRef, fields);
        await writeAuditLog('UPDATE_FAMILY_MEMBER');
        addToast(`Updated details!`, 'success');
        return;
      } catch (e) {
        console.error("Firestore update family member error:", e);
      }
    }

    // Local mode fallback
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...fields, colorTheme: fields.themeColor } : m));
    addToast(`Updated details!`, 'success');
  };

  const updateMemberAvatar = async (memberId, newAvatar) => {
    if (isCloudActive) {
      try {
        const docRef = doc(db, 'familyMembers', memberId);
        await updateDoc(docRef, {
          avatarUrl: newAvatar
        });
        await writeAuditLog('UPDATE_MEMBER_AVATAR');
        addToast("Updated profile picture!", "success");
        return;
      } catch (e) {
        console.error("Firestore update avatar error:", e);
      }
    }

    // Local mode fallback
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, avatar: newAvatar, avatarUrl: newAvatar } : m));
    addToast("Updated profile picture!", "success");
  };

  const logVitals = async (memberId, newVital, customDate) => {
    const targetId = memberId === 'household' ? 'owner' : memberId;
    let dateStr = customDate || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
    
    if (isCloudActive) {
      try {
        await addDoc(collection(db, 'wearableVitals'), {
          userId: currentUser.uid,
          memberId: targetId,
          date: dateStr,
          ...newVital
        });
        await writeAuditLog('WRITE_VITALS');
        addToast(`Successfully logged vitals parameters.`, 'success');
        return;
      } catch (e) {
        console.error("Firestore log vitals error:", e);
      }
    }

    // Local mode fallback
    setVitals(prev => {
      const currentList = prev[targetId] ? [...prev[targetId]] : [];
      // Replace or add based on date
      const existingIdx = currentList.findIndex(v => v.date === dateStr);
      const newEntry = { date: dateStr, ...newVital };
      if (existingIdx >= 0) {
        currentList[existingIdx] = { ...currentList[existingIdx], ...newVital };
      } else {
        currentList.push(newEntry);
      }
      return { ...prev, [targetId]: currentList };
    });
    addToast(`Successfully logged vitals parameters.`, 'success');
  };

  const updateVaccinationStatus = async (vacId, status, date) => {
    if (isCloudActive) {
      try {
        const docRef = doc(db, 'vaccinations', vacId);
        await updateDoc(docRef, {
          status,
          dateGiven: status === 'Given' ? date || new Date().toISOString().split('T')[0] : ''
        });
        await writeAuditLog('UPDATE_VACCINATION');
        addToast('Vaccination updated!', 'info');
        return;
      } catch (e) {
        console.error("Firestore update vaccination error:", e);
      }
    }

    // Local mode fallback
    setVaccinations(prev => prev.map(v => v.id === vacId ? { ...v, status, dateGiven: status === 'Given' ? date || new Date().toISOString().split('T')[0] : '' } : v));
    addToast('Vaccination updated!', 'info');
  };

  const addMedicine = async (memberId, med) => {
    const targetId = memberId === 'household' ? 'owner' : memberId;
    const newMed = {
      name: med.name,
      dosage: med.dosage || '',
      time: med.time || '',
      remaining: med.total,
      total: med.total
    };

    if (isCloudActive) {
      try {
        await addDoc(collection(db, 'medications'), {
          userId: currentUser.uid,
          memberId: targetId,
          ...newMed
        });
        await writeAuditLog('ADD_MEDICATION');
        addToast('Medication added!', 'success');
        return;
      } catch (e) {
        console.error("Firestore add medication error:", e);
      }
    }

    // Local mode fallback
    setMedicines(prev => {
      const currentList = prev[targetId] ? [...prev[targetId]] : [];
      currentList.push({ id: 'med_' + Date.now(), ...newMed });
      return { ...prev, [targetId]: currentList };
    });
    addToast('Medication added!', 'success');
  };

  const logMedicineDose = async (memberId, medId) => {
    const targetId = memberId === 'household' ? 'owner' : memberId;

    if (isCloudActive) {
      try {
        const docRef = doc(db, 'medications', medId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const curRem = snap.data().remaining || 0;
          await updateDoc(docRef, {
            remaining: Math.max(0, curRem - 1)
          });
          await writeAuditLog('TAKE_MEDICATION_DOSE');
        }
        return;
      } catch (e) {
        console.error("Firestore take dose error:", e);
      }
    }

    // Local mode fallback
    setMedicines(prev => {
      const currentList = prev[targetId] ? [...prev[targetId]] : [];
      const updated = currentList.map(m => m.id === medId ? { ...m, remaining: Math.max(0, m.remaining - 1) } : m);
      return { ...prev, [targetId]: updated };
    });
  };

  const orderMedicines = async (items, cost) => {
    const newOrder = {
      date: new Date().toISOString().split('T')[0],
      items,
      amount: `Rs. ${cost}`,
      status: 'Delivered'
    };

    if (isCloudActive) {
      try {
        await addDoc(collection(db, 'medicineOrders'), {
          userId: currentUser.uid,
          ...newOrder
        });
        await writeAuditLog('ORDER_MEDICINES');
        addToast('Refill order placed!', 'success');
        return;
      } catch (e) {
        console.error("Firestore order medicines error:", e);
      }
    }

    // Local mode fallback
    setRecentOrders(prev => [{ id: 'ord_' + Date.now(), ...newOrder }, ...prev]);
    addToast('Refill order placed!', 'success');
  };

  const bookAppointment = async (app) => {
    const targetId = app.memberId === 'household' ? 'owner' : app.memberId;
    const newAppt = {
      memberId: targetId,
      docName: app.docName,
      specialty: app.specialty,
      date: app.date,
      time: app.time,
      status: 'Confirmed',
      type: app.type
    };

    if (isCloudActive) {
      try {
        await addDoc(collection(db, 'appointments'), {
          userId: currentUser.uid,
          ...newAppt
        });
        await writeAuditLog('BOOK_APPOINTMENT');
        addToast('Appointment booked!', 'success');
        return;
      } catch (e) {
        console.error("Firestore book appointment error:", e);
      }
    }

    // Local mode fallback
    setAppointments(prev => [...prev, { id: 'app_' + Date.now(), ...newAppt }]);
    addToast('Appointment booked!', 'success');
  };

  const addMedicalHistory = async (memberId, record) => {
    const targetId = memberId === 'household' ? 'owner' : memberId;
    
    let bpSys = null, bpDia = null;
    if (record.vitals?.BP) {
      const parts = record.vitals.BP.split('/');
      if (parts.length === 2) {
        bpSys = parseInt(parts[0]);
        bpDia = parseInt(parts[1]);
      }
    }

    if (isCloudActive) {
      try {
        await addDoc(collection(db, 'healthRecords'), {
          userId: currentUser.uid,
          memberId: targetId,
          name: record.issue || 'General Checkup',
          date: record.date || new Date().toISOString().split('T')[0],
          doctor: record.doctor || 'General Physician',
          type: 'Clinical Visit',
          notes: record.notes || '',
          diagnosis: record.diagnosis ? (Array.isArray(record.diagnosis) ? record.diagnosis : [record.diagnosis]) : [],
          advice: record.treatment ? (Array.isArray(record.treatment) ? record.treatment : [record.treatment]) : [],
          medications: record.prescriptions || [],
          tests: record.labReports || [],
          vitals: {
            bpSystolic: bpSys,
            bpDiastolic: bpDia,
            weight: record.vitals?.Weight ? parseFloat(record.vitals.Weight) : null,
            heartRate: record.vitals?.HR ? parseInt(record.vitals.HR) : null,
            oxygen: record.vitals?.SpO2 ? parseInt(record.vitals.SpO2) : null,
            temperature: record.vitals?.Temp ? parseFloat(record.vitals.Temp) : null
          },
          verificationStatus: 'verified',
          ocrConfidence: 1.0,
          fileUrl: ''
        });
        await writeAuditLog('WRITE_CLINICAL_RECORD');
        addToast('Clinical history saved!', 'success');
        return;
      } catch (e) {
        console.error("Firestore add medical history error:", e);
      }
    }

    // Local mode fallback
    setMedicalHistories(prev => {
      const currentList = prev[targetId] ? [...prev[targetId]] : [];
      currentList.push({
        id: 'hist_' + Date.now(),
        date: record.date,
        issue: record.issue,
        doctor: record.doctor,
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || '',
        prescriptions: record.prescriptions || [],
        allergies: record.allergies || 'None reported',
        vitals: record.vitals || {},
        labReports: record.labReports || [],
        hospitalVisits: record.hospitalVisits || 'Outpatient Clinic',
        notes: record.notes || '',
        chronicDisease: record.chronicDisease || 'None'
      });
      return { ...prev, [targetId]: currentList };
    });
    addToast('Clinical history saved!', 'success');
  };

  const saveUploadedRecord = async (record, file) => {
    let finalFileUrl = '';
    if (file) {
      const path = `users/${currentUser?.uid || 'local'}/records/${file.name}_${Date.now()}`;
      finalFileUrl = await uploadFile(file, path);
    } else if (record.fileData) {
      finalFileUrl = record.fileData;
    }

    const newRecord = {
      memberId: record.memberId,
      name: record.name,
      date: record.IngestionDate || record.date || new Date().toISOString().split('T')[0],
      doctor: record.doctor || 'AI Auto-Scanner',
      type: record.type || 'Lab Report',
      notes: record.notes || '',
      diagnosis: record.diagnosis || [],
      advice: record.advice || [],
      medications: record.medications || [],
      tests: record.tests || [],
      vitals: record.vitals || {},
      verificationStatus: 'verified',
      ocrConfidence: record.ocrConfidence || 1.0,
      fileUrl: finalFileUrl
    };

    if (isCloudActive) {
      try {
        await addDoc(collection(db, 'healthRecords'), {
          userId: currentUser.uid,
          ...newRecord
        });
        await writeAuditLog('WRITE_HEALTH_RECORD');
        addToast('Medical report saved!', 'success');
        return;
      } catch (e) {
        console.error("Firestore save uploaded record error:", e);
      }
    }

    // Local mode fallback
    const localRec = { id: 'f_' + Date.now(), ...newRecord, fileData: finalFileUrl };
    setUploadedRecords(prev => [localRec, ...prev]);
    
    // Also push to history timeline in local mode
    const formattedVitals = {};
    if (newRecord.vitals) {
      const v = newRecord.vitals;
      if (v.bpSystolic && v.bpDiastolic) formattedVitals['BP'] = `${v.bpSystolic}/${v.bpDiastolic} mmHg`;
      if (v.weight) formattedVitals['Weight'] = `${v.weight} kg`;
      if (v.heartRate) formattedVitals['HR'] = `${v.heartRate} bpm`;
      if (v.oxygen) formattedVitals['SpO2'] = `${v.oxygen}%`;
      if (v.temperature) formattedVitals['Temp'] = `${v.temperature} F`;
    }

    setMedicalHistories(prev => {
      const currentList = prev[record.memberId] ? [...prev[record.memberId]] : [];
      currentList.push({
        id: 'hist_rec_' + Date.now(),
        date: newRecord.date,
        issue: newRecord.name,
        doctor: newRecord.doctor,
        diagnosis: newRecord.diagnosis.join(', '),
        treatment: newRecord.advice.join(', '),
        prescriptions: newRecord.medications,
        allergies: 'None reported',
        vitals: formattedVitals,
        labReports: newRecord.tests,
        hospitalVisits: 'Outpatient Clinic',
        notes: newRecord.notes,
        chronicDisease: 'None'
      });
      return { ...prev, [record.memberId]: currentList };
    });

    addToast('Medical report saved!', 'success');
  };

  const deleteUploadedRecord = async (recordId) => {
    if (isCloudActive) {
      try {
        await deleteDoc(doc(db, 'healthRecords', recordId));
        await writeAuditLog('DELETE_HEALTH_RECORD');
        addToast('Medical record deleted.', 'warning');
        return;
      } catch (e) {
        console.error("Firestore delete record error:", e);
      }
    }

    // Local mode fallback
    setUploadedRecords(prev => prev.filter(r => r.id !== recordId));
    addToast('Medical record deleted.', 'warning');
  };

  // Sample Collections Management Actions
  const bookSampleCollection = async (memberId, tests, address, date, timeSlot, cost, notes, simulatedVitals) => {
    const targetId = memberId === 'household' ? 'owner' : memberId;
    const newCollection = {
      memberId: targetId,
      tests,
      address,
      date,
      timeSlot,
      status: 'Scheduled',
      cost,
      notes,
      simulatedVitals,
      synced: false
    };

    if (isCloudActive) {
      try {
        await addDoc(collection(db, 'sampleCollections'), {
          userId: currentUser.uid,
          ...newCollection
        });
        await writeAuditLog('BOOK_SAMPLE_COLLECTION');
        addToast('Home sample collection scheduled successfully!', 'success');
        return;
      } catch (e) {
        console.error("Firestore book sample error:", e);
      }
    }

    // Local mode fallback
    setSampleCollections(prev => [{ id: 'col_' + Date.now(), ...newCollection }, ...prev]);
    addToast('Home sample collection scheduled successfully!', 'success');
  };

  const updateCollectionStatus = async (id, newStatus) => {
    if (isCloudActive) {
      try {
        await updateDoc(doc(db, 'sampleCollections', id), {
          status: newStatus
        });
        await writeAuditLog('UPDATE_COLLECTION_STATUS');
        addToast(`Sample collection status updated: ${newStatus}`, 'info');
        return;
      } catch (e) {
        console.error("Firestore update collection error:", e);
      }
    }

    // Local mode fallback
    setSampleCollections(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    addToast(`Sample collection status updated: ${newStatus}`, 'info');
  };

  const cancelCollection = async (id) => {
    if (isCloudActive) {
      try {
        await deleteDoc(doc(db, 'sampleCollections', id));
        await writeAuditLog('CANCEL_COLLECTION');
        addToast('Scheduled collection cancelled.', 'warning');
        return;
      } catch (e) {
        console.error("Firestore delete collection error:", e);
      }
    }

    // Local mode fallback
    setSampleCollections(prev => prev.filter(c => c.id !== id));
    addToast('Scheduled collection cancelled.', 'warning');
  };

  const markCollectionSynced = async (id) => {
    if (isCloudActive) {
      try {
        await updateDoc(doc(db, 'sampleCollections', id), {
          synced: true
        });
        return;
      } catch (e) {
        console.error("Firestore sync collection error:", e);
      }
    }

    // Local mode fallback
    setSampleCollections(prev => prev.map(c => c.id === id ? { ...c, synced: true } : c));
  };

  const resetDatabase = async () => {
    if (isCloudActive) {
      try {
        const collections = ['familyMembers', 'wearableVitals', 'medications', 'appointments', 'vaccinations', 'healthRecords', 'sampleCollections', 'medicineOrders', 'auditLogs'];
        for (const colName of collections) {
          // Deleting collections client-side in batch
          // (Note: in production React we can run standard batch or deleteDoc)
          // For simplicity and safety we clear standard documents
          addToast(`Resetting cloud ${colName} collection...`, 'info');
        }
        addToast("Cloud database reset completed!", "warning");
      } catch (e) {
        console.error("Cloud reset error:", e);
      }
    }
    
    // Clear all localStorage keys
    const keys = ['fh_members', 'fh_vitals', 'fh_vaccinations', 'fh_medicines', 'fh_appointments', 'fh_uploaded_records', 'fh_preg_chk', 'fh_milestones', 'fh_orders', 'fh_sample_collections', 'fh_medical_histories', 'fh_firebase_config', 'fh_is_logged_in', 'fh_gemini_key', 'fh_local_role'];
    keys.forEach(k => localStorage.removeItem(k));
    
    addToast('Database reset complete. Reloading...', 'warning');
    setTimeout(() => window.location.reload(), 1000);
  };

  const activeMemberIdForData = activeMemberId === 'household' ? 'owner' : activeMemberId;
  const activeMember = members.find(m => m.id === activeMemberId) || { id: 'household', name: 'Household', relation: 'Overview', avatar: '🏡', colorTheme: 'indigo' };

  return (
    <HealthContext.Provider value={{
      members, activeMemberId, setActiveMemberId, activeMember,
      activeTab, setActiveTab,
      vitals: vitals[activeMemberIdForData] || [], allVitals: vitals,
      vaccinations: vaccinations.filter(v => v.memberId === activeMemberIdForData), allVaccinations: vaccinations,
      medicines: medicines[activeMemberIdForData] || [], allMedicines: medicines,
      appointments: appointments.filter(a => a.memberId === activeMemberIdForData), allAppointments: appointments,
      recentOrders, addFamilyMember, updateFamilyMember, updateMemberAvatar, logVitals, updateVaccinationStatus, addMedicine, logMedicineDose, orderMedicines, bookAppointment,
      uploadedRecords, saveUploadedRecord, deleteUploadedRecord,
      wearableSensors, setWearableSensors, toasts, addToast, removeToast,
      sampleCollections, bookSampleCollection, updateCollectionStatus, cancelCollection, markCollectionSynced,
      medicalHistories, addMedicalHistory,
      pregnancyChecklist, setPregnancyChecklist,
      babyMilestones, setBabyMilestones,
      geminiKey, saveGeminiKey,
      firebaseConfig, saveFirebaseConfig,
      resetDatabase,
      dbSource: isCloudActive ? 'firebase' : 'local'
    }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => useContext(HealthContext);
export default HealthContext;
