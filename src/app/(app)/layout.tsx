import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { RefreshOnFocus } from "@/components/refresh-on-focus";
import { getViewer, getWorkSummary } from "@/server/services/viewer";

// Every page here needs a session and per-user data.
export const dynamic = "force-dynamic";

// On phones .shell and .shell-main add no box and the sidebar is hidden, so pages keep the mockup
// layout. From 1024 px the sidebar sits beside the page (app.css, desktop section).
export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { newReports, myTodos } = await getWorkSummary(viewer.id);
  return (
    <>
      <RefreshOnFocus />
      <div className="shell">
        <AppSidebar viewer={viewer} newReports={newReports} myTodos={myTodos} />
        <div className="shell-main">{children}</div>
      </div>
    </>
  );
}
