// Google Identity Services (GIS) token flow — browser only, no server.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/drive.file";

let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;

function waitForGis(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const t = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(t);
        resolve();
      }
    }, 100);
  });
}

export async function initTokenClient(
  onToken: (token: string | null, error?: string) => void,
): Promise<void> {
  await waitForGis();
  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (resp: TokenResponse) => {
      if (resp.error) return onToken(null, resp.error);
      accessToken = resp.access_token;
      onToken(accessToken);
    },
  });
}

// Must fire from a real user click (popup blocker).
export function requestToken(): void {
  if (!tokenClient) throw new Error("Call initTokenClient first");
  tokenClient.requestAccessToken();
}

export function getToken(): string | null {
  return accessToken;
}
