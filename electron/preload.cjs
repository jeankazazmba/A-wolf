const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  // Google OAuth
  startGoogleOAuth: (clientId) => ipcRenderer.invoke("oauth:google", clientId),
  getGoogleAuthPayload: () => ipcRenderer.invoke("secure-store:get-google-auth"),
  setGoogleAuthPayload: (payload) => ipcRenderer.invoke("secure-store:set-google-auth", payload),
  deleteGoogleAuthPayload: () => ipcRenderer.invoke("secure-store:delete-google-auth"),
  // Custom window controls (used by TitleBar)
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  maximizeWindow: () => ipcRenderer.send("window:maximize"),
  closeWindow: () => ipcRenderer.send("window:close"),
});
