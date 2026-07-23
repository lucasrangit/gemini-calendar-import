# Berlin Events Calendar Importer (clasp version)

A reliable, intelligent Google Apps Script Web Application that parses event webpages or pasted text using Gemini and creates calendar events in Google Calendar. It replaces the unreliable Gemini Gem with a direct API-backed, custom-styled single-page dashboard.

---

## Features

1. **Intelligent Gemini Parsing**: Uses the `gemini-2.5-flash` model to accurately extract title, location, dates, times, and registration info.
2. **CORS-Free URL Scraping**: Uses Apps Script's backend environment (`UrlFetchApp`) to fetch HTML pages directly, falling back gracefully to manual text pasting if blocked.
3. **Interactive UI Preview**: Displays a beautiful dark-mode preview where you can verify or edit extracted details *before* committing them to Google Calendar.
4. **Timezone Aware**: Focuses automatically on Europe/Berlin timezone, but allows customization.
5. **Smart Splitter**: Splits multi-day events into individual daily calendar items and schedules repeating events automatically.
6. **Ticket Reminder**: Creates a secondary "BOOKING:" reminder task with a 5-minute notification alert precisely when registration opens.
7. **Robust Error Handling**: If calendar writing fails, the UI shows a detailed diagnostic log, provides instant **Google Calendar template links**, and generates a downloadable **.ics file** for manual importing.

---

## Local Development & Setup

This repository is set up with **clasp** (Google Command Line Apps Script Projects) for local editing.

### Step 1: Install Dependencies
Install Node.js dependencies (which includes `@google/clasp` as a development dependency):
```bash
npm install
```

### Step 2: Enable Google Apps Script API
Before using clasp, you must enable the Google Apps Script API in your Google account settings:
1. Visit [script.google.com/home/settings](https://script.google.com/home/settings).
2. Toggle the **Google Apps Script API** switch to **ON**.

### Step 3: Login to Clasp
Authenticate clasp with your Google Account:
```bash
npm run login
```
This will open a browser window requesting authorization to manage your Apps Script projects.

### Step 4: Link or Create an Apps Script Project

#### Option A: Create a New Project
Run clasp to create a new script project:
```bash
npx clasp create --title "Berlin Events Importer" --type webapp
```
*Note: This will create a new script on your Google Drive and automatically update `.clasp.json` with the new project's `scriptId`.*

#### Option B: Link an Existing Project
If you already created a script project on [script.google.com](https://script.google.com):
1. Copy the Script ID from the script's **Project Settings** (gear icon in the left menu).
2. Open `.clasp.json` and paste your Script ID:
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": "./src"
   }
   ```

### Step 5: Push Local Code to Apps Script
Deploy your local files (`Code.js`, `Index.html`, `appsscript.json`) to the Google Cloud server:
```bash
npm run push
```

---

## Google Cloud & Apps Script Configuration

### 1. Set Gemini API Key
To parse webpages, you need a free Gemini API key:
1. Go to [Google AI Studio](https://aistudio.google.com/) and click **Get API Key**.
2. Go to your Apps Script project at [script.google.com](https://script.google.com).
3. Click the **Project Settings** (gear icon) on the left panel.
4. Scroll down to **Script Properties** and click **Add script property**.
5. Add a property with:
   - **Property**: `GEMINI_API_KEY`
   - **Value**: *[Your Gemini API Key]*
6. Click **Save script properties**.

### 2. Configure Calendar ID
By default, the Web App will scan for a calendar named **'Berlin Events'** or match the target calendar ID (`c060eb28aba7b470247720172698de5db4429ee801628553bf96547a4eec17f6@group.calendar.google.com`). 
If you want to use a different secondary calendar:
1. Open [Google Calendar](https://calendar.google.com).
2. Go to Calendar Settings -> Integrate Calendar and copy the **Calendar ID**.
3. The UI will automatically let you choose any of your calendars from a dropdown, but you can hardcode the default in `src/Index.html` line 440 or 441.

---

## Deploy & Run Web Application

To get the URL to access your importer:
1. In your Apps Script editor, click **Deploy** -> **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Set the configuration:
   - **Description**: Initial Release
   - **Execute as**: **Me (your_email@gmail.com)** *(This guarantees the script can write to your secondary calendar even if accessed from other devices/locations)*
   - **Who has access**: **Only myself** (or **Anyone** if you want to access it from other devices easily without re-authenticating).
4. Click **Deploy**.
5. Copy the **Web App URL** provided (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

Bookmark this URL in your browser for easy calendar importing!

---

## Troubleshooting

- **Permissions Error (OAuth)**: When you visit the Web App for the first time, you will see an "Authorization Required" screen. Click **Continue**, then click **Advanced** (bottom left), and select **Go to Berlin Events Importer (unsafe)**. Google flags custom scripts as "unsafe" because they aren't verified by Google security reviewers, but it is completely safe since you own and control the code.
- **Web App showing old code**: Apps Script caches web apps. When deploying changes, make sure to create a **New Deployment** (or use the "Developer metadata" link under Deployments to test in real-time).
- **Gemini API Key missing**: Double-check that your script property `GEMINI_API_KEY` is spelled exactly as shown.
