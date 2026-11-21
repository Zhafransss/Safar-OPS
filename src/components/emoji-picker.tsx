"use client";

import { useEffect, useState } from "react";

// CHANGELOG 60: a small set of common emoji, grouped. The phone keyboard still has the full set.
const GROUPS: { label: string; emoji: string[] }[] = [
  {
    label: "Wajah",
    emoji: [..."😀😃😄😁😆😅🤣😂🙂😉😊😇🥰😍🤩😘😋😜🤪🤗🤭🤔🤨😐😑😶🙄😏😴😌😔😪😷🤒🥵🥶🤯🥳😎🤓🧐😕😟🙁😮😲😳🥺😢😭😤😠😡🤬😱😨😰😥😓"],
  },
  {
    label: "Tangan",
    emoji: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "👋", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🫡", "🫶"],
  },
  {
    label: "Kerja",
    emoji: ["📌", "📎", "📝", "📄", "📑", "📊", "📈", "📉", "🗂️", "📁", "📅", "⏰", "⏳", "✅", "☑️", "❌", "⚠️", "❗", "❓", "💯", "🔥", "⭐", "✨", "🎉", "🏆", "💼", "🛒", "📦", "🚚", "💰", "💵", "🧾", "📞", "📱", "💻", "🖨️", "🔒", "🔑", "💡", "📣", "🔔"],
  },
  {
    label: "Simbol",
    emoji: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💕", "💖", "👀", "💬", "💭", "✔️", "➕", "➖", "➡️", "⬅️", "⬆️", "⬇️", "🔄", "🆗", "🆕"],
  },
];

// The last emoji picked on this device come first. A convenience only, so storage may fail quietly.
const RECENT_KEY = "hris-emoji-recent";
const RECENT_MAX = 16;

function readRecent(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [recent, setRecent] = useState<string[]>([]);
  const groups = recent.length ? [{ label: "Terakhir", emoji: recent }, ...GROUPS] : GROUPS;
  const [active, setActive] = useState(0);

  useEffect(() => setRecent(readRecent()), []);

  function pick(emoji: string) {
    onPick(emoji);
    const next = [emoji, ...readRecent().filter((item) => item !== emoji)].slice(0, RECENT_MAX);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Private browsing may refuse storage; the list just does not remember.
    }
  }

  const shown = groups[Math.min(active, groups.length - 1)];
  return (
    <div className="emoji-panel" role="dialog" aria-label="Pilih emoji">
      <div className="emoji-tabs" role="tablist">
        {groups.map((group, index) => (
          <button
            key={group.label}
            role="tab"
            aria-selected={group === shown}
            className={group === shown ? "is-on" : ""}
            onClick={() => setActive(index)}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div className="emoji-grid">
        {shown?.emoji.map((emoji) => (
          <button key={emoji} onClick={() => pick(emoji)} aria-label={emoji}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
