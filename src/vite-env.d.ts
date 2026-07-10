/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Minimal Google Identity Services typings for the token flow.
interface TokenResponse {
  access_token: string;
  error?: string;
  expires_in?: number;
}
interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}
interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (cfg: {
          client_id: string;
          scope: string;
          callback: (resp: TokenResponse) => void;
        }) => TokenClient;
      };
    };
  };
}
