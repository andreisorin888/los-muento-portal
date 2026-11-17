"use client";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#ec4899", "#a855f7", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

const ACTIVITY_LABELS: Record<string, string> = {
  MISIUNE: "Misiune",
  ANTRENAMENT: "Antrenament",
  EVENIMENT: "Eveniment",
  ALTELE: "Altele",
};

const ROBBERY_LABELS: Record<string, string> = {
  PLANIFICAT: "Planificat",
  REUSIT: "Reușit",
  ESUAT: "Eșuat",
  ANULAT: "Anulat",
};

type Props = {
  membersByRank: { name: string; value: number }[];
  activitiesByType: { name: string; count: number; points: number }[];
  robberyByStatus: { name: string; value: number }[];
};

export function AnalyticsCharts({ membersByRank, activitiesByType, robberyByStatus }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="panel p-5">
        <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-widest">Membri pe grad</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={membersByRank} layout="vertical" margin={{ left: 80 }}>
            <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#e5e7eb", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="value" name="Membri" radius={4}>
              {membersByRank.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel p-5">
        <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-widest">Activități pe tip (6 luni)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={activitiesByType.map((a) => ({ ...a, name: ACTIVITY_LABELS[a.name] ?? a.name }))}>
            <XAxis dataKey="name" tick={{ fill: "#e5e7eb", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="count" name="Activități" fill="#ec4899" radius={4} />
            <Bar dataKey="points" name="Puncte" fill="#f59e0b" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {robberyByStatus.length > 0 && (
        <div className="panel p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-widest">Jafuri pe status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={robberyByStatus.map((r) => ({ ...r, name: ROBBERY_LABELS[r.name] ?? r.name }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {robberyByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
