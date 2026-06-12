import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import ProfileSelectionPrompt from '../components/ProfileSelectionPrompt';
import Icon from '../components/Icon';

export function RemindersTab() {
  const {
    activeMember,
    activeMemberId,
    medicines,
    logMedicineDose,
    orderMedicines,
    vaccinations,
    updateVaccinationStatus,
    geminiKey
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
Provide accurate, medically sound, and authenticated information. Focus strictly on answering the question (e.g. generic alternatives, drug class, standard uses, side effects, or drug interactions).
If the question is unrelated or if you do not have verified medical information for this specific query, you MUST reply with exactly: "No info". Keep the response concise, max 3 sentences.`;

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
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '12px', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
        <button onClick={() => setSubTab('medicines')} style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', background: subTab === 'medicines' ? 'var(--color-primary)' : 'none', color: subTab === 'medicines' ? '#fff' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Medicines</button>
        <button onClick={() => setSubTab('vaccinations')} style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', background: subTab === 'vaccinations' ? 'var(--color-primary)' : 'none', color: subTab === 'vaccinations' ? '#fff' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Vaccinations</button>
      </div>

      {subTab === 'medicines' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', margin: 0, textAlign: 'left' }}>Medication Schedule ({activeMember.name})</h3>
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
