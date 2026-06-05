# A-Wolf

Application React + Vite pour gestion de tâches, calendrier et collaboration en temps réel.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the desktop OAuth client ID for Google Calendar access:
   `export GOOGLE_OAUTH_CLIENT_ID="your_google_oauth_client_id"`
   or on Windows PowerShell:
   `$env:GOOGLE_OAUTH_CLIENT_ID="your_google_oauth_client_id"`
3. Start the desktop app:
   `npm run electron:dev`

This app now stores all internal data locally in the user environment. No Firebase/Firestore sync is used for tasks, notes, reminders, focus sessions or in-app collaboration state.

For Google Calendar integration, the app uses Electron OAuth PKCE and stores Google tokens securely using the OS keychain via `keytar`.

If you need the server component for other features, keep using `npm run dev` as before, but note that the desktop app itself does not send internal application data to external cloud storage.
