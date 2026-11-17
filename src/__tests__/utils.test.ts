import { describe, it, expect } from "vitest";
import { cn, toneFor } from "@/lib/utils";

describe("cn", () => {
  it("joins class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });
  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
  it("returns empty string for all falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("toneFor", () => {
  it("aprobat → emerald", () => expect(toneFor("APROBAT")).toBe("emerald"));
  it("activ → emerald", () => expect(toneFor("ACTIV")).toBe("emerald"));
  it("finalizat → emerald", () => expect(toneFor("FINALIZAT")).toBe("emerald"));
  it("controlat → emerald", () => expect(toneFor("CONTROLAT")).toBe("emerald"));
  it("așteptare → gold", () => expect(toneFor("AȘTEPTARE")).toBe("gold"));
  it("probă → gold", () => expect(toneFor("PROBATORIE")).toBe("gold"));
  it("respins → rose", () => expect(toneFor("RESPINS")).toBe("rose"));
  it("eșuat → rose", () => expect(toneFor("EȘUAT")).toBe("rose"));
  it("suspendat → rose", () => expect(toneFor("SUSPENDAT")).toBe("rose"));
  it("contestat → orange", () => expect(toneFor("CONTESTAT")).toBe("orange"));
  it("unknown value → neutral", () => expect(toneFor("ALTELE")).toBe("neutral"));
});
