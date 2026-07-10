import { useCallback, useEffect, useRef, useState } from "react";
import type { Item } from "../lib/types";
import {
  initTokenClient,
  requestToken,
  getToken as realGetToken,
} from "../lib/drive/auth";
import * as realDrive from "../lib/drive/vaultFile";
import * as mockDrive from "../lib/drive/mockDrive";
import {
  deriveKey,
  encryptVault,
  decryptVault,
  unpack,
  newSalt,
  CURRENT_VERSION,
} from "../lib/crypto";

// Dev-only: skip Google OAuth and store the encrypted blob in localStorage.
// Set VITE_MOCK_DRIVE=true in .env.development (NOT .env, or it leaks to prod).
const MOCK = import.meta.env.VITE_MOCK_DRIVE === "true";
const drive = MOCK ? mockDrive : realDrive;
const getToken = MOCK ? () => "mock-token" : realGetToken;

// Dev-only: auto-connect + auto-unlock with a fixed password so you never
// click Connect or type the master password. Set VITE_MOCK_PASSWORD in
// .env.development. Only active alongside MOCK; never runs in production.
const DEV_PASSWORD = import.meta.env.VITE_MOCK_PASSWORD;
const AUTO_UNLOCK = MOCK && !!DEV_PASSWORD;

type Status = "locked" | "connecting" | "connected" | "unlocked";

// Wipe the in-memory key after this much idle time.
const AUTO_LOCK_MS = 5 * 60 * 1000;

export function useVault() {
  const [status, setStatus] = useState<Status>("locked");
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isNewVault, setIsNewVault] = useState(false);

  const keyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const versionRef = useRef<number>(CURRENT_VERSION);
  const folderRef = useRef<string | null>(null);
  const fileRef = useRef<string | null>(null);

  const lock = useCallback(() => {
    keyRef.current = null;
    saltRef.current = null;
    setItems([]);
    // A vault now exists iff it has been saved (fileRef set). This keeps the
    // unlock screen from wrongly re-showing "Create your vault".
    setIsNewVault(!fileRef.current);
    setStatus("connected");
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");

    // Mock mode: no OAuth. Jump straight to the unlock screen and probe the
    // local (localStorage) vault to decide create-vs-open.
    if (MOCK) {
      setStatus("connected");
      try {
        const folderId = await drive.getFolderId("mock-token");
        folderRef.current = folderId;
        const fileId = await drive.findVaultId("mock-token", folderId);
        fileRef.current = fileId;
        setIsNewVault(!fileId);
      } catch {
        setIsNewVault(true);
      }
      return;
    }

    await initTokenClient((token, err) => {
      if (err || !token) {
        setError(err || "No token");
        setStatus("locked");
        return;
      }
      setStatus("connected");
      // Probe whether a vault already exists, so the unlock screen knows
      // whether it is CREATING (enforce strength) or RETURNING (just open).
      (async () => {
        try {
          const folderId = await drive.getFolderId(token);
          folderRef.current = folderId;
          const fileId = await drive.findVaultId(token, folderId);
          fileRef.current = fileId;
          setIsNewVault(!fileId);
        } catch {
          setIsNewVault(false);
        }
      })();
    });
    requestToken();
  }, []);

  const unlock = useCallback(async (password: string) => {
    setError(null);
    const token = getToken();
    if (!token) {
      setError("Connect Drive first");
      return;
    }
    setBusy(true);
    try {
      const folderId = folderRef.current ?? (await drive.getFolderId(token));
      folderRef.current = folderId;
      const fileId =
        fileRef.current ?? (await drive.findVaultId(token, folderId));
      fileRef.current = fileId;
      if (fileId) {
        const packed = await drive.loadVault(token, fileId);
        const { version, salt, iv, ct } = unpack(packed);
        const key = await deriveKey(password, salt, version);
        const data = await decryptVault(key, iv, ct); // throws on wrong password
        keyRef.current = key;
        saltRef.current = salt;
        versionRef.current = version;
        setItems(data);
      } else {
        const salt = newSalt();
        const key = await deriveKey(password, salt, CURRENT_VERSION);
        keyRef.current = key;
        saltRef.current = salt;
        versionRef.current = CURRENT_VERSION;
        // Immediately persist an empty vault so the vault "exists" even before
        // any item is added (records that the master password has been set).
        const bytes = await encryptVault(key, salt, [], CURRENT_VERSION);
        fileRef.current = await drive.saveVault(
          token,
          folderId,
          fileRef.current,
          bytes,
        );
        setItems([]);
      }
      setStatus("unlocked");
    } catch {
      setError("Unlock failed — wrong password or corrupt vault.");
    } finally {
      setBusy(false);
    }
  }, []);

  const persist = useCallback(async (next: Item[]) => {
    const token = getToken();
    if (!token || !keyRef.current || !saltRef.current || !folderRef.current)
      return;
    setBusy(true);
    try {
      // Write with the SAME version the key was derived under, so a legacy
      // PBKDF2 vault stays readable instead of being mislabelled v2.
      const bytes = await encryptVault(
        keyRef.current,
        saltRef.current,
        next,
        versionRef.current,
      );
      fileRef.current = await drive.saveVault(
        token,
        folderRef.current,
        fileRef.current,
        bytes,
      );
      setItems(next);
    } catch {
      setError("Save failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  const upsert = useCallback(
    async (item: Item) => {
      const now = Date.now();
      const existing = items.find((i) => i.id === item.id);
      let next: Item[];
      if (existing) {
        const stamped = {
          ...item,
          createdAt: existing.createdAt,
          updatedAt: now,
        } as Item;
        next = items.map((i) => (i.id === item.id ? stamped : i));
      } else {
        const stamped = { ...item, createdAt: now, updatedAt: now } as Item;
        next = [...items, stamped];
      }
      await persist(next);
    },
    [items, persist],
  );

  const remove = useCallback(
    async (id: string) => {
      await persist(items.filter((i) => i.id !== id));
    },
    [items, persist],
  );

  // Auto-lock: wipe the key after AUTO_LOCK_MS of no user activity.
  useEffect(() => {
    if (status !== "unlocked") return;
    let timer: number;
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lock, AUTO_LOCK_MS);
    };
    const events = ["mousedown", "keydown", "touchstart", "focus"];
    events.forEach((e) => window.addEventListener(e, reset, true));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset, true));
    };
  }, [status, lock]);

  // Dev-only: on mount, connect automatically (skips the Connect button).
  // Deferred via setTimeout so connect()'s setState isn't called synchronously
  // in the effect body (avoids react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!(AUTO_UNLOCK && status === "locked")) return;
    const t = setTimeout(() => void connect(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev-only: once connected, unlock with the fixed dev password
  // (bypasses the UI password/strength step entirely).
  useEffect(() => {
    if (!(AUTO_UNLOCK && status === "connected" && !keyRef.current)) return;
    const t = setTimeout(() => void unlock(DEV_PASSWORD as string), 0);
    return () => clearTimeout(t);
  }, [status, unlock]);

  return {
    status,
    items,
    error,
    busy,
    isNewVault,
    connect,
    unlock,
    upsert,
    remove,
    lock,
  };
}
