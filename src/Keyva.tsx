import { useVault } from "./hooks/useVault";
import Button from "./components/ui/Button";
import ConnectPage from "./pages/ConnectPage";
import UnlockPage from "./pages/UnlockPage";
import VaultPage from "./pages/VaultPage";

export default function Keyva() {
  const {
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
  } = useVault();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Keyva</h1>
          {status === "unlocked" && (
            <Button variant="secondary" size="sm" onClick={lock}>
              Lock
            </Button>
          )}
        </header>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {(status === "locked" || status === "connecting") && (
          <ConnectPage
            connecting={status === "connecting"}
            onConnect={connect}
          />
        )}
        {status === "connected" && (
          <UnlockPage busy={busy} isNewVault={isNewVault} onUnlock={unlock} />
        )}
        {status === "unlocked" && (
          <VaultPage
            items={items}
            busy={busy}
            onUpsert={upsert}
            onRemove={remove}
          />
        )}
      </div>
    </div>
  );
}
