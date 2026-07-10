import { useState, useRef, useEffect } from "react";
import type { ApiKey, Credential, Item, ItemType } from "../lib/types";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Plus, Lock, Key } from "../components/ui/icons";
import ItemList from "../components/ItemList";
import CredentialForm from "../components/CredentialForm";
import ApiKeyForm from "../components/ApiKeyForm";

interface Props {
  items: Item[];
  busy: boolean;
  onUpsert: (item: Item) => void;
  onRemove: (id: string) => void;
}

type Editing =
  | null
  | { kind: "credential"; item?: Credential }
  | { kind: "apikey"; item?: ApiKey };

export default function VaultPage({ items, busy, onUpsert, onRemove }: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const choose = (type: ItemType) => {
    setMenuOpen(false);
    setEditing(
      type === "credential" ? { kind: "credential" } : { kind: "apikey" },
    );
  };

  const edit = (item: Item) =>
    setEditing(
      item.type === "credential"
        ? { kind: "credential", item }
        : { kind: "apikey", item },
    );

  const close = () => setEditing(null);

  const save = (item: Item) => {
    onUpsert(item);
    close();
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Your vault</h2>

        <div className="relative" ref={menuRef}>
          <Button onClick={() => setMenuOpen((o) => !o)}>
            <Plus width={16} height={16} /> Add
          </Button>

          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => choose("credential")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Lock width={18} height={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Add credential
                  </span>
                  <span className="block text-xs text-slate-500">
                    Username, password, security questions
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => choose("apikey")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-teal-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <Key width={18} height={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Add API key
                  </span>
                  <span className="block text-xs text-slate-500">
                    Provider, key ID, secret, environment
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ItemList items={items} onEdit={edit} onDelete={onRemove} />

      <Modal
        open={editing !== null}
        onClose={close}
        title={
          editing
            ? `${editing.item ? "Edit" : "New"} ${
                editing.kind === "credential" ? "credential" : "API key"
              }`
            : ""
        }
      >
        {editing?.kind === "credential" && (
          <CredentialForm
            initial={editing.item}
            busy={busy}
            onSave={save}
            onCancel={close}
          />
        )}
        {editing?.kind === "apikey" && (
          <ApiKeyForm
            initial={editing.item}
            busy={busy}
            onSave={save}
            onCancel={close}
          />
        )}
      </Modal>
    </div>
  );
}
