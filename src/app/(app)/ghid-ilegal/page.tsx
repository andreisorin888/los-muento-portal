import type { Metadata } from "next";
import { site } from "@/config/site";
import { GhidIlegalPage } from "./GhidIlegalPage";

export const metadata: Metadata = { title: "Ghid Ilegal" };

export default function Page() {
  if (site.showDemo) {
    return (
      <div className="space-y-5">
        <h1 className="h-page">Ghid Ilegal</h1>
        <p className="mt-1 text-sm text-muted">Disponibil pentru membrii organizației cu rol Ilegal.</p>
      </div>
    );
  }
  return <GhidIlegalPage />;
}
