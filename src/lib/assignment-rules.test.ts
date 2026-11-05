import { describe, expect, it } from "vitest";

import {
  dueRank,
  findRevisionError,
  findTaskError,
  findTodoError,
  isTaskVisible,
  progressOf,
  worstDue,
  worstDueSummary,
} from "@/lib/assignment-rules";

const today = "2026-11-05";
const open = (dueIso: string) => ({ isDone: false, dueIso });

describe("dueRank (K-T71)", () => {
  it.each([
    ["2026-11-04", 5],
    ["2026-10-01", 5],
    ["2026-11-05", 4],
    ["2026-11-06", 3],
    ["2026-11-07", 2],
    ["2026-11-08", 1],
    ["2026-11-09", 0],
  ])("rates %s as %i", (due, rank) => {
    expect(dueRank(open(due), today)).toBe(rank);
  });

  it("ignores ticked to-dos, even when late", () => {
    expect(dueRank({ isDone: true, dueIso: "2026-01-01" }, today)).toBe(0);
  });

  it("crosses month boundaries by calendar day", () => {
    expect(dueRank(open("2026-12-01"), "2026-11-30")).toBe(3);
  });
});

describe("worstDue", () => {
  const todos = [open("2026-11-04"), open("2026-11-03"), open("2026-11-05"), open("2026-12-01")];

  it("picks the most urgent level", () => {
    expect(worstDue(todos, today)).toBe(5);
  });

  it("counts only that level in the summary", () => {
    expect(worstDueSummary(todos, today)).toEqual({ text: "2 to-do terlambat", badge: "b-late" });
  });

  it("has no summary when nothing is close", () => {
    expect(worstDueSummary([open("2026-12-01")], today)).toBeNull();
  });
});

describe("progressOf (K-T67)", () => {
  it("counts QC as a step", () => {
    expect(progressOf([{ isDone: true }, { isDone: false }], false)).toEqual({ done: 1, total: 3, percent: 33 });
  });

  it("only reaches 100% after QC", () => {
    expect(progressOf([{ isDone: true }], false).percent).toBe(50);
    expect(progressOf([{ isDone: true }], true).percent).toBe(100);
  });
});

describe("findTodoError", () => {
  const anyone = () => true;
  const valid = { name: "Foto", picId: "rudi", dueIso: "2026-11-10", instruction: "" };

  it("accepts a valid to-do", () => {
    expect(findTodoError([valid], today, anyone)).toBeNull();
  });

  it("numbers the to-do with the missing name", () => {
    expect(findTodoError([valid, { ...valid, name: " " }], today, anyone)).toEqual({ code: "PNG-TDO-01", params: { n: 2 } });
  });

  it("requires a PIC, then a DL", () => {
    expect(findTodoError([{ ...valid, picId: "" }], today, anyone)?.code).toBe("PNG-TDO-02");
    expect(findTodoError([{ ...valid, dueIso: "" }], today, anyone)?.code).toBe("PNG-TDO-03");
  });

  it("refuses a PIC outside the team (K-T34)", () => {
    expect(findTodoError([valid], today, () => false)?.code).toBe("PNG-TDO-02");
  });

  it("refuses a past DL but accepts today", () => {
    expect(findTodoError([{ ...valid, dueIso: "2026-11-04" }], today, anyone)?.code).toBe("PNG-TDO-04");
    expect(findTodoError([{ ...valid, dueIso: today }], today, anyone)).toBeNull();
  });

  it("lets a late to-do keep its DL when edited (CHANGELOG 1)", () => {
    const late = { ...valid, dueIso: "2026-11-01" };
    expect(findTodoError([late], today, anyone, "2026-11-01")).toBeNull();
    expect(findTodoError([{ ...late, dueIso: "2026-11-02" }], today, anyone, "2026-11-01")?.code).toBe("PNG-TDO-04");
  });
});

describe("findTaskError", () => {
  const anyone = () => true;

  it("requires a name, then a to-do", () => {
    expect(findTaskError(" ", [], today, anyone)?.code).toBe("PNG-TGS-01");
    expect(findTaskError("Tugas", [], today, anyone)?.code).toBe("PNG-TGS-02");
  });
});

describe("findRevisionError", () => {
  it("needs at least one to-do", () => {
    expect(findRevisionError([])?.code).toBe("PNG-QC-01");
  });

  it("needs a note on each one and names the first missing", () => {
    expect(findRevisionError([{ todoName: "Foto", note: "ok" }, { todoName: "Edit", note: " " }])).toEqual({
      code: "PNG-QC-02",
      params: { "nama to-do": "Edit" },
    });
  });
});

describe("isTaskVisible (K-T15)", () => {
  it("shows every task to managers", () => {
    expect(isTaskVisible(true, [], "rudi")).toBe(true);
  });

  it("shows staff only tasks holding their to-do", () => {
    expect(isTaskVisible(false, [{ picId: "rudi" }], "rudi")).toBe(true);
    expect(isTaskVisible(false, [{ picId: "dimas" }], "rudi")).toBe(false);
  });
});
