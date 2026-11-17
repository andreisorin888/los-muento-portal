import type { StashItem } from "@prisma/client";

export const STASH_ITEMS: { item: StashItem; label: string; emoji: string }[] = [
  { item: "TEC", label: "Tec-9", emoji: "🔫" },
  { item: "GLOANTE_TEC", label: "Gloanțe Tec", emoji: "🔶" },
  { item: "VESTA", label: "Vestă", emoji: "🦺" },
  { item: "TRUSA_MEDICALA", label: "Trusă medicală", emoji: "🩹" },
  { item: "PASTILE", label: "Pastile", emoji: "💊" },
];
