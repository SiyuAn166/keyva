import { useState, type FormEvent } from "react";
import type { ApiKey } from "../lib/types";
import Button from "./ui/Button";
import Field from "./ui/Field";
import TextInput from "./ui/TextInput";
import TextArea from "./ui/TextArea";
import Select from "./ui/Select";
import PasswordInput from "./ui/PasswordInput";

function toDateInput(ms?: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

export default function ApiKeyForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial?: ApiKey;
  busy: boolean;
  onSave: (k: ApiKey) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [keyId, setKeyId] = useState(initial?.keyId ?? "");
  const [secret, setSecret] = useState(initial?.secret ?? "");
  const [environment, setEnvironment] = useState(initial?.environment ?? "");
  const [expires, setExpires] = useState(toDateInput(initial?.expiresAt));
  const [note, setNote] = useState(initial?.note ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const expiresAt = expires ? new Date(expires).getTime() : undefined;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      type: "apikey",
      name: name.trim(),
      provider: provider.trim() || undefined,
      keyId: keyId.trim() || undefined,
      secret,
      environment: environment || undefined,
      expiresAt,
      note: note.trim() || undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Key
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <TextInput
              autoFocus
              required
              placeholder="e.g. OpenAI production"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Provider">
            <TextInput
              placeholder="e.g. OpenAI, AWS, Stripe"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="Key ID"
          hint="Public identifier — access key id / client id"
        >
          <TextInput
            placeholder="e.g. AKIA…"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
          />
        </Field>
        <Field label="Secret">
          <PasswordInput
            placeholder="Secret value"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Metadata
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Environment">
            <Select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <option value="">—</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </Select>
          </Field>
          <Field label="Expires">
            <TextInput
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Note
        </h3>
        <Field label="Note">
          <TextArea
            rows={3}
            placeholder="Scopes, usage limits, anything else"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </section>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy ? "Saving…" : "Save API key"}
        </Button>
      </div>
    </form>
  );
}
