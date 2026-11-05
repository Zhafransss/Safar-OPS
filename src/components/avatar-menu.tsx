"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Sheet } from "@/components/sheet";
import { useTRPC } from "@/lib/trpc-client";

// FR-AUT-05: the mockup has no logout, so it lives behind the avatar without adding anything to the screen.
export function AvatarMenu({ initials, name }: { initials: string; name: string }) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const logout = useMutation(
    trpc.auth.logout.mutationOptions({
      // A full navigation drops every cached query of this user.
      onSettled: () => window.location.assign("/login"),
    }),
  );

  return (
    <>
      <button className="ava" onClick={() => setOpen(true)} aria-label={`Akun ${name}`}>
        {initials}
      </button>
      {open && (
        <Sheet
          title="Keluar dari akun?"
          onClose={() => setOpen(false)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setOpen(false) },
            { label: "Keluar", variant: "warn", onClick: () => logout.mutate(), disabled: logout.isPending },
          ]}
        >
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            Anda masuk sebagai {name}.
          </p>
        </Sheet>
      )}
    </>
  );
}
