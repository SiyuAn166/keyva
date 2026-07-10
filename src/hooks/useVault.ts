import { useCallback, useEffect, useRef, useState } from "react";
import type { Item } from "../lib/types";
import { initTokenClient, requestToken, getToken } from "../lib/drive/auth";
import {
  getFolderId,
  findVaultId,
  loadVault,
  saveVault,
} from "../lib/drive/vaultFile";
import {
  deriveKey,
  encryptVault,
  decryptVault,
  unpack,
  newSalt,
  CURRENT_VERSION,
} from "../lib/crypto";

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
    // A vault now exists iff it has been saved to Drive (fileRef set). This
    // keeps the unlock screen from wrongly re-showing "Create your vault".
    setIsNewVault(!fileRef.current);
    setStatus("connected");
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");
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
          const folderId = await getFolderId(token);
          folderRef.current = folderId;
          const fileId = await findVaultId(token, folderId);
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
      const folderId = folderRef.current ?? (await getFolderId(token));
      folderRef.current = folderId;
      const fileId = fileRef.current ?? (await findVaultId(token, folderId));
      fileRef.current = fileId;
      if (fileId) {
        const packed = await loadVault(token, fileId);
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
        // Immediately persist an empty vault to Drive so the vault "exists"
        // even before any item is added. This records that the master
        // password has been set, so locking returns to the unlock screen
        // (not "Create your vault").
        const bytes = await encryptVault(key, salt, [], CURRENT_VERSION);
        fileRef.current = await saveVault(
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
      fileRef.current = await saveVault(
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
