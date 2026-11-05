import { describe, expect, it } from "vitest";

import { TEAM_PALETTE } from "@/config/team-palette";
import { findTeamError, firstFreeColor, normalizeDraft, type ExistingTeam } from "@/server/services/team-rules";

const teams: ExistingTeam[] = [{ id: "t1", name: "Tim Produk", color: "#7C4DCC", leaderId: "kartika" }];
const nameOf = (id: string) => ({ kartika: "Kartika", dimas: "Dimas" })[id] ?? id;
const valid = { name: "Tim Gudang", color: "#138A8A", leaderId: "dimas", staffIds: ["rudi"] };

describe("findTeamError", () => {
  it("accepts a valid team", () => {
    expect(findTeamError(valid, null, teams, nameOf)).toBeNull();
  });

  it("reports the name first, like the mockup", () => {
    expect(findTeamError({ ...valid, name: "", leaderId: null, staffIds: [] }, null, teams, nameOf)?.code).toBe("PNG-TIM-01");
  });

  it("requires a leader before staff", () => {
    expect(findTeamError({ ...valid, leaderId: null, staffIds: [] }, null, teams, nameOf)?.code).toBe("PNG-TIM-02");
  });

  it("rejects a leader of another team and names both", () => {
    expect(findTeamError({ ...valid, leaderId: "kartika" }, null, teams, nameOf)).toEqual({
      code: "PNG-TIM-03",
      params: { Nama: "Kartika", Tim: "Tim Produk" },
    });
  });

  it("allows a team to keep its own leader and color", () => {
    const own = { name: "Tim Produk", color: "#7C4DCC", leaderId: "kartika", staffIds: ["rudi"] };
    expect(findTeamError(own, "t1", teams, nameOf)).toBeNull();
  });

  it("requires at least one staff", () => {
    expect(findTeamError({ ...valid, staffIds: [] }, null, teams, nameOf)?.code).toBe("PNG-TIM-04");
  });

  it("rejects a color used by another team", () => {
    expect(findTeamError({ ...valid, color: "#7C4DCC" }, null, teams, nameOf)).toEqual({
      code: "PNG-TIM-07",
      params: { "nama tim": "Tim Produk" },
    });
  });
});

describe("normalizeDraft", () => {
  const assignable = new Set(["dimas", "rudi", "kartika"]);

  it("trims the name, removes duplicates and drops the leader from staff", () => {
    const draft = normalizeDraft({ ...valid, name: "  Tim  ", staffIds: ["rudi", "rudi", "dimas"] }, assignable);
    expect(draft).toMatchObject({ name: "Tim", staffIds: ["rudi"] });
  });

  it("drops owners and unknown users (K-T72)", () => {
    const draft = normalizeDraft({ ...valid, leaderId: "owner", staffIds: ["owner", "rudi"] }, assignable);
    expect(draft).toMatchObject({ leaderId: null, staffIds: ["rudi"] });
  });
});

describe("firstFreeColor", () => {
  it("returns the first unused palette color", () => {
    expect(firstFreeColor(["#7C4DCC"])).toBe("#138A8A");
  });

  it("returns null when all 8 are used", () => {
    expect(firstFreeColor(TEAM_PALETTE.map((entry) => entry.color))).toBeNull();
  });
});
