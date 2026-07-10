import { useMemo, useState, type FormEvent } from "react";
import zxcvbn from "zxcvbn";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextInput from "../components/ui/TextInput";

interface Props {
  busy: boolean;
  isNewVault: boolean;
  onUnlock: (password: string) => void;
}

const LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const BAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-600",
];
const MIN_LEN = 8;
const MIN_SCORE = 3; // require "Good" or better when creating a vault

export default function UnlockPage({ busy, isNewVault, onUnlock }: Props) {
  const [password, setPassword] = useState("");

  const strength = useMemo(() => {
    if (!isNewVault || !password) return null;
    const { score, feedback } = zxcvbn(password);
    return { score, feedback };
  }, [isNewVault, password]);

  const tooWeak =
    isNewVault &&
    (password.length < MIN_LEN || (strength?.score ?? 0) < MIN_SCORE);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (tooWeak) return;
    onUnlock(password);
    setPassword("");
  };

  return (
    <Card className="mx-auto mt-16 max-w-md p-6">
      <h2 className="text-lg font-semibold">
        {isNewVault ? "Create your vault" : "Master password"}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {isNewVault
          ? "Choose a strong master password. It encrypts everything and can never be recovered — pick a passphrase you will remember."
          : "Enter your master password to unlock."}
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <TextInput
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Master password"
        />

        {isNewVault && password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= (strength?.score ?? 0)
                      ? BAR_COLORS[strength?.score ?? 0]
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {LABELS[strength?.score ?? 0]}
              {strength?.feedback.warning
                ? ` — ${strength.feedback.warning}`
                : password.length < MIN_LEN
                  ? ` — use at least ${MIN_LEN} characters`
                  : ""}
            </p>
            {strength?.feedback.suggestions?.[0] && (
              <p className="text-xs text-slate-400">
                {strength.feedback.suggestions[0]}
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={busy || !password || tooWeak}
          className="w-full"
        >
          {busy ? "Working" : isNewVault ? "Create vault" : "Unlock"}
        </Button>
      </form>
    </Card>
  );
}
