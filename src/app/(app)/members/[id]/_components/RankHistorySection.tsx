import { Card } from "@/components/ui";

type RankEntry = {
  id: string;
  fromRank: string;
  toRank: string;
  fromLevel: number;
  toLevel: number;
  reason: string;
  performedById: string;
  createdAt: Date;
};

export function RankHistorySection({ history }: { history: RankEntry[] }) {
  return (
    <Card title="Istoric grad">
      {history.length === 0 ? (
        <p className="text-sm text-muted">Nicio schimbare de grad înregistrată.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-white/[.03]">
              <tr>
                {["Data", "De la", "La", "Motiv"].map((h) => <th key={h} className="th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-line">
                  <td className="td text-sm text-muted">{new Date(h.createdAt).toLocaleDateString("ro-RO")}</td>
                  <td className="td">{h.fromRank}</td>
                  <td className="td font-semibold">{h.toRank}</td>
                  <td className="td text-sm text-muted">{h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
