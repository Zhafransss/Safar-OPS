"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ReportStatus } from "@/lib/report-rules";
import type { ReportTab } from "@/server/services/report";

type Filters = {
  tab: ReportTab;
  setTab: (tab: ReportTab) => void;
  status: ReportStatus | "ALL";
  setStatus: (status: ReportStatus | "ALL") => void;
  query: string;
  setQuery: (query: string) => void;
};

const FiltersContext = createContext<Filters | null>(null);

export function useReportFilters(): Filters {
  const filters = useContext(FiltersContext);
  if (!filters) throw new Error("useReportFilters needs ReportFiltersProvider");
  return filters;
}

// The mockup keeps the tab across visits but resets only filter and search (openLapList).
// Logout is a full page load, so this never carries over to another account.
let rememberedTab: ReportTab = "saya";

// Mounted by the Laporan layout: filters survive list to detail and back,
// and reset when the menu is opened again from the hub (K-T75).
export function ReportFiltersProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<ReportTab>(rememberedTab);
  const [status, setStatus] = useState<ReportStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const value = useMemo(
    () => ({
      tab,
      setTab: (next: ReportTab) => {
        rememberedTab = next;
        setTabState(next);
      },
      status,
      setStatus,
      query,
      setQuery,
    }),
    [tab, status, query],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}
