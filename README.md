# A-Wolf

Application React + Vite pour gestion de tâches, calendrier et collaboration en temps réel.

## Run Locally

**Prerequisites:** Node.js et un serveur PostgreSQL actif

1. Install dependencies:
   `npm install`
2. Set `DATABASE_URL` in `.env` ou dans votre environnement, par exemple :
   `postgresql://user:password@localhost:5432/awolf`
3. Si vous utilisez l’API Google Calendar côté serveur, ajoutez également :
   `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
4. Initialisez le schéma PostgreSQL :
   `npm run db:init`
5. Lancer l'application :
   `npm run dev`

6. Pour lancer la version desktop Electron, ouvrez un second terminal et exécutez :
   `npm run electron:dev`

7. Vérifiez que votre projet Firebase est configuré et que `firebase-applet-config.json` contient les bons paramètres de projet. Le login Google s’appuie sur Firebase Auth et des scopes Google Calendar.

6. Ouvrez l'URL de développement locale affichée dans le terminal si nécessaire.
