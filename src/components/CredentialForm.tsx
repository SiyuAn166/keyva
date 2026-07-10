import { useState, type FormEvent } from "react";
import type { Credential, SecurityQuestion } from "../lib/types";
import SecurityQuestions from "./SecurityQuestions";
import Button from "./ui/Button";
import Field from "./ui/Field";
import PasswordInput from "./ui/PasswordInput";
import TextArea from "./ui/TextArea";
import TextInput from "./ui/TextInput";

export default function CredentialForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial?: Credential;
  busy: boolean;
  onSave: (c: Credential) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [sqs, setSqs] = useState<SecurityQuestion[]>(
    initial?.securityQuestions ?? [],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      type: "credential",
      name: name.trim(),
      username: username.trim(),
      password,
      note: note.trim() || undefined,
      securityQuestions: sqs.filter(
        (q) => q.question.trim() || q.answer.trim(),
      ),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Account
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <TextInput
              autoFocus
              required
              placeholder="e.g. GitHub"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Username">
            <TextInput
              placeholder="e.g. john.doe@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Password">
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Security questions
        </h3>
        <SecurityQuestions value={sqs} onChange={setSqs} />
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Note
        </h3>
        <Field label="Note">
          <TextArea
            rows={3}
            placeholder="Anything else worth remembering"
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
          {busy ? "Saving…" : "Save credential"}
        </Button>
      </div>
    </form>
  );
}
