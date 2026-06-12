export function generateWhatsAppShareString(record) {
  if (!record) return "";
  let markdown = `*Health Record Summary*\n`;
  markdown += `*Date:* ${record.IngestionDate || record.date || 'N/A'}\n\n`;

  if (record.diagnosis && record.diagnosis.length > 0) {
    markdown += `*Diagnosis:*\n`;
    record.diagnosis.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n`;
  }

  if (record.advice && record.advice.length > 0) {
    markdown += `*Advice:*\n`;
    record.advice.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n`;
  }

  if (record.medications && record.medications.length > 0) {
    markdown += `*Medications:*\n`;
    record.medications.forEach(med => {
      const details = [
        med.dosage ? `Dosage: ${med.dosage}` : '',
        med.frequency ? `Freq: ${med.frequency}` : '',
        med.route ? `Route: ${med.route}` : '',
        med.duration ? `Duration: ${med.duration}` : ''
      ].filter(Boolean).join(', ');
      markdown += `- *${med.name}*${details ? ` (${details})` : ''}\n`;
    });
    markdown += `\n`;
  }

  if (record.tests && record.tests.length > 0) {
    markdown += `*Prescribed Tests:*\n`;
    record.tests.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n`;
  }

  if (record.vitals) {
    const v = record.vitals;
    const lines = [];
    if (v.bpSystolic && v.bpDiastolic) lines.push(`BP: ${v.bpSystolic}/${v.bpDiastolic} mmHg`);
    if (v.glucose) lines.push(`Glucose: ${v.glucose} mg/dL`);
    if (v.hba1c) lines.push(`HbA1c: ${v.hba1c}%`);
    if (v.tsh) lines.push(`TSH: ${v.tsh} uIU/mL`);
    if (v.cholesterol) lines.push(`Cholesterol: ${v.cholesterol} mg/dL`);
    if (v.ldl) lines.push(`LDL: ${v.ldl} mg/dL`);
    if (v.hdl) lines.push(`HDL: ${v.hdl} mg/dL`);
    if (v.triglycerides) lines.push(`Triglycerides: ${v.triglycerides} mg/dL`);
    if (v.creatinine) lines.push(`Creatinine: ${v.creatinine} mg/dL`);
    if (v.hemoglobin) lines.push(`Hemoglobin: ${v.hemoglobin} g/dL`);
    if (v.temperature) lines.push(`Temp: ${v.temperature}°F`);
    if (v.weight) lines.push(`Weight: ${v.weight} kg`);

    if (lines.length > 0) {
      markdown += `*Vitals & Metrics:*\n`;
      lines.forEach(line => {
        markdown += `- ${line}\n`;
      });
      markdown += `\n`;
    }
  }

  return markdown.trim();
}
