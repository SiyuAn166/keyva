import { useState } from "react";
import type { ApiKey, Credential, Item, ItemType } from "../lib/types";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Plus } from "../components/ui/icons";
import ItemList from "../components/ItemList";
import AddChooser from "../components/AddChooser";
import CredentialForm from "../components/CredentialForm";
import ApiKeyForm from "../components/ApiKeyForm";

interface Props {
  items: Item[];
  busy: boolean;
  onUpsert: (item: Item) => void;
  onRemove: (id: string) => void;
}

type Mode =
  | { kind: "list" }
  | { kind: "choose" }
  | { kind: "credential"; item?: Credential }
  | { kind: "apikey"; item?: ApiKey };

export default function VaultPage({ items, busy, onUpsert, onRemove }: Props) {
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  const toList = () => setMode({ kind: "list" });

  const choose = (type: ItemType) =>
    setMode(
      type === "credential" ? { kind: "credential" } : { kind: "apikey" },
    );

  const edit = (item: Item) =>
    setMode(
      item.type === "credential"
        ? { kind: "credential", item }
        : { kind: "apikey", item },
    );

  const save = (item: Item) => {
    onUpsert(item);
    toList();
  };

  if (mode.kind === "list") {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Your vault</h2>
          <Button onClick={() => setMode({ kind: "choose" })}>
            <Plus width={16} height={16} /> Add
          </Button>
        </div>
        <ItemList items={items} onEdit={edit} onDelete={onRemove} />
      </div>
    );
  }

  if (mode.kind === "choose") {
    return (
      <Card className="mx-auto mt-6 max-w-3xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          What do you want to add?
        </h2>
        <AddChooser onChoose={choose} onCancel={toList} />
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-6 max-w-3xl p-6">
      <h2 className="mb-6 text-lg font-semibold text-slate-800">
        {mode.item ? "Edit" : "New"}{" "}
        {mode.kind === "credential" ? "credential" : "API key"}
      </h2>
      {mode.kind === "credential" ? (
        <CredentialForm
          initial={mode.item}
          busy={busy}
          onSave={save}
          onCancel={toList}
        />
      ) : (
        <ApiKeyForm
          initial={mode.item}
          busy={busy}
          onSave={save}
          onCancel={toList}
        />
      )}
    </Card>
  );
}
