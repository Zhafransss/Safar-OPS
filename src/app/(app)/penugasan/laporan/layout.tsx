import type { ReactNode } from "react";

import { ReportFiltersProvider } from "@/components/report-filters";
import { ReportList } from "@/components/report-list";
import { reportTabs } from "@/lib/report-rules";
import { getViewer } from "@/server/services/viewer";

// Desktop: the report list stays on the left and the chosen report or new-report form opens on the
// right, like a mail app. On phones .lap-split and .lap-main add no box and .lap-side is hidden, so
// every page shows on its own as in the mockup. The filters live here, so both lists share them.
export default async function ReportsLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  const tabs = viewer ? reportTabs({ isOwner: viewer.isOwner, leadsTeam: viewer.ledTeam !== null }) : [];
  return (
    <ReportFiltersProvider>
      <div className="lap-split">
        <aside className="lap-side" aria-label="Daftar laporan">
          <div className="pane-hd">Laporan</div>
          <ReportList tabs={tabs} />
        </aside>
        <div className="lap-main">{children}</div>
      </div>
    </ReportFiltersProvider>
  );
}
