import { useMemo, useState } from "react";
import type { Item, ItemType } from "../lib/types";
import Button from "./ui/Button";
import { Eye, EyeOff, Search, Trash } from "./ui/icons";

type Filter = "all" | ItemType;

const tabs: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "credential", label: "Credentials" },
  { key: "apikey", label: "API keys" },
];

function TypeBadge({ type }: { type: ItemType }) {
  const cls =
    type === "credential"
      ? "bg-indigo-100 text-indigo-700"
      : "bg-teal-100 text-teal-700";
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {type === "credential" ? "Credential" : "API key"}
    </span>
  );
}

export default function ItemList({
  items,
  onEdit,
  onDelete,
}: {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (filter === "all" ? true : i.type === filter))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === t.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1">
          <Search
            width={16}
            height={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
          Nothing here yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => {
            const secret =
              item.type === "credential" ? item.password : item.secret;
            const subtitle =
              item.type === "credential"
                ? item.username
                : [item.provider, item.keyId].filter(Boolean).join(" · ");
            const isOpen = !!revealed[item.id];
            return (
              <li
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <TypeBadge type={item.type} />
                      {item.type === "apikey" && item.environment && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {item.environment}
                        </span>
                      )}
                    </div>
                    {subtitle && (
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {subtitle}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                        {isOpen ? secret || "—" : "••••••••••"}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealed((r) => ({ ...r, [item.id]: !r[item.id] }))
                        }
                        aria-label={isOpen ? "Hide" : "Show"}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {isOpen ? (
                          <EyeOff width={16} height={16} />
                        ) : (
                          <Eye width={16} height={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="link" size="xs" onClick={() => onEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="linkDanger"
                      size="xs"
                      onClick={() => onDelete(item.id)}
                      aria-label="Delete"
                    >
                      <Trash width={16} height={16} />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
