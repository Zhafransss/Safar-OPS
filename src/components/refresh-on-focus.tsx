"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// FR-PWA-03: server-rendered pages do not use TanStack Query, so they need their own refresh.
// An installed PWA has no reload button, and K-T42 rules out polling.
export function RefreshOnFocus() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [router]);
  return null;
}
