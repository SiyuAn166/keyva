import type { ItemType } from "../lib/types";
import { Lock, Key } from "./ui/icons";

export default function AddChooser({
  onChoose,
  onCancel,
}: {
  onChoose: (type: ItemType) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChoose("credential")}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50/50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Lock width={22} height={22} />
          </span>
          <span className="text-base font-semibold text-slate-800">
            Add credential
          </span>
          <span className="text-sm text-slate-500">
            Username, password, security questions for a site or app.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("apikey")}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-teal-400 hover:bg-teal-50/50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <Key width={22} height={22} />
          </span>
          <span className="text-base font-semibold text-slate-800">
            Add API key
          </span>
          <span className="text-sm text-slate-500">
            Provider, key ID, secret and environment for a service token.
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back
      </button>
    </div>
  );
}
