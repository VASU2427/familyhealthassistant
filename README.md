<<<<<<< HEAD
# 🩺 Family Health Assistant

A premium, serverless, mobile-optimized Progressive Web App (PWA) designed to track, analyze, and manage family health records, medication schedules, and wearable vitals. Powered by real-time client-side requests to the **openFDA Database** and **Google Gemini AI**.

---

## 🚀 Key Features

*   **📄 AI Lab Report Scanner**: Automatically parse and extract medical metrics (blood pressure, glucose, SpO2, HbA1c, TSH, lipid panels, etc.) and report dates from uploaded PDF or image files.
*   **💊 Medicine Info Drawer**: Fetch official generic names, brand alternatives, and FDA indications directly from the US FDA Database.
*   **💬 Search-Grounded Q&A**: Ask detailed, natural-language questions about medicines, powered by Gemini 2.5/2.0 Flash and Google Search Grounding.
*   **👨‍👩‍👧‍👦 Family Profile Center**: Track profiles (including owner, grandfather, grandmother, children, etc.) with automated age-calculations and blood-group badges.
*   **🏡 Command Center Overview**: High-level telemetry of the entire household's recent vitals, schedules, and active alerts.
*   **⌚ Wearables Emulator**: Sync mock heart rate, oxygen levels, and body temperatures to simulate wearable telemetry.

---

## 🛠️ Architecture

*   **Frontend**: HTML5, Vanilla CSS (Mobile-first responsive glassmorphic design), React (via Babel Standalone UMD).
*   **Database**: Client-side `localStorage` (100% serverless, zero database setup required).
*   **APIs**:
    *   **openFDA API**: Direct GET requests (`api.fda.gov`) for drug labeling records (no API key required).
    *   **Gemini Developer API**: POST requests (`generativelanguage.googleapis.com`) with Google Search Grounding.

---

## 📦 Deployment Options

Since this is a fully static client-side application, you can deploy it to any static web host in seconds. No compilation or build steps are required.

### Option A: Netlify (Recommended - Easiest)
1. Go to [Netlify](https://www.netlify.com/) and log in.
2. Drag and drop the `family-health-assistant-standalone` folder directly into the Netlify dashboard upload area.
3. Your app is live! Netlify will provide a secure HTTPS link.

### Option B: Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` inside the `family-health-assistant-standalone` folder.
3. Follow the CLI prompt to deploy instantly.

### Option C: GitHub Pages
1. Push this folder to a new GitHub repository.
2. Go to **Settings** > **Pages** in your repository.
3. Select the `main` branch as the source and click **Save**.

---

## 🔒 Configuration

*   **API Key**: Users can securely paste their Gemini API Key directly inside the app's **Settings Gear Modal** (top-right of the dashboard). The key is saved locally in the browser's encrypted storage and never sent to any third-party server other than Google's official Gemini endpoint.
=======
# familyhealthassistant
Family Health Assistant
>>>>>>> 702f67442d36f4bb9015b2ac1eedd77f20ae2972
