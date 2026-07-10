import { useState, type FormEvent } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextInput from "../components/ui/TextInput";

interface Props {
  busy: boolean;
  onUnlock: (password: string) => void;
}

export default function UnlockPage({ busy, onUnlock }: Props) {
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onUnlock(password);
    setPassword("");
  };

  return (
    <Card className="mx-auto mt-16 max-w-md p-6">
      <h2 className="text-lg font-semibold">Master password</h2>
      <p className="mt-1 text-sm text-slate-500">
        First time: this creates your vault. Returning: this unlocks it.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <TextInput
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Master password"
        />
        <Button type="submit" disabled={busy || !password} className="w-full">
          {busy ? "Working…" : "Unlock"}
        </Button>
      </form>
    </Card>
  );
}
