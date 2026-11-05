"use client";

import { useState } from "react";

import { RoleLabel } from "@/components/role-label";
import { Sheet } from "@/components/sheet";
import type { PickerUser } from "@/server/services/team";

// Mockup openPick with pickUsers.
export function UserPicker({
  title,
  placeholder = "Cari",
  users,
  exclude,
  onPick,
  onClose,
}: {
  title: string;
  placeholder?: string;
  users: PickerUser[];
  exclude: readonly (string | null)[];
  onPick: (userId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const matches = users.filter(
    (user) => !exclude.includes(user.id) && user.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Sheet title={title} onClose={onClose}>
      <input id="pkQ" className="inp" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="listbox mt">
        {matches.map((user) => (
          <div key={user.id} className="li" role="button" tabIndex={0} onClick={() => onPick(user.id)}>
            <div className="li-b">
              <b>{user.name}</b>
              <small>
                <RoleLabel viewer={user} />
              </small>
            </div>
          </div>
        ))}
        {matches.length === 0 && <div className="empty">Tidak ada yang cocok.</div>}
      </div>
    </Sheet>
  );
}
