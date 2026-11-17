import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Image slots. Drop a file with one of the listed names into /public/images
 * and it replaces the built-in fallback automatically. No code changes needed.
 */
export const ASSET_SLOTS = {
  loginBg: { files: ["login-bg.jpg", "login-bg.webp", "login-bg.png"], size: "2560x1440", ratio: "16:9", where: "Login page background" },
  pendingBg: { files: ["auth-pending-bg.jpg", "auth-pending-bg.webp", "auth-pending-bg.png"], size: "2560x1440", ratio: "16:9", where: "Access-pending page background" },
  dashboardHero: { files: ["dashboard-hero.jpg", "dashboard-hero.webp", "dashboard-hero.png"], size: "2400x600", ratio: "4:1", where: "Dashboard welcome banner" },
  sidebarTexture: { files: ["sidebar-texture.jpg", "sidebar-texture.webp", "sidebar-texture.png"], size: "600x1600", ratio: "3:8", where: "Sidebar background (shown at low opacity)" },
  reportHeader: { files: ["report-header.jpg", "report-header.webp", "report-header.png"], size: "2100x500", ratio: "21:5", where: "PDF report header (Phase 5)" },
  logoEmblem: { files: ["logo-emblem.svg", "logo-emblem.png", "logo-emblem.webp"], size: "512x512", ratio: "1:1", where: "Skull emblem everywhere (login, sidebar, reports)" },
} as const;

export type AssetSlot = keyof typeof ASSET_SLOTS;

export function getAssetUrl(slot: AssetSlot): string | null {
  for (const file of ASSET_SLOTS[slot].files) {
    if (fs.existsSync(path.join(process.cwd(), "public", "images", file))) {
      return `/images/${file}`;
    }
  }
  return null;
}
