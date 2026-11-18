"use client";

import { useState } from "react";

import { ChoiceSheet } from "@/components/choice-sheet";
import type { TeamMemberOption } from "@/server/services/assignment";

const labelOf = (member: TeamMemberOption) => `${member.name}${member.isLeader ? " (leader)" : ""}`;

// U-06 for the to-do PIC: a picker field instead of a native select. The leader stays pickable,
// since leaders work on to-dos too (U-02).
export function PicField({
  id,
  members,
  value,
  placeholder,
  onChange,
}: {
  id?: string;
  members: TeamMemberOption[];
  value: string;
  placeholder: string;
  onChange: (picId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = members.find((member) => member.id === value);

  return (
    <>
      <button id={id} type="button" className="picker pic-field" onClick={() => setOpen(true)}>
        {current ? <span>{labelOf(current)}</span> : <span className="ph">{placeholder}</span>}
        <span className="muted">›</span>
      </button>
      {open && (
        <ChoiceSheet
          title="Pilih PIC"
          placeholder="Cari nama"
          items={[...members]
            .sort((a, b) => a.name.localeCompare(b.name, "id"))
            .map((member) => ({ key: member.id, label: labelOf(member), search: member.name }))}
          selectedKey={value || null}
          onPick={(picId) => {
            onChange(picId);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
