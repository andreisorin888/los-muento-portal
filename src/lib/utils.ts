export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type Tone = "emerald" | "gold" | "rose" | "orange" | "violet" | "neutral";

export function toneFor(value: string): Tone {
  const v = value.toLowerCase();
  if (/(aprobat|activ|finalizat|controlat|succes|online|acceptat ca)/.test(v)) return "emerald";
  if (/(așteptare|așteapt|probat|probă|corecți)/.test(v)) return "gold";
  if (/(respins|eșuat|întârziat|suspend|critic|cu arme)/.test(v)) return "rose";
  if (/(contestat|ridicat)/.test(v)) return "orange";
  if (/(în curs|acceptat|medie|operațiune)/.test(v)) return "violet";
  return "neutral";
}
