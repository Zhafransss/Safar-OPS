import type { ReactNode } from "react";

import { ReportFiltersProvider } from "@/components/report-filters";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <ReportFiltersProvider>{children}</ReportFiltersProvider>;
}
