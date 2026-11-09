// Pure report rules, shared by the server and the forms. Names follow the mockup functions in comments.
import type { ErrorCode } from "@/config/error-codes";

export type ReportStatus = "SENT" | "IN_PROGRESS" | "REJECTED" | "DONE";
export type ReportType = "CASE_FINDING" | "REQUEST" | "QUESTION" | "GENERAL";

export const REPORT_TYPES: readonly { value: ReportType; label: string }[] = [
  { value: "CASE_FINDING", label: "Temuan Kasus" },
  { value: "REQUEST", label: "Permintaan" },
  { value: "QUESTION", label: "Pertanyaan" },
  { value: "GENERAL", label: "Umum" },
];

export const STATUS_LABEL: Record<ReportStatus, string> = {
  SENT: "Terkirim",
  IN_PROGRESS: "Ditindaklanjuti",
  REJECTED: "Ditolak",
  DONE: "Selesai",
};

export const STATUS_BADGE: Record<ReportStatus, string> = {
  SENT: "b-blue",
  IN_PROGRESS: "b-gold",
  REJECTED: "b-red",
  DONE: "b-green",
};

// K-T58: the filter order is fixed and "Semua" sits in the middle.
export const STATUS_FILTERS: readonly { value: ReportStatus | "ALL"; label: string }[] = [
  { value: "SENT", label: "Terkirim" },
  { value: "IN_PROGRESS", label: "Ditindaklanjuti" },
  { value: "ALL", label: "Semua" },
  { value: "DONE", label: "Selesai" },
  { value: "REJECTED", label: "Ditolak" },
];

export const MAX_PHOTOS = 5;

export type ReportParties = { fromId: string; toId: string; ccIds: readonly string[]; status: ReportStatus };
export type ReportActor = { id: string; isOwner: boolean; recipientLeaderIds: readonly string[] };

// Mockup lapClosed.
export function isClosed(status: ReportStatus): boolean {
  return status === "DONE" || status === "REJECTED";
}

// Mockup lapParts (K-T78): a recipient's leader and owners who only watch are not participants.
export function participantsOf(report: Pick<ReportParties, "fromId" | "toId" | "ccIds">): string[] {
  return [...new Set([report.fromId, report.toId, ...report.ccIds])];
}

// Mockup canSeeLap.
export function canSeeReport(report: ReportParties, actor: ReportActor): boolean {
  return (
    actor.isOwner ||
    report.fromId === actor.id ||
    report.toId === actor.id ||
    report.ccIds.includes(actor.id) ||
    actor.recipientLeaderIds.includes(actor.id)
  );
}

// Mockup vLapDetail action rules.
export function reportActions(report: ReportParties, actor: ReportActor) {
  const isRecipient = report.toId === actor.id;
  const isReporter = report.fromId === actor.id;
  const isRecipientLeader = actor.recipientLeaderIds.includes(actor.id);
  const open = !isClosed(report.status);
  return {
    canStart: isRecipient && report.status === "SENT",
    canReject: isRecipient && open,
    canFinish: isReporter && report.status === "IN_PROGRESS",
    canForward: open && (isRecipient || isRecipientLeader || actor.isOwner),
    canAddCc: open && (isRecipient || isReporter),
    canChat: open && canSeeReport(report, actor),
    viewsAsLeader: isRecipientLeader && !isRecipient && !isReporter,
  };
}

// Mockup lapFwd (K-T29): the previous recipient stays in as CC unless they are the reporter.
export function forwardParties(report: ReportParties, newToId: string): { toId: string; ccIds: string[] } {
  const ccIds = report.ccIds.filter((id) => id !== newToId);
  const previous = report.toId;
  if (!ccIds.includes(previous) && previous !== report.fromId) ccIds.push(previous);
  return { toId: newToId, ccIds };
}

export type ReportDraft = { title: string; type: ReportType | null; body: string; toId: string | null };

// Same check order as the mockup saveLap.
export function findReportError(draft: ReportDraft, senderId: string): ErrorCode | null {
  if (!draft.title.trim()) return "PNG-LAP-01";
  if (!draft.type) return "PNG-LAP-02";
  if (!draft.body.trim()) return "PNG-LAP-03";
  if (!draft.toId) return "PNG-LAP-04";
  if (draft.toId === senderId) return "PNG-LAP-05";
  return null;
}

// Mockup tickHTML.
export function readReceipt(senderId: string, participantIds: readonly string[], readerIds: readonly string[]) {
  const others = participantIds.filter((id) => id !== senderId);
  const readers = others.filter((id) => readerIds.includes(id));
  return { readers, allRead: others.length > 0 && readers.length === others.length };
}

// CHANGELOG 24: what the open chat compares to know a refresh would show something new.
// Reads count only on the viewer's own messages, the only ones with read receipts, so the
// viewer opening a message never changes their own version.
export type ReportVersionParts = {
  status: ReportStatus;
  toId: string;
  ccCount: number;
  messageCount: number;
  readsOnMyMessages: number;
};

export function reportVersion(parts: ReportVersionParts): string {
  return [parts.status, parts.toId, parts.ccCount, parts.messageCount, parts.readsOnMyMessages].join(":");
}

export function formatReportNumber(period: string, sequence: number): string {
  return `${period}-${String(sequence).padStart(3, "0")}`;
}
