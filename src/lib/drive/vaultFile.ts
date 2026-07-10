// Read/write keyva/vault.bin in the user's Drive. Scope: drive.file.
// Stored as raw binary (application/octet-stream), not JSON.

const FILES = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const FOLDER_NAME = "keyva";
const FILE_NAME = "vault.bin";

function auth(token: string) {
  return { Authorization: "Bearer " + token };
}

async function findFolder(token: string): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`,
  );
  const r = await fetch(`${FILES}?q=${q}&fields=files(id)`, {
    headers: auth(token),
  });
  const d = await r.json();
  return d.files?.[0]?.id ?? null;
}

async function createFolder(token: string): Promise<string> {
  const r = await fetch(`${FILES}?fields=id`, {
    method: "POST",
    headers: { ...auth(token), "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
  });
  return (await r.json()).id as string;
}

export async function getFolderId(token: string): Promise<string> {
  return (await findFolder(token)) || (await createFolder(token));
}

export async function findVaultId(
  token: string,
  folderId: string,
): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
  );
  const r = await fetch(`${FILES}?q=${q}&fields=files(id)`, {
    headers: auth(token),
  });
  const d = await r.json();
  return d.files?.[0]?.id ?? null;
}

// Download the raw vault bytes.
export async function loadVault(
  token: string,
  fileId: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const r = await fetch(`${FILES}/${fileId}?alt=media`, {
    headers: auth(token),
  });
  if (!r.ok) throw new Error("Load failed: " + r.status);
  return new Uint8Array(await r.arrayBuffer());
}

// Create (inside keyva folder) or update vault.bin. Returns file id.
export async function saveVault(
  token: string,
  folderId: string,
  fileId: string | null,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const meta = fileId
    ? { name: FILE_NAME }
    : { name: FILE_NAME, parents: [folderId] };
  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(meta)], { type: "application/json" }),
  );
  form.append("file", new Blob([bytes], { type: "application/octet-stream" }));
  const url = fileId
    ? `${UPLOAD}/${fileId}?uploadType=multipart&fields=id`
    : `${UPLOAD}?uploadType=multipart&fields=id`;
  const r = await fetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: auth(token),
    body: form,
  });
  if (!r.ok)
    throw new Error("Save failed: " + r.status + " " + (await r.text()));
  return (await r.json()).id as string;
}
