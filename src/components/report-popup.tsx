"use client";

import { PhotoThumbs, photoUrl } from "@/components/photo-thumbs";
import { Sheet } from "@/components/sheet";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/report-rules";
import type { ReportPopupData } from "@/server/services/assignment";

// Mockup lapModal (K-T04): the attached report, read without leaving the task.
export function ReportPopup({ report, onClose }: { report: ReportPopupData; onClose: () => void }) {
  return (
    <Sheet title={report.number} onClose={onClose} actions={[{ label: "Tutup", variant: "sec", onClick: onClose }]}>
      <b style={{ fontSize: 14 }}>{report.title}</b>
      <div className="small muted" style={{ marginTop: 2 }}>
        {report.typeLabel} · dari {report.fromName} ke {report.toName} · {report.created}
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>{report.body}</p>
      {report.photoIds.length > 0 && <PhotoThumbs sources={report.photoIds.map(photoUrl)} />}
      <div className="mt">
        <span className={`badge ${STATUS_BADGE[report.status]}`}>{STATUS_LABEL[report.status]}</span>
      </div>
    </Sheet>
  );
}
