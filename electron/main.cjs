const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const http = require("http");
const crypto = require("crypto");
const { URL } = require("url");

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
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

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
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID. Set env var or pass clientId.");
  }

  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events");

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://127.0.0.1`);
        if (reqUrl.pathname === "/callback") {
          const code = reqUrl.searchParams.get("code");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end('<html><body><h2>Authentication complete. You may close this window.</h2></body></html>');
          if (!code) {
            reject(new Error("No code in callback"));
            server.close();
            authWindow.close();
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
          resolve(tokenJson);
          server.close();
          authWindow.close();
        } else {
          res.writeHead(404);
          res.end();
        }
      } catch (err) {
        reject(err);
        try { server.close(); } catch(e){}
        try { authWindow.close(); } catch(e){}
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}/callback`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

      const authWindow = new BrowserWindow({
        width: 600,
        height: 800,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });
      authWindow.loadURL(authUrl);
    });
  });
});

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
