"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { formatError } from "@/config/error-codes";
import { errorText } from "@/lib/error-text";
import { useTRPC } from "@/lib/trpc-client";

// Mockup prgClose and prgCancel, shown to the team leader of an active program.
export function ProgramActions({ programId, hasOpenTasks }: { programId: string; hasOpenTasks: boolean }) {
  const [dialog, setDialog] = useState<"close" | "cancel" | null>(null);
  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const handlers = (message: string) => ({
    onSuccess: () => {
      setDialog(null);
      toast(message);
      router.refresh();
    },
    onError: (e: { message: string }) => {
      setDialog(null);
      toast(errorText(e.message));
    },
  });
  const close = useMutation(trpc.program.close.mutationOptions(handlers("Program selesai.")));
  const cancel = useMutation(trpc.program.cancel.mutationOptions(handlers("Program dibatalkan.")));

  return (
    <>
      <div className="btns mt2">
        <button className="btn sec" onClick={() => setDialog("cancel")}>
          Batalkan program
        </button>
        <button
          className="btn"
          onClick={() => (hasOpenTasks ? toast(formatError("PNG-PRG-03")) : setDialog("close"))}
        >
          Tutup program
        </button>
      </div>
      {dialog === "close" && (
        <Sheet
          title="Tutup program?"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            { label: "Tutup program", onClick: () => close.mutate({ id: programId }), disabled: close.isPending },
          ]}
        >
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            Program berstatus Selesai dan tidak bisa ditambah tugas lagi.
          </p>
        </Sheet>
      )}
      {dialog === "cancel" && (
        <Sheet
          title="Batalkan program?"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            {
              label: "Batalkan",
              variant: "warn",
              onClick: () => cancel.mutate({ id: programId }),
              disabled: cancel.isPending,
            },
          ]}
        >
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            Program berstatus Dibatalkan. Tugas yang masih berjalan ikut terkunci.
          </p>
        </Sheet>
      )}
    </>
  );
}
