"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { formatError } from "@/config/error-codes";

export function AddTeamButton({ paletteFull }: { paletteFull: boolean }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <button
      className="btn block mt"
      onClick={() => (paletteFull ? toast(formatError("PNG-TIM-08")) : router.push("/penugasan/tim/baru"))}
    >
      <Icon name="plus" size={18} /> Tambah tim
    </button>
  );
}
