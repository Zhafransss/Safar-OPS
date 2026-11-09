import { describe, expect, it } from "vitest";

import {
  canSeeReport,
  findReportError,
  forwardParties,
  formatReportNumber,
  participantsOf,
  readReceipt,
  reportActions,
  reportVersion,
  type ReportActor,
  type ReportParties,
} from "@/lib/report-rules";

const report: ReportParties = { fromId: "rudi", toId: "zarkasih", ccIds: ["dimas"], status: "SENT" };
const actor = (id: string, extra: Partial<ReportActor> = {}): ReportActor => ({
  id,
  isOwner: false,
  recipientLeaderIds: [],
  ...extra,
});

describe("canSeeReport (FR-LAP-17)", () => {
  it.each(["rudi", "zarkasih", "dimas"])("lets participant %s see it", (id) => {
    expect(canSeeReport(report, actor(id))).toBe(true);
  });

  it("lets the recipient's leader and owners see it", () => {
    expect(canSeeReport(report, actor("kartika", { recipientLeaderIds: ["kartika"] }))).toBe(true);
    expect(canSeeReport(report, actor("owner", { isOwner: true }))).toBe(true);
  });

  it("refuses everyone else", () => {
    expect(canSeeReport(report, actor("orang", { recipientLeaderIds: ["kartika"] }))).toBe(false);
  });
});

describe("reportActions (FR-LAP-04, 07, 08)", () => {
  it("lets only the recipient start and reject", () => {
    expect(reportActions(report, actor("zarkasih"))).toMatchObject({ canStart: true, canReject: true });
    expect(reportActions(report, actor("rudi"))).toMatchObject({ canStart: false, canReject: false });
    expect(reportActions(report, actor("owner", { isOwner: true }))).toMatchObject({ canStart: false, canReject: false });
  });

  it("lets the recipient still reject while in progress, but not start again", () => {
    const inProgress = { ...report, status: "IN_PROGRESS" as const };
    expect(reportActions(inProgress, actor("zarkasih"))).toMatchObject({ canStart: false, canReject: true });
  });

  it("lets only the reporter finish, and only from in progress", () => {
    expect(reportActions(report, actor("rudi")).canFinish).toBe(false);
    expect(reportActions({ ...report, status: "IN_PROGRESS" }, actor("rudi")).canFinish).toBe(true);
    expect(reportActions({ ...report, status: "IN_PROGRESS" }, actor("zarkasih")).canFinish).toBe(false);
  });

  it("allows forwarding by the recipient, their leader and owners", () => {
    expect(reportActions(report, actor("zarkasih")).canForward).toBe(true);
    expect(reportActions(report, actor("kartika", { recipientLeaderIds: ["kartika"] })).canForward).toBe(true);
    expect(reportActions(report, actor("owner", { isOwner: true })).canForward).toBe(true);
    expect(reportActions(report, actor("rudi")).canForward).toBe(false);
  });

  it("allows CC by the reporter and recipient only", () => {
    expect(reportActions(report, actor("rudi")).canAddCc).toBe(true);
    expect(reportActions(report, actor("dimas")).canAddCc).toBe(false);
  });

  it.each(["DONE", "REJECTED"] as const)("locks everything once %s (K-T31, K-T51)", (status) => {
    const closed = { ...report, status };
    expect(reportActions(closed, actor("zarkasih"))).toMatchObject({
      canStart: false,
      canReject: false,
      canForward: false,
      canAddCc: false,
      canChat: false,
    });
  });

  it("marks a leader who is only watching", () => {
    expect(reportActions(report, actor("kartika", { recipientLeaderIds: ["kartika"] })).viewsAsLeader).toBe(true);
    expect(reportActions(report, actor("zarkasih", { recipientLeaderIds: ["zarkasih"] })).viewsAsLeader).toBe(false);
  });
});

describe("forwardParties (K-T29)", () => {
  it("moves the old recipient to CC", () => {
    expect(forwardParties(report, "kartika")).toEqual({ toId: "kartika", ccIds: ["dimas", "zarkasih"] });
  });

  it("removes the new recipient from CC", () => {
    expect(forwardParties(report, "dimas")).toEqual({ toId: "dimas", ccIds: ["zarkasih"] });
  });

  it("does not add the reporter as CC", () => {
    expect(forwardParties({ ...report, toId: "rudi" }, "kartika").ccIds).toEqual(["dimas"]);
  });
});

describe("findReportError", () => {
  const valid = { title: "Judul", type: "GENERAL" as const, body: "Isi", toId: "zarkasih" };

  it.each([
    [{ ...valid, title: "  " }, "PNG-LAP-01"],
    [{ ...valid, type: null }, "PNG-LAP-02"],
    [{ ...valid, body: "" }, "PNG-LAP-03"],
    [{ ...valid, toId: null }, "PNG-LAP-04"],
    [{ ...valid, toId: "rudi" }, "PNG-LAP-05"],
  ])("reports %j as %s", (draft, code) => {
    expect(findReportError(draft, "rudi")).toBe(code);
  });

  it("reports the title first", () => {
    expect(findReportError({ title: "", type: null, body: "", toId: null }, "rudi")).toBe("PNG-LAP-01");
  });

  it("accepts a valid report", () => {
    expect(findReportError(valid, "rudi")).toBeNull();
  });
});

describe("readReceipt (K-T78)", () => {
  const parts = participantsOf(report);

  it("is grey with no readers", () => {
    expect(readReceipt("rudi", parts, [])).toEqual({ readers: [], allRead: false });
  });

  it("stays grey until everyone has read", () => {
    expect(readReceipt("rudi", parts, ["zarkasih"])).toEqual({ readers: ["zarkasih"], allRead: false });
  });

  it("turns blue when all other participants have read", () => {
    expect(readReceipt("rudi", parts, ["zarkasih", "dimas"]).allRead).toBe(true);
  });

  it("ignores readers who are not participants", () => {
    expect(readReceipt("rudi", parts, ["owner", "kartika"])).toEqual({ readers: [], allRead: false });
  });
});

describe("formatReportNumber (K-T83)", () => {
  it("pads the sequence to three digits", () => {
    expect(formatReportNumber("2610", 7)).toBe("2610-007");
  });
});

describe("reportVersion (CHANGELOG 24)", () => {
  const base = { status: "SENT" as const, toId: "zarkasih", ccCount: 1, messageCount: 3, readsOnMyMessages: 2 };

  it("stays the same while nothing visible changed", () => {
    expect(reportVersion(base)).toBe(reportVersion({ ...base }));
  });

  it.each([
    ["a new message", { messageCount: 4 }],
    ["a new read on my message", { readsOnMyMessages: 3 }],
    ["a status change", { status: "IN_PROGRESS" as const }],
    ["a forward", { toId: "dimas" }],
    ["a new CC", { ccCount: 2 }],
  ])("changes on %s", (_label, change) => {
    expect(reportVersion({ ...base, ...change })).not.toBe(reportVersion(base));
  });
});
