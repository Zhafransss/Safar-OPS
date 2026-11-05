import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { RefreshOnFocus } from "@/components/refresh-on-focus";
import { getViewer } from "@/server/services/viewer";

// Every page here needs a session and per-user data.
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return (
    <>
      <RefreshOnFocus />
      {children}
    </>
  );
}
