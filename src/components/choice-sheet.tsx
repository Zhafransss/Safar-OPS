"use client";

import { useState, type ReactNode } from "react";

import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";

// Callers pass items already in display order: A to Z by name under U-06.
export type Choice = { key: string; label: ReactNode; sub?: string; search: string };

// U-06: three choices at most, the rest is reached by searching.
const VISIBLE = 3;

// Hasil Uji 1 U-06 simulation: a search box on top, at most three rows in the order given,
// a "Ketik untuk mencari n lainnya" hint, and a list that keeps its height while searching.
// `lead` is a row above the three that is not counted, like "Semua tim" in U-07.
export function ChoiceList({
  placeholder,
  items,
  selectedKey,
  lead,
  autoFocus = false,
  onPick,
}: {
  placeholder: string;
  items: Choice[];
  selectedKey?: string | null;
  lead?: Choice;
  autoFocus?: boolean;
  onPick: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = needle ? items.filter((item) => item.search.toLowerCase().includes(needle)) : items;
  const shown = matches.slice(0, VISIBLE);
  const hidden = needle ? 0 : items.length - shown.length;

  const row = (item: Choice) => {
    const selected = item.key === selectedKey;
    return (
      <button key={item.key} className={`choice ${selected ? "is-picked" : ""}`} onClick={() => onPick(item.key)}>
        <span className="choice-b">
          <span>{item.label}</span>
          {item.sub && <small>{item.sub}</small>}
        </span>
        {selected && <Icon name="check" size={18} />}
      </button>
    );
  };

  return (
    <>
      <div className="qbox">
        <Icon name="search" size={16} />
        <input
          className="inp"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
        />
      </div>
      <div className={`choice-list ${items.some((item) => item.sub) ? "has-sub" : ""}`}>
        {lead && !needle && row(lead)}
        {shown.map(row)}
        {needle && matches.length === 0 && <div className="choice-none">Tidak ada hasil</div>}
        {hidden > 0 && <div className="choice-more">Ketik untuk mencari {hidden} lainnya</div>}
      </div>
    </>
  );
}

export function ChoiceSheet({
  title,
  placeholder,
  items,
  selectedKey,
  onPick,
  onClose,
}: {
  title: string;
  placeholder: string;
  items: Choice[];
  selectedKey?: string | null;
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      <ChoiceList placeholder={placeholder} items={items} selectedKey={selectedKey} onPick={onPick} autoFocus />
    </Sheet>
  );
}
