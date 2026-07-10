import { Lock } from "./components/ui/icons";
import { useVault } from "./hooks/useVault";
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
            <button
              onClick={lock}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700"
            >
              <Lock width={15} height={15} /> Lock
            </button>
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
