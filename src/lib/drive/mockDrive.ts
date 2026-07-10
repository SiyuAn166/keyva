// Dev-only fake Drive: stores the encrypted vault blob in localStorage.
// Exposes the SAME API (and param arity) as vaultFile.ts so useVault can swap
// it in when VITE_MOCK_DRIVE=true. Params are kept for signature compatibility
// with the real layer (the `MOCK ? mock : real` union call needs matching
// arity) and referenced via `void` where unused. Encryption is untouched —
// only "where bytes live" and "no OAuth" change.

const KEY = "keyva_mock_vault";

export async function getFolderId(_token: string): Promise<string> {
  void _token;
  return "mock-folder";
}

export async function findVaultId(
  _token: string,
  _folderId: string,
): Promise<string | null> {
  void _token;
  void _folderId;
  return localStorage.getItem(KEY) ? "mock-file" : null;
}

export async function loadVault(
  _token: string,
  _fileId: string,
): Promise<Uint8Array<ArrayBuffer>> {
  void _token;
  void _fileId;
  const b64 = localStorage.getItem(KEY);
  if (!b64) throw new Error("Load failed: no mock vault");
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function saveVault(
  _token: string,
  _folderId: string,
  _fileId: string | null,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string> {
  void _token;
  void _folderId;
  void _fileId;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  localStorage.setItem(KEY, btoa(bin));
  return "mock-file";
}
