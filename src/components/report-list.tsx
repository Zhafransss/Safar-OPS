"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { useReportFilters } from "@/components/report-filters";
import { STATUS_BADGE, STATUS_FILTERS, STATUS_LABEL } from "@/lib/report-rules";
import { useTRPC } from "@/lib/trpc-client";
import type { ReportCard, ReportTab } from "@/server/services/report";

function Card({ report }: { report: ReportCard }) {
  return (
    <Link className={`lapcard ${report.unread ? "unread" : ""}`} href={`/penugasan/laporan/${report.number}`}>
      <div className="l1">
        <span>
          {report.unread && <span className="dot" />}
          {report.number} · {report.typeLabel}
        </span>
        <span className={`badge ${STATUS_BADGE[report.status]}`}>{STATUS_LABEL[report.status]}</span>
      </div>
      <div className="l2">{report.title}</div>
      <div className="l3">
        {report.direction} · {report.age}
        {report.messageCount > 0 && ` · ${report.messageCount} pesan`}
      </div>
    </Link>
  );
}

// Mockup vLapList.
export function ReportList({ tabs }: { tabs: { value: ReportTab; label: string }[] }) {
  const filters = useReportFilters();
  const tab = tabs.some((candidate) => candidate.value === filters.tab) ? filters.tab : "saya";
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.report.list.queryOptions(
      { tab, status: filters.status, query: filters.query },
      { placeholderData: keepPreviousData },
    ),
  );
  const trimmed = filters.query.trim();

  return (
    <>
      {tabs.length > 1 && (
        <div className="mtabs">
          {tabs.map((candidate) => (
            <button
              key={candidate.value}
              className={tab === candidate.value ? "on" : ""}
              onClick={() => filters.setTab(candidate.value)}
            >
              {candidate.label}
            </button>
          ))}
        </div>
      )}
      <div className="pad">
        <Link className="btn block" href="/penugasan/laporan/baru">
          <Icon name="plus" size={18} /> Buat laporan
        </Link>
        <div className="qbox mt">
          <Icon name="search" size={18} />
          <input
            id="lapQ"
            className="inp"
            type="search"
            placeholder="Cari no. laporan atau judul"
            value={filters.query}
            onChange={(event) => filters.setQuery(event.target.value)}
            aria-label="Cari laporan"
          />
        </div>
        <div className="pills mt">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={`pill ${filters.status === filter.value ? "on" : ""}`}
              onClick={() => filters.setStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {tab === "tim" && (
          <p className="small muted mt">
            Laporan yang ditujukan ke staff tim Anda. Anda bisa melihat, membalas, dan meneruskan.
          </p>
        )}
        <div id="lapRes">
          {data?.map((report) => <Card key={report.number} report={report} />)}
          {data?.length === 0 && (
            <div className="empty">
              {trimmed ? `Tidak ada laporan yang cocok dengan "${trimmed}".` : "Belum ada laporan."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
