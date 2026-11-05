import { describe, expect, it } from "vitest";

import { findTemplateError, normalizeTemplate } from "@/server/services/template-rules";

describe("template rules", () => {
  it("ignores blank to-do rows", () => {
    expect(normalizeTemplate({ name: " Promo ", todos: ["  Foto ", "", "   "] })).toEqual({ name: "Promo", todos: ["Foto"] });
  });

  it("requires a name first", () => {
    expect(findTemplateError({ name: "", todos: [] })).toBe("PNG-TPL-01");
  });

  it("requires at least one to-do", () => {
    expect(findTemplateError(normalizeTemplate({ name: "Promo", todos: ["  "] }))).toBe("PNG-TPL-02");
  });

  it("accepts a valid template", () => {
    expect(findTemplateError({ name: "Promo", todos: ["Foto"] })).toBeNull();
  });
});
