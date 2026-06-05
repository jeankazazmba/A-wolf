const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  startGoogleOAuth: (clientId) => ipcRenderer.invoke("oauth:google", clientId),
});
