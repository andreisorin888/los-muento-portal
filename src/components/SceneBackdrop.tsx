import { getAssetUrl, type AssetSlot } from "@/config/assets";
import { ViceSkyline } from "./ViceSkyline";

/** Full-bleed scene. Uses the photo from /public/images when present, else the built-in skyline. */
export function SceneBackdrop({ slot, strength = "normal" }: { slot: AssetSlot; strength?: "normal" | "heavy" }) {
  const photo = getAssetUrl(slot);
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
      {photo ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />
      ) : (
        <ViceSkyline className="absolute inset-0 h-full w-full" />
      )}
      <div className={strength === "heavy" ? "absolute inset-0 bg-ink/70" : "absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-ink/80"} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(7,5,12,.75)_100%)]" />
    </div>
  );
}
