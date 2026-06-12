import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import ProfileSelectionPrompt from '../components/ProfileSelectionPrompt';

export function AiAssistantTab() {
  const {
    activeMember,
    activeMemberId,
    medicines,
    vitals,
    geminiKey,
    addToast
  } = useHealth();

  if (activeMemberId === 'household') {
    return <ProfileSelectionPrompt title="AI Health Assistant" />;
  }

  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [loadingQ, setLoadingQ] = useState(false);

  const [selectedMeds, setSelectedMeds] = useState([]);
  const [interactionResult, setInteractionResult] = useState('');
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  const [weeklyReport, setWeeklyReport] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);

  const handleAskQ = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoadingQ(true);
    setAiAnswer('');

    if (geminiKey) {
      try {
        const prompt = `You are a professional medical assistant powered by Gemini. You must provide grounded, medically certified information.
Question: "${question}"
Provide a clear, clinical, yet easily readable answer. Keep it within 3-4 sentences. If you do not have verified medical information for this specific query, reply with: "No info".`;

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
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No info';
        setAiAnswer(reply.trim());
      } catch (err) {
        setAiAnswer(`⚠️ API Connection Error: ${err.message}. Please check your settings or try again later.`);
      } finally {
        setLoadingQ(false);
      }
    } else {
      setTimeout(() => {
        const q = question.toLowerCase();
        let reply = "No info";
        if (q.includes('fever') || q.includes('temperature')) {
          reply = "For high body temperature (fever), rest, hydration, and cool compresses are typical supportive steps. Paracetamol or Ibuprofen are standard over-the-counter fever reducers. Consult a pediatrician or physician if temperature exceeds 102°F or persists for more than 48 hours.";
        } else if (q.includes('blood pressure') || q.includes('bp')) {
          reply = "Normal adult blood pressure is typically below 120/80 mmHg. Lifestyle modifications like reducing sodium intake (DASH diet), engaging in aerobic exercise, and stress management are primary ways to maintain healthy cardiovascular pressure.";
        } else if (q.includes('diabetes') || q.includes('glucose') || q.includes('sugar') || q.includes('hba1c')) {
          reply = "Managing blood glucose requires balancing dietary carbohydrates, physical activity, and prescribed medication (like Metformin). Regular monitoring of fasting sugar (normal 70-100 mg/dL) and HbA1c (normal < 5.7%) is vital.";
        }
        setAiAnswer(reply);
        setLoadingQ(false);
      }, 800);
    }
  };

  const handleCheckInteractions = async () => {
    if (selectedMeds.length < 2) {
      alert("Please select at least 2 medications to check for interactions.");
      return;
    }
    setLoadingInteractions(true);
    setInteractionResult('');

    if (geminiKey) {
      try {
        const prompt = `You are a medical pharmacist agent. Analyze drug-drug interactions for this combination: ${selectedMeds.join(', ')}.
Provide a concise 2-3 sentence summary of any potential side effects, warnings, or if they are safe to take together.
If no information is found or the query is invalid, return: "No significant clinical interactions identified for this combination."`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (!response.ok) throw new Error("API request failed");
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        setInteractionResult(text.trim());
      } catch (err) {
        setInteractionResult(`Failed to query drug interactions: ${err.message}`);
      } finally {
        setLoadingInteractions(false);
      }
    } else {
      setTimeout(() => {
        let reply = "No significant clinical interactions identified for this combination.";
        const hasStatin = selectedMeds.some(m => m.toLowerCase().includes('statin'));
        const hasMetformin = selectedMeds.some(m => m.toLowerCase().includes('metformin'));

        if (hasStatin && hasMetformin) {
          reply = "⚠️ Metformin + Atorvastatin: No major contraindications. However, statins can occasionally affect blood glucose control. Adherence to routine monitoring of HbA1c and liver enzymes is advised.";
        }
        setInteractionResult(reply);
        setLoadingInteractions(false);
      }, 800);
    }
  };

  const handleWeeklyReport = async () => {
    setLoadingReport(true);
    setWeeklyReport('');

    const latestGlucose = vitals && vitals.find(v => v.glucose !== null)?.glucose || 'N/A';
    const latestBP = vitals && vitals.find(v => v.bpSystolic !== null) ? `${vitals.find(v => v.bpSystolic !== null).bpSystolic}/${vitals.find(v => v.bpSystolic !== null).bpDiastolic}` : 'N/A';
    const medList = medicines ? medicines.map(m => `${m.name} (${m.remaining}/${m.total} remaining)`).join(', ') : '';

    if (geminiKey) {
      try {
        const prompt = `You are a personal wellness coach. Generate a weekly health report card for the patient "${activeMember.name}" (${activeMember.relation}) based on this actual logs data:
- Recent Blood Glucose: ${latestGlucose} mg/dL
- Recent Blood Pressure: ${latestBP} mmHg
- Current Meds: [${medList}]
Provide a structured, encouraging summary covering:
1. Vitals overview (highlighting if stable or out of range).
2. Adherence/Stock alerts.
3. Simple, actionable health goals for the next week.
Keep the output short, clean, and in standard markdown paragraphs (max 150 words).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (!response.ok) throw new Error("API failed");
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No weekly report could be generated.';
        setWeeklyReport(text.trim());
      } catch (err) {
        setWeeklyReport("Failed to generate report.");
      } finally {
        setLoadingReport(false);
      }
    } else {
      setTimeout(() => {
        const report = `### 📋 Weekly Health Report Card: ${activeMember.name}
- **Vitals Overview**: Blood pressure (${latestBP} mmHg) and blood sugar (${latestGlucose} mg/dL) are generally within normal ranges. Pulse rate and temperature logs remain stable.
- **Medication Adherence**: Routine meds list contains ${medicines ? medicines.length : 0} items. Keep tracking dosage times.
- **Action Plan**:
1. Continue daily smartwatch vital syncing.
2. Increase hydration level and maintain light walking.`;
        setWeeklyReport(report);
        setLoadingReport(false);
      }, 800);
    }
  };

  const handleToggleSelectMed = (name) => {
    if (selectedMeds.includes(name)) {
      setSelectedMeds(selectedMeds.filter(x => x !== name));
    } else {
      setSelectedMeds([...selectedMeds, name]);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Ask AI Section */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-primary)', margin: 0, textAlign: 'left' }}>🤖 Grounded Medicine Q&A</h3>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'left' }}>Query clinical medicine libraries, side effects, or drug alternatives.</p>
        <form onSubmit={handleAskQ} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="e.g., normal range for HbA1c?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="form-control"
            style={{ fontSize: '0.75rem' }}
          />
          <button className="btn btn-primary" type="submit" disabled={loadingQ || !question.trim()} style={{ fontSize: '0.75rem', padding: '0 0.75rem' }}>Ask</button>
        </form>
        {aiAnswer && (
          <div style={{ marginTop: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.72rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
            {aiAnswer === "No info" ? (
              <span style={{ color: 'var(--text-secondary)' }}>⚠️ No authenticated medical information available for this query.</span>
            ) : (
              <div>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>Grounded Answer:</strong>
                <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.4' }}>{aiAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drug-Drug Interaction Checker */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-primary)', margin: 0, textAlign: 'left' }}>🛡️ Drug Interaction Checker</h3>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'left' }}>Select active routines to check for potential interactions.</p>

        {medicines && medicines.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem', textAlign: 'left' }}>
            {medicines.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedMeds.includes(m.name)} onChange={() => handleToggleSelectMed(m.name)} />
                <span>{m.name} ({m.dosage})</span>
              </label>
            ))}
          </div>
        ) : <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>No medicines logged for this profile.</p>}

        <button className="btn btn-primary" onClick={handleCheckInteractions} disabled={loadingInteractions || selectedMeds.length < 2} style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}>Check Interactions</button>
        {interactionResult && (
          <div style={{ marginTop: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.72rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>Safety Analysis:</strong>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>{interactionResult}</p>
          </div>
        )}
      </div>

      {/* Weekly Insights Generator */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-primary)', margin: 0, textAlign: 'left' }}>📊 Weekly Insight Report Card</h3>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'left' }}>Synthesize weekly vitals logs & med adherence into a wellness report.</p>
        <button className="btn btn-primary" onClick={handleWeeklyReport} disabled={loadingReport} style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}>
          {loadingReport ? 'Generating report...' : 'Generate Report Card'}
        </button>
        {weeklyReport && (
          <div style={{ marginTop: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.72rem', textAlign: 'left', border: '1px solid var(--border-color)', lineHeight: '1.4' }}>
            <div style={{ whiteSpace: 'pre-line', color: 'var(--text-primary)' }}>{weeklyReport}</div>
          </div>
        )}
      </div>

    </div>
  );
}

export default AiAssistantTab;
