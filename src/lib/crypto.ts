import type { Item } from "./types";
import { argon2id } from "hash-wasm";

// Format version stored in byte 0 of vault.bin:
//   1 = PBKDF2-SHA256 250k  (legacy, still readable so old vaults keep opening)
//   2 = Argon2id            (current — memory-hard, what new vaults write)
export const CURRENT_VERSION = 2;

const PBKDF2_ITERATIONS = 250_000;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;

// Argon2id cost. 64 MB keeps a single unlock ~0.5-1s and is safe on mobile
// Safari; raise ARGON2_MEMORY_KB (e.g. 131072 = 128 MB) for desktop-only use.
const ARGON2_MEMORY_KB = 65536;
const ARGON2_ITERATIONS = 3;
const ARGON2_PARALLELISM = 1;

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  // Copy into a fresh ArrayBuffer-backed view so the BufferSource type is exact.
  const bytes = new Uint8Array(raw);
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function derivePBKDF2(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function deriveArgon2(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const raw = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_KB,
    hashLength: KEY_LEN,
    outputType: "binary",
  });
  return importAesKey(raw);
}

// Version-aware: opens legacy PBKDF2 vaults, derives Argon2id for current ones.
export async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  version: number = CURRENT_VERSION,
): Promise<CryptoKey> {
  return version >= 2
    ? deriveArgon2(password, salt)
    : derivePBKDF2(password, salt);
}

// Pack into: [version:1][salt:16][iv:12][ciphertext:rest]
export async function encryptVault(
  key: CryptoKey,
  salt: Uint8Array<ArrayBuffer>,
  items: Item[],
  version: number = CURRENT_VERSION,
): Promise<Uint8Array<ArrayBuffer>> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const ctBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(items)),
  );
  const ct = new Uint8Array(ctBuf);
  const out = new Uint8Array(1 + SALT_LEN + IV_LEN + ct.length);
  out[0] = version;
  out.set(salt, 1);
  out.set(iv, 1 + SALT_LEN);
  out.set(ct, 1 + SALT_LEN + IV_LEN);
  return out;
}

export interface Parsed {
  version: number;
  salt: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  ct: Uint8Array<ArrayBuffer>;
}

export function unpack(packed: Uint8Array<ArrayBuffer>): Parsed {
  return {
    version: packed[0],
    salt: packed.slice(1, 1 + SALT_LEN),
    iv: packed.slice(1 + SALT_LEN, 1 + SALT_LEN + IV_LEN),
    ct: packed.slice(1 + SALT_LEN + IV_LEN),
  };
}

export async function decryptVault(
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  ct: Uint8Array<ArrayBuffer>,
): Promise<Item[]> {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt)) as Item[];
}

export function newSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(SALT_LEN));
}
