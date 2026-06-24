# A-Wolf - Collaborative Academic & Personal Productivity Platform

A-Wolf is a modern, high-fidelity desktop workspace application designed for students and professionals. Built with **Electron, React, Vite, and TypeScript**, it combines calendars, tasks, collaborative groups, bloc-notes, and a Pomodoro focus zone into a unified desktop workspace. 

---

## 🌟 Key Features

### 🧑 User Profile & Identity
- **Dedicated Profile Workspace**: Accessible from the top header user dropdown.
- **Profile Photo Upload**: Drag-and-drop or select an image file to personalize your profile. Previews are generated immediately and stored locally.
- **Offline Fallback**: Automatic colorful avatar generation based on initials when no profile picture is selected.
- **Editable Student Credentials**: Update your full name, email address, and field of study anytime.
- **Academic Stats**: Visual gauges for tasks completed, scheduled classes, and saved resources.

### ⚙️ Workspace Settings
- **Account Control**: Quick links to profile modification, avatar color changes, and session logout.
- **Appearance Tweaks**: Toggle compact mode to reduce spacing and maximize screen workspace.
- **Notifications**: Control notification sounds, in-app alerts, and request OS-level desktop push notifications.
- **Data Management**: Export all your local data as a JSON file, clear notifications, or hard-reset the application (wiping local states).
- **App Information**: Access licensing details, stack components, and versioning.

### 📅 Emploi du Temps (Schedule)
- Dynamic grid scheduler to coordinate academic courses, project reviews, and personal events.
- Seamless integration with **Google Calendar** using OAuth 2.0 PKCE to display external schedules.

### 📝 Bloc-notes (Notepad)
- Notion-style structured documents to capture project briefs, problem definitions, solutions, and inline checkboxes.
- Star/Pin notes for quick navigation, category filters, and fast title/content search.

### ⏱️ Focus Zone (Pomodoro)
- Visual countdown timers with automated sound signals and notifications to help maintain deep work.
- Session logs to track productivity periods over time.

---

## 🛡️ Architecture & Security Specifications

A-Wolf enforces a strict security-first posture to safeguard user privacy and prevent data theft:

### 1. Data Isolation & Local Storage
- **No Unsolicited Cloud Sync**: Core user data (tasks, notes, reminders, focus sessions, and in-app messages) are stored locally in the user's environment.
- **Google OAuth Security**: Access tokens for Google Workspace integrations are fetched via Electron loopback redirect handlers using PKCE (Proof Key for Code Exchange).
- **Secure Keychain Storage**: Google OAuth tokens are stored in the OS-level credential vault (e.g., Windows Credential Manager or macOS Keychain) using `keytar`, preventing plain-text token exposure in local files.

### 2. Local Authentication Hardening
- **Salted & Peppered Hashing**: Local credentials stored in `localStorage` under `awolf_local_users` have their passwords hashed using **SHA-256** combined with a unique user-based cryptographic salt and a system-level pepper, neutralizing precomputation (rainbow table) attacks.
- **Electron WebPreferences**:
  - `contextIsolation: true` is strictly enforced to isolate the main process node environment from the renderer context.
  - `nodeIntegration: false` is active, neutralizing remote code execution (RCE) in the event of XSS.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **Git**

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/jeankazazmba/A-wolf.git
   cd A-wolf
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

### Running Locally
To launch the desktop application in development mode with hot reloading:

#### 1. Set Google OAuth Client ID (Optional, for Calendar integration)
On Windows PowerShell:
```powershell
$env:GOOGLE_OAUTH_CLIENT_ID="your_google_oauth_client_id"
```
On macOS/Linux:
```bash
export GOOGLE_OAUTH_CLIENT_ID="your_google_oauth_client_id"
```

#### 2. Launch Development Servers
```bash
npm run electron:dev
```
This boots the local Vite bundler and launches the Electron container.

---

## 📂 Project Structure

```
A-wolf/
├── electron/
│   ├── main.cjs         # Electron main process (window controls, loopback OAuth, keytar)
│   └── preload.cjs      # Secure contextBridge API definition
├── src/
│   ├── assets/          # Shared visual elements and brand logo
│   ├── components/      # React functional view layers:
│   │   ├── ProfileView.tsx    # User profile management with image upload
│   │   ├── SettingsView.tsx   # Workspace notification, sound, and data controls
│   │   ├── Navbar.tsx         # Top action navbar header
│   │   └── NavigationSidebar.tsx # Left collapsible navigation menu
│   ├── context/
│   │   └── CollabContext.tsx  # Central state management (local & offline backups)
│   ├── lib/
│   │   ├── googleAuth.ts      # Google Workspace credentials shim
│   │   └── localAuth.ts       # Secure local account validation with salt + pepper
│   ├── App.tsx          # Router canvas and workspace orchestrator
│   └── main.tsx         # DOM mounting entrypoint
├── firestore.rules      # Security rules mapping invariants for Firebase deployments
└── package.json         # Build pipelines and dependency registries
```

---

## 📄 License
This project is licensed under the [Apache-2.0 License](LICENSE.txt).
