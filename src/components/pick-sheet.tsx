"use client";

import { useState } from "react";

import { Sheet } from "@/components/sheet";

export type PickItem = { key: string; label: string; sub?: string; search: string };

// Mockup openPick for lists that are not people: templates and reports.
export function PickSheet({
  title,
  placeholder,
  items,
  onPick,
  onClose,
}: {
  title: string;
  placeholder: string;
  items: PickItem[];
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const matches = items.filter((item) => item.search.toLowerCase().includes(query.toLowerCase()));

  return (
    <Sheet title={title} onClose={onClose}>
      <input id="pkQ" className="inp" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="listbox mt">
        {matches.map((item) => (
          <div key={item.key} className="li" role="button" tabIndex={0} onClick={() => onPick(item.key)}>
            <div className="li-b">
              <b>{item.label}</b>
              {item.sub && <small>{item.sub}</small>}
            </div>
          </div>
        ))}
        {matches.length === 0 && <div className="empty">Tidak ada yang cocok.</div>}
      </div>
    </Sheet>
  );
}
