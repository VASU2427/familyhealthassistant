export const testGeminiKey = async (apiKey) => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || res.statusText);
  }
  return data.models;
};

export const runOCR = async (apiKey, base64Image, language = 'English') => {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const ocrPrompt = `
You are a highly advanced Clinical Medical OCR parser. Extract parameters from the uploaded medical record image.
Perform parsing with strict accuracy. The text is in ${language}.
Output the results strictly as a JSON object matching this schema:
{
  "date": "YYYY-MM-DD",
  "notes": "Brief clinical context summary",
  "diagnosis": ["Diagnostic terms identified"],
  "advice": ["Clinical recommendations, follow-ups"],
  "medications": [
    { "name": "Drug name", "dosage": "e.g. 500mg", "frequency": "e.g. twice daily", "route": "e.g. oral", "duration": "e.g. 5 days" }
  ],
  "tests": ["Prescribed laboratory tests"],
  "vitals": {
    "bpSystolic": number or null,
    "bpDiastolic": number or null,
    "glucose": number or null,
    "hba1c": number or null,
    "tsh": number or null,
    "cholesterol": number or null,
    "ldl": number or null,
    "hdl": number or null,
    "triglycerides": number or null,
    "hemoglobin": number or null,
    "creatinine": number or null,
    "weight": number or null,
    "heartRate": number or null,
    "oxygen": number or null,
    "temperature": number or null
  }
}
`;

  // Parse mime type from base64
  const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : 'image/jpeg';
  const rawData = matches ? matches[2] : base64Image;

  const payload = {
    contents: [
      {
        parts: [
          { text: ocrPrompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: rawData
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.0
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini OCR failed");
  }

  const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(textResult);
};

export const runQA = async (apiKey, query, clinicalContext) => {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = `
You are a family health assistant. Use the following medical history records to ground your answers.
Only provide medically safe, verified suggestions. Always instruct the user to consult their primary physician in emergency cases.
Context:
${JSON.stringify(clinicalContext)}
`;

  const payload = {
    contents: [
      {
        parts: [
          { text: query }
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    tools: [
      { googleSearch: {} }
    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini QA failed");
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
};
