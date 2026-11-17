/**
 * DATE DEMONSTRATIVE. Doar Faza 1.
 * Exactly three fictional members. Everything here is replaced by database
 * queries in Phase 2-4, and this file is deleted before production launch.
 */
export type DemoMember = {
  id: string; name: string; discord: string; rank: string; level: number; dept: string; crew: string;
  status: string; joined: string; recruitedBy: string; hours: number; attendance: string; tasksDone: number;
  robberies: number; chest: number; score: number; online: boolean; initials: string; hue: string;
};

export const members: DemoMember[] = [
  { id: "LM-0001", name: "Dante Reyes", discord: "dante.reyes", rank: "Boss", level: 100, dept: "Conducere", crew: "Niciuna", status: "Activ", joined: "2025-11-02", recruitedBy: "Fondator", hours: 128, attendance: "6 din 6", tasksDone: 9, robberies: 5, chest: 14, score: 912, online: true, initials: "DR", hue: "#d9a93c" },
  { id: "LM-0014", name: "Mateo Cruz", discord: "mateo.cruz", rank: "Capo", level: 60, dept: "Operațiuni", crew: "Echipa Cruz", status: "Activ", joined: "2025-12-19", recruitedBy: "Dante Reyes", hours: 96, attendance: "5 din 6", tasksDone: 7, robberies: 4, chest: 9, score: 784, online: true, initials: "MC", hue: "#12b886" },
  { id: "LM-0027", name: "Luis Ortega", discord: "luis.ortega", rank: "Soldier", level: 30, dept: "Logistică", crew: "Echipa Cruz", status: "Perioadă de probă", joined: "2026-02-08", recruitedBy: "Mateo Cruz", hours: 74, attendance: "4 din 6", tasksDone: 5, robberies: 2, chest: 11, score: 641, online: false, initials: "LO", hue: "#ff2e93" },
];

export const hoursSeries = [
  { day: "Lun", hours: 34 }, { day: "Mar", hours: 41 }, { day: "Mie", hours: 29 }, { day: "Joi", hours: 52 },
  { day: "Vin", hours: 61 }, { day: "Sâm", hours: 74 }, { day: "Dum", hours: 58 },
];

export const chestSeries = [
  { day: "Lun", deposits: 120, withdrawals: 40 }, { day: "Mar", deposits: 90, withdrawals: 60 },
  { day: "Mie", deposits: 150, withdrawals: 35 }, { day: "Joi", deposits: 80, withdrawals: 95 },
  { day: "Vin", deposits: 210, withdrawals: 70 }, { day: "Sâm", deposits: 175, withdrawals: 120 },
  { day: "Dum", deposits: 130, withdrawals: 55 },
];

export const activity: Record<string, string | number>[] = [
  { ref: "LM-1042", member: "Luis Ortega", category: "Ședință organizație", duration: "2 h", status: "În așteptare" },
  { ref: "LM-1041", member: "Mateo Cruz", category: "Operațiune teritoriu", duration: "3 h 30 min", status: "În așteptare" },
  { ref: "LM-1040", member: "Dante Reyes", category: "Instruire", duration: "1 h 45 min", status: "Aprobat" },
  { ref: "LM-1039", member: "Luis Ortega", category: "Ore lucrate", duration: "4 h", status: "Aprobat" },
  { ref: "LM-1038", member: "Mateo Cruz", category: "Escortă", duration: "2 h", status: "Corecție solicitată" },
];

export const chestTx: Record<string, string | number>[] = [
  { ref: "CT-0318", member: "Luis Ortega", type: "Depunere", items: "Fier vechi x120, Oțel x40", status: "În așteptare" },
  { ref: "CT-0317", member: "Mateo Cruz", type: "Retragere", items: "Muniție 9mm x200", status: "Aprobat" },
  { ref: "CT-0316", member: "Dante Reyes", type: "Corecție", items: "Oțel x-5", status: "Aprobat" },
  { ref: "CT-0315", member: "Luis Ortega", type: "Depunere", items: "Material textil x80", status: "Respins" },
];

export const inventory = [
  { item: "Fier vechi", qty: 840, min: 300, unit: "buc" },
  { item: "Oțel", qty: 215, min: 250, unit: "buc" },
  { item: "Material textil", qty: 460, min: 150, unit: "buc" },
  { item: "Muniție 9mm", qty: 1200, min: 500, unit: "cartușe" },
  { item: "Electronice", qty: 38, min: 40, unit: "buc" },
];

export const tasks: Record<string, string | number>[] = [
  { title: "Reaprovizionare seif materiale", assignee: "Luis Ortega", priority: "Ridicată", deadline: "Vin, 6 nov", status: "În curs" },
  { title: "Recunoaștere teritoriu port", assignee: "Echipa Cruz", priority: "Medie", deadline: "Dum, 8 nov", status: "Acceptat" },
  { title: "Instruirea a doi asociați noi", assignee: "Mateo Cruz", priority: "Medie", deadline: "Mie, 11 nov", status: "Așteaptă aprobarea" },
  { title: "Inventar săptămânal armurărie", assignee: "Luis Ortega", priority: "Scăzută", deadline: "Lun, 26 oct", status: "Finalizat" },
];

export const territories: Record<string, string | number>[] = [
  { name: "Districtul Portului", status: "Controlat", lead: "Mateo Cruz", changed: "12 oct" },
  { name: "Fâșia Vinewood Hills", status: "Contestat", lead: "Dante Reyes", changed: "28 oct" },
  { name: "Depoul Sandy Shores", status: "Controlat", lead: "Luis Ortega", changed: "3 oct" },
  { name: "Golful Paleto", status: "Neutru", lead: "Nealocat", changed: "Niciodată" },
];

export const robberies: Record<string, string | number>[] = [
  { ref: "RB-0207", type: "Bijuterie", leader: "Mateo Cruz", reward: "$84,000", status: "Aprobat" },
  { ref: "RB-0206", type: "Bancă", leader: "Dante Reyes", reward: "$0", status: "Eșuat" },
  { ref: "RB-0205", type: "Depozit", leader: "Luis Ortega", reward: "$31,500", status: "În așteptare" },
];

export const events: Record<string, string | number>[] = [
  { title: "Ședința săptămânală a organizației", type: "Ședință", when: "Joi, 5 nov, 20:00", organiser: "Dante Reyes" },
  { title: "Operațiune în port", type: "Operațiune", when: "Sâm, 7 nov, 21:30", organiser: "Mateo Cruz" },
  { title: "Instruire asociați", type: "Instruire", when: "Mar, 10 nov, 19:00", organiser: "Mateo Cruz" },
];

export const announcements: Record<string, string | number>[] = [
  { title: "Cerințele pentru noiembrie sunt active", author: "Dante Reyes", date: "1 nov" },
  { title: "Briefing operațiune în port", author: "Mateo Cruz", date: "30 oct" },
  { title: "Reguli noi pentru armurărie", author: "Dante Reyes", date: "27 oct" },
];

export const notifications = [
  { id: 1, title: "Activitatea LM-1042 așteaptă verificarea", when: "acum 12 min", unread: true },
  { id: 2, title: "Task scadent în 4 zile: Reaprovizionare seif materiale", when: "acum 1 h", unread: true },
  { id: 3, title: "Tranzacția CT-0317 a fost aprobată", when: "Ieri", unread: false },
  { id: 4, title: "Anunț: Cerințele pentru noiembrie sunt active", when: "Ieri", unread: false },
];

export const gotm = { name: "Dante Reyes", month: "octombrie 2026", score: 912, reward: "25.000 $ și insigna craniu de aur", breakdown: [["Ore de activitate", 214], ["Ședințe", 160], ["Taskuri", 150], ["Jafuri", 120], ["Seif", 98], ["Evaluare conducere", 170]] as [string, number][] };
