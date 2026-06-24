/// <reference types="vite/client" />

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      startGoogleOAuth: (clientId: string) => Promise<any>;
      getGoogleAuthPayload: () => Promise<any>;
      setGoogleAuthPayload: (payload: any) => Promise<any>;
      deleteGoogleAuthPayload: () => Promise<any>;
      getGoogleOAuthClientId: () => string | null;
      minimizeWindow?: () => void;
      maximizeWindow?: () => void;
      closeWindow?: () => void;
    };
  }
}

declare module "*.svg" {
  const value: string;
  export default value;
}
