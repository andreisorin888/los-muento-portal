"use client";
import { useState } from "react";
import { Badge, Card, Field } from "./ui";
import { Modal } from "./Modal";
import { DataTable } from "./DataTable";
import { useToast } from "./Toast";
import { activity } from "@/lib/demo-data";

const swatches = [
  ["Ink", "#07050c", "Fundal principal"], ["Cărbune", "#12101a", "Bară laterală, dialoguri"], ["Panou", "#181521", "Carduri"],
  ["Roz neon", "#ff2e93", "Acțiune principală, atmosferă"], ["Violet", "#8b3dff", "Atmosferă secundară"], ["Apus", "#ff7a3d", "Accente calde"],
  ["Smarald", "#12b886", "Identitatea LOS MUENTO, succes"], ["Aur", "#d9a93c", "Premium, grade, emblemă"], ["Estompat", "#9b97a8", "Text secundar"],
];

export function DesignSystemDemo() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="space-y-5">
      <div><h1 className="h-page">Design system</h1><p className="mt-1 text-sm text-muted">Toate componentele reutilizabile într-un singur loc. Construiește ecrane noi din ele.</p></div>
      <Card title="Culori">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {swatches.map(([n, c, u]) => (
            <div key={n} className="overflow-hidden rounded-xl border border-line"><div className="h-16" style={{ background: c }} /><div className="p-3"><p className="text-sm font-semibold">{n} <span className="font-mono text-xs text-muted">{c}</span></p><p className="text-xs text-muted">{u}</p></div></div>
          ))}
        </div>
      </Card>
      <Card title="Tipografie">
        <p className="font-display text-6xl font-black uppercase tracking-wide">Big Shoulders Display</p>
        <p className="mt-1 text-sm text-muted">Titluri, cifre și sigla text. Textul obișnuit folosește Manrope.</p>
        <p className="mt-4 max-w-prose text-base text-white/85">Textul obișnuit are 14-16 pixeli, cu spațiere generoasă, iar rândurile rămân sub 80 de caractere ca descrierile lungi să se citească ușor.</p>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Butoane și etichete">
          <div className="flex flex-wrap gap-2.5">
            <button className="btn-primary">Aprobă</button><button className="btn-gold">Promovează</button><button className="btn-ghost">Anulează</button><button className="btn-danger">Respinge</button><button className="btn-primary" disabled>Dezactivat</button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><Badge>Aprobat</Badge><Badge>În așteptare</Badge><Badge>Respins</Badge><Badge>Contestat</Badge><Badge>În curs</Badge><Badge>Neutru</Badge></div>
        </Card>
        <Card title="Răspuns vizual">
          <div className="flex flex-wrap gap-2.5">
            <button className="btn-ghost" onClick={() => setOpen(true)}>Deschide dialog</button>
            <button className="btn-ghost" onClick={() => toast("Activitatea LM-1042 a fost aprobată.")}>Arată notificare</button>
          </div>
        </Card>
      </div>
      <Card title="Câmpuri de formular">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Text"><input className="input" placeholder="Numele personajului" /></Field>
          <Field label="Selecție"><select className="input"><option>Soldier</option><option>Capo</option></select></Field>
          <Field label="Data"><input type="date" className="input" /></Field>
          <Field label="Număr" hint="Ore, în pași de un sfert"><input type="number" className="input" placeholder="2" /></Field>
        </div>
      </Card>
      <Card title="Tabel de date" pad={false}><div className="p-5 pt-4"><DataTable columns={[{ key: "ref", label: "Raport", kind: "mono" }, { key: "member", label: "Membru" }, { key: "category", label: "Categorie" }, { key: "status", label: "Stare", kind: "badge" }]} rows={activity} /></div></Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Respinge activitatea">
        <Field label="Motiv" hint="Membrul vede acest mesaj."><textarea rows={3} className="input" /></Field>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setOpen(false)}>Anulează</button><button className="btn-danger" onClick={() => { setOpen(false); toast("Activitatea a fost respinsă."); }}>Respinge activitatea</button></div>
      </Modal>
    </div>
  );
}
