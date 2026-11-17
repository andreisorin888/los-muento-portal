"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tip = { background: "#12101a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 12, color: "#fff" };
const axis = { stroke: "#9b97a8", fontSize: 12, tickLine: false, axisLine: false } as const;

export function HoursChart({ data }: { data: { day: string; hours: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Orele de activitate ale organizației în ultimele șapte zile">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff2e93" stopOpacity={0.55} /><stop offset="1" stopColor="#8b3dff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="day" {...axis} /><YAxis {...axis} />
          <Tooltip contentStyle={tip} cursor={{ stroke: "rgba(255,255,255,.15)" }} formatter={(v: number) => [`${v} h`, "Ore"]} />
          <Area type="monotone" dataKey="hours" stroke="#ff2e93" strokeWidth={2.5} fill="url(#hg)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChestChart({ data }: { data: { day: string; deposits: number; withdrawals: number }[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Depuneri și retrageri din seif în ultimele șapte zile">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="day" {...axis} /><YAxis {...axis} />
          <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,.04)" }} />
          <Bar dataKey="deposits" name="Depuneri" fill="#12b886" radius={[4, 4, 0, 0]} />
          <Bar dataKey="withdrawals" name="Retrageri" fill="#8b3dff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
