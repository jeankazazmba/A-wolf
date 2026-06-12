const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const http = require("http");
const crypto = require("crypto");
const { URL } = require("url");
const keytar = require("keytar");

const GOOGLE_AUTH_SERVICE = "awolf-google-calendar";
const GOOGLE_AUTH_ACCOUNT = "google_oauth";

function base64URLEncode(str) {
  return str.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: "A-Wolf",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove default menu bar for a cleaner app look
  Menu.setApplicationMenu(null);

  const url = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "..", "dist", "index.html")}`;

  mainWindow.loadURL(url);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

// Handle Google OAuth PKCE flow via local loopback
ipcMain.handle("oauth:google", async (event, _clientId) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || _clientId;
  if (!clientId) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID. Please configure your Google OAuth Client ID.");
  }

  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");

  return new Promise((resolve, reject) => {
    // authWindow must be declared here so it's in scope for all callbacks
    let authWindow = null;

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://127.0.0.1`);
        if (reqUrl.pathname === "/callback") {
          const code = reqUrl.searchParams.get("code");
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end('<html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>✅ Authentification réussie</h2><p>Vous pouvez fermer cette fenêtre et retourner dans A-Wolf.</p></body></html>');
          server.close();
          if (authWindow && !authWindow.isDestroyed()) authWindow.close();

          if (!code) {
            reject(new Error("No code in callback"));
            return;
          }

          // Exchange code for tokens
          const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              redirect_uri: `http://127.0.0.1:${server.address().port}/callback`,
              grant_type: "authorization_code",
              code_verifier: codeVerifier,
            }).toString(),
          });

          const tokenJson = await tokenResp.json();
          if (tokenJson.error) {
            reject(new Error(`OAuth token error: ${tokenJson.error_description || tokenJson.error}`));
            return;
          }
          resolve(tokenJson);
        } else {
          res.writeHead(404);
          res.end();
        }
      } catch (err) {
        reject(err);
        try { server.close(); } catch(e){}
        if (authWindow && !authWindow.isDestroyed()) {
          try { authWindow.close(); } catch(e){}
        }
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}/callback`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

      authWindow = new BrowserWindow({
        width: 600,
        height: 800,
        title: "Connexion Google — A-Wolf",
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });
      authWindow.loadURL(authUrl);

      // Handle user closing the auth window without completing auth
      authWindow.on("closed", () => {
        authWindow = null;
        try { server.close(); } catch(e){}
        reject(new Error("Fenêtre d'authentification fermée par l'utilisateur."));
      });
    });
  });
});

ipcMain.handle("secure-store:set-google-auth", async (event, payload) => {
  if (!payload) return null;
  const value = typeof payload === "string" ? payload : JSON.stringify(payload);
  await keytar.setPassword(GOOGLE_AUTH_SERVICE, GOOGLE_AUTH_ACCOUNT, value);
  return true;
});

ipcMain.handle("secure-store:get-google-auth", async () => {
  const value = await keytar.getPassword(GOOGLE_AUTH_SERVICE, GOOGLE_AUTH_ACCOUNT);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
});

ipcMain.handle("secure-store:delete-google-auth", async () => {
  return await keytar.deletePassword(GOOGLE_AUTH_SERVICE, GOOGLE_AUTH_ACCOUNT);
});

app.setName("A-Wolf");
// Required for Windows notifications and taskbar pinning
if (process.platform === "win32") {
  app.setAppUserModelId("com.awolf.app");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
