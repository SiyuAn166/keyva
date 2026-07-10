import { useCallback, useRef, useState } from "react";
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
} from "../lib/crypto";

type Status = "locked" | "connecting" | "connected" | "unlocked";

export function useVault() {
  const [status, setStatus] = useState<Status>("locked");
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const keyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const folderRef = useRef<string | null>(null);
  const fileRef = useRef<string | null>(null);

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
      const folderId = await getFolderId(token);
      folderRef.current = folderId;
      const fileId = await findVaultId(token, folderId);
      fileRef.current = fileId;

      if (fileId) {
        const packed = await loadVault(token, fileId);
        const { salt, iv, ct } = unpack(packed);
        const key = await deriveKey(password, salt);
        const data = await decryptVault(key, iv, ct); // throws on wrong password
        keyRef.current = key;
        saltRef.current = salt;
        setItems(data);
      } else {
        const salt = newSalt();
        const key = await deriveKey(password, salt);
        keyRef.current = key;
        saltRef.current = salt;
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
      const bytes = await encryptVault(keyRef.current, saltRef.current, next);
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

  const lock = useCallback(() => {
    keyRef.current = null;
    saltRef.current = null;
    setItems([]);
    setStatus("connected");
  }, []);

  return { status, items, error, busy, connect, unlock, upsert, remove, lock };
}
