import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HealthProvider, useHealth } from './context/HealthContext';
import { renderAvatar, themeColors } from './components/MemberAvatar';
import { compressAvatar } from './utils/image';
import Icon from './components/Icon';
import Login from './components/Login';
import ToastsStack from './components/ToastsStack';
import PresentationConsole from './components/PresentationConsole';

// Tab components
import DashboardTab from './tabs/DashboardTab';
import TrackVitalsTab from './tabs/TrackVitalsTab';
import HealthRecordsTab from './tabs/HealthRecordsTab';
import RemindersTab from './tabs/RemindersTab';
import AiAssistantTab from './tabs/AiAssistantTab';
import MemberProfileManager from './tabs/MemberProfileManager';
import TeleConsultation from './tabs/TeleConsultation';

function AppContent() {
  const { currentUser } = useAuth();
  const isLoggedIn = !!currentUser;

  const { 
    activeTab, 
    setActiveTab, 
    geminiKey, 
    saveGeminiKey,
    activeMember,
    activeMemberId,
    setActiveMemberId,
    updateMemberAvatar,
    members,
    firebaseConfig,
    saveFirebaseConfig
  } = useHealth();
  
  const owner = members.find(m => m.id === 'owner') || members[0] || { name: 'Srinivas' };
  
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiKey || '');
  const [testingKey, setTestingKey] = useState(false);
  const [currentTime, setCurrentTime] = useState('14:12');

  const [fbApiKey, setFbApiKey] = useState(firebaseConfig?.apiKey || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(firebaseConfig?.authDomain || '');
  const [fbProjectId, setFbProjectId] = useState(firebaseConfig?.projectId || '');
  const [fbStorageBucket, setFbStorageBucket] = useState(firebaseConfig?.storageBucket || '');
  const [fbAppId, setFbAppId] = useState(firebaseConfig?.appId || '');

  useEffect(() => {
    setFbApiKey(firebaseConfig?.apiKey || '');
    setFbAuthDomain(firebaseConfig?.authDomain || '');
    setFbProjectId(firebaseConfig?.projectId || '');
    setFbStorageBucket(firebaseConfig?.storageBucket || '');
    setFbAppId(firebaseConfig?.appId || '');
  }, [firebaseConfig]);

  useEffect(() => {
    setApiKeyInput(geminiKey || '');
  }, [geminiKey]);

  useEffect(() => {
    const theme = activeMember?.colorTheme || 'teal';
    const colors = themeColors[theme] || themeColors.teal;
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-light', colors.primaryLight);
    document.documentElement.style.setProperty('--border-focus', colors.borderFocus);
  }, [activeMember]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      alert("Please enter an API Key first.");
      return;
    }
    setTestingKey(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeyInput.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        alert(`API Test Failed: ${data.error?.message || res.statusText}\n(Ensure Generative Language API is enabled for this key)`);
        return;
      }
      if (data.models && data.models.length > 0) {
        const names = data.models.map(m => m.name.replace('models/', '')).filter(n => n.includes('flash') || n.includes('pro'));
        alert(`✅ API Key is Valid!\nAvailable Models:\n${names.slice(0, 8).join('\n')}`);
      } else {
        alert("API Key is Valid, but no generative models were returned for this project.");
      }
    } catch (e) {
      alert(`Network Error: ${e.message}`);
    } finally {
      setTestingKey(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="phone-frame">
        <Login onLoginSuccess={() => setActiveMemberId('household')} />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <DashboardTab />;
      case 'track': 
        return <TrackVitalsTab />;
      case 'records': 
        return <HealthRecordsTab />;
      case 'remind': 
        return <RemindersTab />;
      case 'ai': 
        return <AiAssistantTab />;
      case 'profiles': 
        return <MemberProfileManager />;
      case 'teleconsult': 
        return <TeleConsultation />;
      default: 
        return <DashboardTab />;
    }
  };

  return (
    <div className="phone-frame">
      {/* Dynamic Island notch mock */}
      <div className="phone-notch"></div>

      {/* Unified Phone top status indicators & merged Header */}
      <div className="status-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '48px', padding: '14px 16px 0 16px', background: 'var(--color-primary)', color: '#ffffff', zIndex: 999, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>{currentTime}</span>
          <span style={{ fontSize: '0.72rem' }}>📶</span>
        </div>

        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '-0.015em', fontWeight: 'bold' }}>FamilyHealth</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
          <span>5G</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Profile Identifier Banner */}
      <div style={{
        padding: '0.85rem 1rem',
        background: activeMemberId === 'household' 
          ? 'var(--bg-secondary)' 
          : `linear-gradient(135deg, ${themeColors[activeMember?.colorTheme || 'teal']?.primaryLight || 'var(--color-primary-light)'} 0%, var(--bg-secondary) 100%)`,
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ 
              position: 'relative', 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: `2px solid ${
                activeMemberId === 'household'
                  ? 'var(--color-primary)'
                  : themeColors[activeMember?.colorTheme || 'teal']?.primary || 'var(--color-primary)'
              }`, 
              flexShrink: 0, 
              boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
              cursor: activeMemberId !== 'household' ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (activeMemberId !== 'household') {
                document.getElementById('header-avatar-input').click();
              }
            }}
            title={activeMemberId !== 'household' ? "Change profile picture" : ""}
          >
            {renderAvatar(activeMember, '100%')}
            {activeMemberId !== 'household' && (
              <span style={{ position: 'absolute', bottom: 0, right: 0, fontSize: '0.4rem', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '2px', lineHeight: 1 }}>📷</span>
            )}
          </div>
          
          {activeMemberId !== 'household' && (
            <input 
              type="file" 
              id="header-avatar-input" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    const base64 = await compressAvatar(file);
                    updateMemberAvatar(activeMemberId, base64);
                  } catch (err) {
                    console.error("Error setting avatar:", err);
                  }
                }
              }}
            />
          )}

          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {activeMemberId === 'household' 
                ? `${owner.name} Family` 
                : activeMember?.name
              }
              {activeMemberId !== 'household' && (
                <span className="alert-badge success" style={{ fontSize: '0.52rem', padding: '0.05rem 0.25rem', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '0.25rem' }}>
                  Active
                </span>
              )}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {activeMemberId === 'household' 
                  ? `${members.length} Family Members`
                  : `${activeMember?.age ? `${activeMember.age} yrs` : 'Baby'} • ${activeMember?.gender || 'Unknown'}`
                }
              </span>
              {activeMemberId !== 'household' && (
                <span className="alert-badge" style={{ fontSize: '0.52rem', padding: '0.02rem 0.25rem', borderRadius: '4px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  {activeMember?.relation}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {activeMemberId !== 'household' && activeMember?.bloodGroup && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              padding: '0.2rem 0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }} title="Blood Group">
              <span style={{ fontSize: '0.6rem' }}>🩸</span>
              <strong style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: '800' }}>{activeMember.bloodGroup}</strong>
            </div>
          )}

          <button 
            className="btn-icon" 
            onClick={() => setShowSettings(true)} 
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem' }}
            title="AI Configuration Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main scroll wrapper */}
      <div className="phone-scroll-area">
        {renderTab()}
      </div>

      {/* Translucent bottom tabs bar */}
      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setActiveMemberId('household'); }}>
          <Icon name="dashboard" size={20} />
          <span>Home</span>
        </button>
        <button className={`nav-item ${activeTab === 'track' ? 'active' : ''}`} onClick={() => setActiveTab('track')}>
          <Icon name="activity" size={20} />
          <span>Track</span>
        </button>
        <button className={`nav-item ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
          <Icon name="file" size={20} />
          <span>Records</span>
        </button>
        <button className={`nav-item ${activeTab === 'remind' ? 'active' : ''}`} onClick={() => setActiveTab('remind')}>
          <Icon name="bell" size={20} />
          <span>Remind</span>
        </button>
        <button className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          <Icon name="helpCircle" size={20} />
          <span>AI</span>
        </button>
      </div>

      {/* Settings Modal (Slide-up sheet format) */}
      {showSettings && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Configuration Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>×</button>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginBottom: '0.5rem', marginTop: '0.5rem' }}>AI Scanner & Q&A</h4>
              <div className="form-group">
                <label>Gemini API Key</label>
                <input type="password" className="form-control" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="AIzaSy..." />
              </div>
              
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '1rem', marginBottom: '0.5rem' }}>Firebase Cloud Sync (Optional)</h4>
              <div className="form-group">
                <label>Firebase API Key</label>
                <input type="password" className="form-control" value={fbApiKey} onChange={e => setFbApiKey(e.target.value)} placeholder="AIzaSy..." />
              </div>
              <div className="form-group">
                <label>Firebase Project ID</label>
                <input type="text" className="form-control" value={fbProjectId} onChange={e => setFbProjectId(e.target.value)} placeholder="family-health-..." />
              </div>
              <div className="form-group">
                <label>Firebase Auth Domain</label>
                <input type="text" className="form-control" value={fbAuthDomain} onChange={e => setFbAuthDomain(e.target.value)} placeholder="family-health-....firebaseapp.com" />
              </div>
              <div className="form-group">
                <label>Firebase Storage Bucket</label>
                <input type="text" className="form-control" value={fbStorageBucket} onChange={e => setFbStorageBucket(e.target.value)} placeholder="family-health-....appspot.com" />
              </div>
              <div className="form-group">
                <label>Firebase App ID</label>
                <input type="text" className="form-control" value={fbAppId} onChange={e => setFbAppId(e.target.value)} placeholder="1:1234:web:abcd..." />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', marginTop: '1.25rem' }}>
                <button className="btn btn-secondary" onClick={handleTestKey} disabled={testingKey} style={{ flex: 1, margin: 0, height: '38px', fontSize: '0.75rem' }}>
                  {testingKey ? 'Testing...' : 'Test AI Key'}
                </button>
                <button className="btn btn-primary" onClick={() => {
                  saveGeminiKey(apiKeyInput.trim());
                  saveFirebaseConfig({
                    apiKey: fbApiKey.trim(),
                    authDomain: fbAuthDomain.trim(),
                    projectId: fbProjectId.trim(),
                    storageBucket: fbStorageBucket.trim(),
                    appId: fbAppId.trim()
                  });
                  setShowSettings(false);
                }} style={{ flex: 1, margin: 0, height: '38px', fontSize: '0.75rem' }}>
                  Save Settings
                </button>
              </div>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)} style={{ width: '100%', height: '38px', fontSize: '0.75rem' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <HealthProvider>
        <AppContent />
        <ToastsStack />
        <PresentationConsole />
      </HealthProvider>
    </AuthProvider>
  );
}

export default App;
