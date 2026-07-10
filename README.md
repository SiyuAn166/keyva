# Keyva

Serverless personal credential manager. React + TypeScript + Vite + Tailwind v4, hosted on GitHub Pages, encrypted vault synced through Google Drive (keyva/vault.json). All encryption is on-device; only ciphertext leaves the browser.

## Quick start

1. npm install
2. cp .env.example .env (then set VITE_GOOGLE_CLIENT_ID)
3. npm run dev
4. Open the printed URL (default http://localhost:5173)
5. Add that exact origin to your OAuth client's Authorized JavaScript origins.

## Google setup (one time)

- Google Cloud Console: create project, enable Google Drive API.
- OAuth consent screen: External, add your Google account under Test users.
- Credentials: OAuth client ID, type Web application.
- Authorized JavaScript origins: http://localhost:5173 (dev) and https://<you>.github.io (prod).
- Copy the client id into .env.

## Flow

1. Connect Google Drive (GIS token, drive.file scope).
2. Master password: first time creates the vault, later unlocks it.
3. Add / edit / delete credentials. Each change encrypts and saves to Drive.
4. Lock clears the key from memory.

## Security model

- Master password -> PBKDF2 (250k) -> AES-GCM 256. Password never stored, never sent to Google.
- Entries encrypted client-side; Drive holds only ciphertext (keyva/vault.json).
- Salt fixed per vault (in the blob); fresh random IV each save.
- Scope drive.file: the app sees only files it created.
- OAuth Client ID is not a secret; safe in a public repo. No client secret in browser flow.

## Deploy (GitHub Pages)

- Repo Settings -> Pages -> Source = GitHub Actions.
- Settings -> Secrets and variables -> Actions -> Variables: add VITE_GOOGLE_CLIENT_ID.
- Push to main; the workflow builds (tsc + vite) and deploys.
- base is "/keyva/" in production, "/" in dev (vite.config.ts). Rename if your repo differs.

## Project layout

src/
main.tsx entry: mounts App
App.tsx 3-phase UI: Connect -> Unlock -> Vault
index.css @import "tailwindcss";
types.ts Entry, CipherBlob
crypto.ts PBKDF2 + AES-GCM + password generator
vite-env.d.ts env + GIS typings
drive/auth.ts GIS token flow
drive/vaultFile.ts find-or-create keyva/ folder + vault.json
hooks/useVault.ts orchestrates auth + crypto + Drive
components/EntryForm.tsx
components/EntryList.tsx
