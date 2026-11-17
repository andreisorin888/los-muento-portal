import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  db: {
    member: { findUnique: vi.fn() },
    wikiPage: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    wikiVersion: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { createWikiPage, updateWikiPage, deleteWikiPage } from "@/app/actions/wiki";

const mockSession = (getServerSession as ReturnType<typeof vi.fn>);
const mockMember = (db.member.findUnique as ReturnType<typeof vi.fn>);

function setupCapo() {
  mockSession.mockResolvedValue({ user: { memberId: "capo1" } });
  mockMember.mockResolvedValue({ id: "capo1", rankLevel: 60, status: "ACTIV" });
}
function setupUnderboss() {
  mockSession.mockResolvedValue({ user: { memberId: "ub1" } });
  mockMember.mockResolvedValue({ id: "ub1", rankLevel: 90, status: "ACTIV" });
}
function setupSoldier() {
  mockSession.mockResolvedValue({ user: { memberId: "s1" } });
  mockMember.mockResolvedValue({ id: "s1", rankLevel: 30, status: "ACTIV" });
}

describe("createWikiPage – slug generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.wikiPage.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (db.wikiPage.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it("generates a kebab-case slug from the title", async () => {
    setupCapo();
    const result = await createWikiPage({ title: "Reguli Interne", body: "Corp", minLevel: 20 });
    expect(result.slug).toBe("reguli-interne");
  });

  it("strips Romanian diacritics from the slug", async () => {
    setupCapo();
    const result = await createWikiPage({ title: "Regulament și Proceduri", body: "Corp", minLevel: 20 });
    expect(result.slug).toBe("regulament-si-proceduri");
  });

  it("strips leading and trailing hyphens", async () => {
    setupCapo();
    const result = await createWikiPage({ title: "  Ghid  ", body: "Corp", minLevel: 20 });
    expect(result.slug).toBe("ghid");
  });
});

describe("createWikiPage – validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Soldier (30) cannot create a wiki page", async () => {
    setupSoldier();
    const result = await createWikiPage({ title: "Test", body: "Corp", minLevel: 20 });
    expect(result.error).toBeDefined();
  });

  it("requires a non-empty title", async () => {
    setupCapo();
    const result = await createWikiPage({ title: "   ", body: "Corp", minLevel: 20 });
    expect(result.error).toBe("Titlul este obligatoriu.");
  });

  it("requires a non-empty body", async () => {
    setupCapo();
    const result = await createWikiPage({ title: "Titlu", body: "   ", minLevel: 20 });
    expect(result.error).toBe("Conținutul este obligatoriu.");
  });

  it("rejects duplicate slugs", async () => {
    setupCapo();
    (db.wikiPage.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "existing" });
    const result = await createWikiPage({ title: "Ghid", body: "Corp", minLevel: 20 });
    expect(result.error).toBe("Există deja o pagină cu acest slug.");
  });
});

describe("deleteWikiPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Underboss (90) can delete a page", async () => {
    setupUnderboss();
    (db.wikiPage.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "p1", slug: "ghid" });
    (db.wikiPage.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await deleteWikiPage("p1");
    expect(result.error).toBeUndefined();
  });

  it("Capo (60) cannot delete a wiki page", async () => {
    setupCapo();
    const result = await deleteWikiPage("p1");
    expect(result.error).toBeDefined();
  });

  it("returns error when page not found", async () => {
    setupUnderboss();
    (db.wikiPage.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await deleteWikiPage("p1");
    expect(result.error).toBe("Pagina nu a fost găsită.");
  });
});

describe("updateWikiPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([{}, {}]);
  });

  it("Capo (60) can update a wiki page", async () => {
    setupCapo();
    (db.wikiPage.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1",
      slug: "ghid",
      body: "Versiune veche",
    });
    const result = await updateWikiPage("p1", { title: "Ghid Nou", body: "Corp nou", minLevel: 20 });
    expect(result.error).toBeUndefined();
  });

  it("returns error when page not found", async () => {
    setupCapo();
    (db.wikiPage.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await updateWikiPage("p1", { title: "T", body: "B", minLevel: 20 });
    expect(result.error).toBe("Pagina nu a fost găsită.");
  });
});
