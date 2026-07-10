# Keyva

A zero-server, zero-knowledge personal credential manager. Runs entirely in your browser, encrypts everything on-device, and syncs a single encrypted file to **your own** Google Drive. No backend, no database, no plaintext ever leaves your device.

Store both **login credentials** (username / password / security questions) and **API keys** (provider / key ID / secret / environment / expiry) in one encrypted vault.

## How it works

* **Encryption is local.** Your master password is turned into an AES-256 key using **Argon2id** (a slow, memory-hard key-derivation function). The vault is encrypted with **AES-256-GCM** in the browser.
* **Only ciphertext is stored.** The encrypted blob (`keyva/vault.bin`) lives in your Google Drive. Drive, GitHub Pages, and anyone reading the public code only ever see an unreadable encrypted file.
* **Your master password is never stored** — not in the code, not in the file, not on Drive. It exists only in your head and is typed fresh each time. Lose it and the data is unrecoverable (that is the point).
* **Least-privilege Drive access.** The app uses the `drive.file` scope, so it can only see files it created itself — never the rest of your Drive.

## Security features

* **Argon2id key derivation** (64 MB memory, 3 passes) via `hash-wasm` — makes offline brute-force attacks slow and memory-hard, crippling GPU/ASIC parallelism.
* **AES-256-GCM authenticated encryption** — both encrypts the data and detects any tampering with the file.
* **Master-password strength gate** — `zxcvbn` runs on vault creation and refuses weak passwords (minimum length 8 and score "Good" or better).
* **Strict Content-Security-Policy** — injected into the production build; blocks injected/remote scripts, allowing only self, Google auth/API origins, and WASM.
* **Auto-lock** — the in-memory key is wiped after 5 minutes of inactivity.
* **No third-party scripts, no CDNs** — native Web Crypto plus two audited WASM/JS dependencies only.

> The entire security of Keyva rests on one thing you control: **pick a strong, unique master passphrase (4–5 unrelated words) and never reuse it.** With a strong passphrase, someone holding both the public code and your `vault.bin` still gets nothing.

## Tech stack

* React + TypeScript + Vite
* Tailwind CSS v4 (`@tailwindcss/vite`)
* Web Crypto API (AES-256-GCM)
* `hash-wasm` (Argon2id) · `zxcvbn` (password strength)
* Google Identity Services (GIS) + Google Drive REST API

## Storage format — `keyva/vault.bin`

A single packed binary blob (not JSON):

```
┌─────────┬──────────────┬────────────┬─────────────────────────┐
│ version │     salt     │     iv     │       ciphertext        │
│ 1 byte  │   16 bytes   │  12 bytes  │       rest of file      │
└─────────┴──────────────┴────────────┴─────────────────────────┘
```

* **version** (1 byte) — `1` = legacy PBKDF2, `2` = Argon2id (current).
* **salt** (16 bytes) — random per vault, feeds the KDF. Stored in the clear (salt is not secret).
* **iv** (12 bytes) — random per save, the AES-GCM nonce. Also in the clear.
* **ciphertext** — AES-256-GCM encryption of `JSON.stringify(items)`, with the GCM auth tag appended.

Everything except the salt and IV is encrypted; there is no readable structure in the body.

## Project structure

```
src/
├─ App.tsx              # thin wrapper → <Keyva/>
├─ Keyva.tsx            # shell: calls useVault, renders page by status
├─ main.tsx  index.css
├─ lib/                 # pure logic, no JSX
│  ├─ types.ts          # Item = Credential | ApiKey (tagged union)
│  ├─ crypto.ts         # Argon2id + AES-GCM + binary pack/unpack
│  └─ drive/
│     ├─ auth.ts        # GIS token flow (drive.file scope)
│     └─ vaultFile.ts   # find-or-create keyva/vault.bin
├─ hooks/useVault.ts    # orchestrates auth + crypto + Drive + auto-lock
├─ pages/
│  ├─ ConnectPage.tsx   # connect Google Drive
│  ├─ UnlockPage.tsx    # master password + zxcvbn strength gate
│  └─ VaultPage.tsx     # list → add chooser → credential | apikey form
└─ components/
   ├─ AddChooser.tsx    # "Add credential" / "Add API key"
   ├─ CredentialForm.tsx · ApiKeyForm.tsx
   ├─ ItemList.tsx      # tabs, type badges, reveal, edit, delete
   ├─ SecurityQuestions.tsx
   └─ ui/               # Button, Card, Field, TextInput, Select, PasswordInput, icons
```

## Setup — run your own copy

Keyva is multi-tenant by design: everyone who runs it uses **their own** Google account and **their own** Drive. To use it, set up your own Google OAuth client — you are not connecting to anyone else's data.

### 1. Clone and install

```bash
git clone https://github.com/SiyuAn166/keyva.git
cd keyva
npm install
```

### 2. Create your Google OAuth client

1. Go to the [Google Cloud Console](https://console.cloud.google.com) → create a new project.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → choose **Audience** → add your Google email under **Test users**. Leave the app in **Testing** mode (only listed test users can connect — this keeps the app private to you).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type **Web application**.
5. Under **Authorized JavaScript origins**, add:
   * `http://localhost:5173` (local dev)
   * your deployed URL, e.g. `https://<your-username>.github.io` (production)
6. Copy the **Client ID** (ends in `.apps.googleusercontent.com`).

You do **not** need a client secret, API key, or billing — the browser OAuth flow uses none of them. The client ID is not a secret and is safe to expose in browser code.

### 3. Configure your client ID

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 4. Run locally

```bash
npm run dev
```

Open the printed URL → **Connect** your Drive → set a strong master password → start adding items. Check [drive.google.com](https://drive.google.com) and you'll see `keyva/vault.bin` appear.

## Deploy to GitHub Pages

1. Push your fork to your own GitHub repository.
2. **Settings → Pages → Source** = **GitHub Actions**.
3. **Settings → Secrets and variables → Actions → Variables** → add `VITE_GOOGLE_CLIENT_ID` with your client ID (so the CI build can inject it — no `.env` is committed).
4. In `vite.config.ts`, set `base` to match your repository name (default is `/keyva/`).
5. Add your Pages URL (e.g. `https://<your-username>.github.io`) to the OAuth client's **Authorized JavaScript origins**.
6. Push to `main` — the workflow builds and deploys automatically. Your site will be live at `https://<your-username>.github.io/keyva/`.

## Scripts

```bash
npm run dev       # start dev server (http://localhost:5173)
npm run build     # tsc -b && vite build (production build with CSP injected)
npm run preview   # preview the production build locally
```

## Security model — FAQ

**The code is public. Can someone who finds the site read my vault?**
No. Each visitor logs in with their own Google account and only ever connects to their own Drive. Google mints the access token for whoever is signed in — a stranger's session touches only their own files, never yours. With the app in Testing mode, strangers are rejected at the connect step entirely.

**What if someone gets my `vault.bin` and the public `crypto.ts`?**
They still can't read it. The code is the *recipe*, not the *key*. The only path is to guess your master password offline — and Argon2id (slow, memory-hard) plus a strong passphrase makes that infeasible (centuries of compute). This is Kerckhoffs's principle: security lives in the key, never in hiding the code.

**What actually protects me?**
Two independent layers: (1) your Google login + 2FA gates who can even download the file, and (2) your master password encrypts the contents if the file ever leaks. The one condition that matters: **use a strong, unique master passphrase.**

## Notes

* **Legacy vaults.** A vault created before the Argon2id upgrade is version `1` (PBKDF2) and still opens; edits re-save as `v1`. To move to Argon2id, delete `keyva/vault.bin` in Drive and create a fresh vault.
* **Auto-lock.** The vault locks after 5 minutes of inactivity; you'll need to re-enter your master password.
* **Backup.** Since the whole file is encrypted, you can safely download `keyva/vault.bin` from Drive as an extra backup.
