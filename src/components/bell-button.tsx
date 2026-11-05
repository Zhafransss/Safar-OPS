"use client";

import { useState } from "react";

import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";

// The grouped list, swipe and undo arrive in Sprint 4. Nothing can create a notification before then.
export function BellButton({ count, small = false }: { count: number; small?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={small ? "bell sm" : "bell"} onClick={() => setOpen(true)} aria-label="Notifikasi">
        <Icon name="bell" size={small ? 19 : 20} />
        {count > 0 && <span className="cnt">{count}</span>}
      </button>
      {open && (
        <Sheet title="Notifikasi" onClose={() => setOpen(false)}>
          <div className="empty">Tidak ada notifikasi.</div>
        </Sheet>
      )}
    </>
  );
}
