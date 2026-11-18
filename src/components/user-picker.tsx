"use client";

import { ChoiceSheet } from "@/components/choice-sheet";
import type { PickerUser } from "@/server/services/team";

// Mockup openPick with pickUsers, laid out by U-06: names only, A to Z, like the simulation.
export function UserPicker({
  title,
  placeholder = "Cari nama",
  users,
  exclude,
  selectedId,
  onPick,
  onClose,
}: {
  title: string;
  placeholder?: string;
  users: PickerUser[];
  exclude: readonly (string | null)[];
  selectedId?: string | null;
  onPick: (userId: string) => void;
  onClose: () => void;
}) {
  const items = users
    .filter((user) => !exclude.includes(user.id))
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .map((user) => ({ key: user.id, label: user.name, search: user.name }));

  return (
    <ChoiceSheet
      title={title}
      placeholder={placeholder}
      items={items}
      selectedKey={selectedId}
      onPick={onPick}
      onClose={onClose}
    />
  );
}
