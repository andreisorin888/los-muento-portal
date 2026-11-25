import {
  LayoutDashboard, Users, Activity, ClipboardList, Package, Wallet, Map, Siren, Crosshair,
  UserPlus, CalendarDays, Trophy, BarChart3, Megaphone, ShieldCheck, Settings, ScrollText,
  Vote, GraduationCap, Library, FlaskConical, ShoppingCart, ListChecks,
  type LucideIcon,
} from "lucide-react";

export const RANKS = [
  { name: "Boss", level: 100 },
  { name: "Underboss", level: 90 },
  { name: "Consigliere", level: 80 },
  { name: "Capo", level: 60 },
  { name: "Sottocapo", level: 50 },
  { name: "Soldier", level: 30 },
  { name: "Associate", level: 20 },
  { name: "Vizitator", level: 10 },
] as const;

export type Column = { key: string; label: string; kind?: "badge" | "mono" };

export type ModuleDef = {
  slug: string;
  label: string;
  icon: LucideIcon;
  minLevel: number;
  illegalOnly?: true;
  group: "Prezentare" | "Operațiuni" | "Familia" | "Analiză" | "Administrare";
  phase: number;
  summary: string;
  scope: string[];
  table?: { title: string; columns: Column[]; rows: Record<string, string | number>[] };
};

export const MODULES: ModuleDef[] = [
  { slug: "dashboard", label: "Panou", icon: LayoutDashboard, minLevel: 20, group: "Prezentare", phase: 1, summary: "Panoul tău de control.", scope: [] },
  { slug: "members", label: "Membri", icon: Users, minLevel: 20, group: "Prezentare", phase: 3, summary: "Listă, profiluri și istoric.", scope: [] },
  { slug: "activitati", label: "Activitățile mele", icon: Activity, minLevel: 20, group: "Prezentare", phase: 4, summary: "Înregistrează misiunile, antrenamentele și evenimentele tale cu link de dovadă. Punctele se adaugă automat.", scope: ["Tipuri: Misiune (+3 pts), Antrenament (+2 pts), Eveniment (+2 pts), Altele (+1 pt)", "Link YouTube / Streamable ca dovadă", "Punctele se creditează imediat la trimitere", "Istoricul complet al activităților tale"] },
  {
    slug: "activity", label: "Activitate", icon: Activity, minLevel: 20, group: "Prezentare", phase: 4,
    summary: "Trimite ore și activități, apoi urmărește aprobările și cerințele lunare.",
    scope: ["Formular de trimitere cu dovezi", "Aprobă, respinge sau cere corecții", "Statistici zilnice, săptămânale și lunare", "Verificarea cerințelor lunare"],
  },
  {
    slug: "tasks", label: "Taskuri", icon: ClipboardList, minLevel: 20, group: "Prezentare", phase: 4,
    summary: "Atribuie taskuri membrilor, gradelor sau departamentelor și verifică rezultatele.",
    scope: ["Atribuire către membri, grade, departamente sau toți", "Recompense: bani, puncte, obiecte, insigne", "Dovezi și note de finalizare", "Urmărirea întârzierilor și a ratei de finalizare"],
  },
  {
    slug: "chest", label: "Seif și inventar", icon: Package, minLevel: 20, illegalOnly: true, group: "Operațiuni", phase: 4,
    summary: "Mai multe seifuri, tranzacții cu mai multe obiecte și stocuri calculate doar din tranzacții aprobate.",
    scope: ["Depunere, retragere, transfer și corecție", "Doar tranzacțiile aprobate modifică stocul", "Alerte de stoc redus și rapoarte de discrepanțe", "Corecțiile cer un motiv și sunt auditate"],
  },
  { slug: "finances", label: "Cash", icon: Wallet, minLevel: 80, group: "Operațiuni", phase: 4, summary: "Un registru separat pentru moneda fictivă de RP, independent de stocul din seif.", scope: ["Venituri, cheltuieli, transferuri, ajustări", "Stare de aprobare pe fiecare înregistrare", "Solduri calculate în tranzacții de bază de date", "Categorii configurabile"] },
  {
    slug: "territories", label: "Teritorii", icon: Map, minLevel: 30, group: "Operațiuni", phase: 4,
    summary: "Hartă interactivă și listă cu teritorii controlate, contestate și neutre.",
    scope: ["Regiuni pe hartă cu istoricul controlului", "Membri alocați și dovezi", "Categorii și permisiuni configurabile"],
  },
  {
    slug: "robberies", label: "Jafuri", icon: Siren, minLevel: 20, illegalOnly: true, group: "Operațiuni", phase: 4,
    summary: "Rapoarte de evenimente RP cu participanți, recompense și rate de succes.",
    scope: ["Numere de referință și categorii configurabile", "Distribuirea recompensei pe participant", "Statistici de succes și eșec"],
  },
  { slug: "armory", label: "Stash", icon: Crosshair, minLevel: 20, illegalOnly: true, group: "Operațiuni", phase: 4, summary: "Evidența armelor și muniției din joc pentru serverul de roleplay.", scope: ["Atribuiri, returnări și transferuri de arme", "Stoc de muniție și alocări pe membri", "Membrii văd doar alocările proprii"] },
  { slug: "recruitment", label: "Recrutare", icon: UserPlus, minLevel: 60, group: "Familia", phase: 3, summary: "Recruți, perioadă de probă și performanța recrutorilor.", scope: ["Registru de recruți cu recrutorul", "Flux de probă și aprobare", "Statistici de recrutare pe membru"] },
  {
    slug: "events", label: "Calendar evenimente", icon: CalendarDays, minLevel: 20, group: "Familia", phase: 4,
    summary: "Ședințe, operațiuni și instruiri, cu prezența urmărită separat de orele de activitate.",
    scope: ["Participanți și prezență", "Mementouri pe Discord", "Tipuri de evenimente personalizate"],
  },
  { slug: "rankings", label: "Clasamente", icon: Trophy, minLevel: 20, group: "Familia", phase: 5, summary: "Clasamentul lunar și istoricul Gangsterului Lunii.", scope: ["Punctaj automat cu ponderi configurabile", "Conducerea confirmă câștigătorul", "Sala Faimei"] },
  {
    slug: "announcements", label: "Anunțuri", icon: Megaphone, minLevel: 20, group: "Familia", phase: 5,
    summary: "Mesaje de la conducere, publicate și pe Discord.",
    scope: ["Anunțuri țintite pe grade", "Publicare pe Discord", "Urmărirea citirii"],
  },
  { slug: "analytics", label: "Statistici", icon: BarChart3, minLevel: 60, group: "Analiză", phase: 5, summary: "Grafice și filtre pentru membri, operațiuni, inventar și finanțe.", scope: ["Filtre după dată, membru, grad, departament", "Export PDF cu identitatea organizației", "Rapoarte săptămânale și lunare pe Discord"] },
  { slug: "management", label: "Conducere", icon: ShieldCheck, minLevel: 90, group: "Administrare", phase: 5, summary: "Zonă restricționată pentru evaluări, note interne și decizii.", scope: ["Ascunsă din căutarea membrilor", "Acces configurabil", "Accesul la date sensibile este auditat"] },
  { slug: "configuration", label: "Configurare", icon: Settings, minLevel: 100, group: "Administrare", phase: 2, summary: "Grade, permisiuni, categorii, canale Discord și altele.", scope: ["Setările schimbă comportamentul real al aplicației", "Asistent de configurare inițială", "ID-uri de canale și roluri Discord"] },
  { slug: "audit", label: "Jurnal de audit", icon: ScrollText, minLevel: 90, group: "Administrare", phase: 5, summary: "Un registru rezistent la modificări al acțiunilor importante.", scope: ["Valori anterioare și noi", "Filtre după utilizator, acțiune și entitate", "Fără editări sau ștergeri"] },

  // Phase 7
  { slug: "ghid-ilegal", label: "Ghid Ilegal", icon: FlaskConical, minLevel: 20, illegalOnly: true, group: "Operațiuni", phase: 7, summary: "Calculatoare zone, producție, spălare bani și ghid complet pentru activitățile ilegale.", scope: ["Zone Livrare cu bonus orar (Groove, El Burro, Vespucii)", "Calculatoare Producție: Alcool, Metafetamină, Componente", "Spălare bani și Black Market", "Cerințe ore joburi, kit mafie, crafting armament, hărți"] },
  { slug: "comenzi", label: "Comenzi", icon: ShoppingCart, minLevel: 20, illegalOnly: true, group: "Operațiuni", phase: 7, summary: "Plasează comenzi pentru produse din Stash. Managerii procesează și finalizează comenzile.", scope: ["Comandă TEC, Gloanțe, Vestă, Trusă, Pastile", "Status: Depusă → În progres → Finalizată", "La finalizare stash-ul tău se actualizează automat", "Capo+ gestionează și arhivează comenzile"] },
  { slug: "crew-tasks", label: "Taskuri echipă", icon: ListChecks, minLevel: 20, group: "Familia", phase: 7, summary: "Taskuri setate per echipă de Capo+. Membrii confirmă predarea, Capo vede progresul în timp real.", scope: ["Capo+ setează ce trebuie să aducă echipa", "Membrii confirmă predarea individual", "Dashboard cu progres per echipă și per membru", "Arhivă taskuri finalizate"] },

  // Phase 6
  { slug: "polls", label: "Sondaje", icon: Vote, minLevel: 20, group: "Familia", phase: 6, summary: "Votează pe decizii ale organizației.", scope: ["Opțiuni multiple, deadline de vot", "Rezultate vizibile după vot", "Capo+ creează sondaje", "Sondaje targetate pe grade"] },
  { slug: "training", label: "Antrenamente", icon: GraduationCap, minLevel: 20, group: "Operațiuni", phase: 6, summary: "Planuri de antrenament structurate cu urmărirea progresului.", scope: ["Pași cu ordine definită", "Dovezi de finalizare per pas", "Sottocapo+ creează planuri", "Progres per membru"] },
  { slug: "wiki", label: "Wiki intern", icon: Library, minLevel: 20, group: "Familia", phase: 6, summary: "Bază de cunoștințe internă: reguli, lore, ghiduri.", scope: ["Pagini editate de Capo+", "Restricție pe grad per pagină", "Istoric versiuni", "Căutare rapidă"] },
];

export const GROUPS = ["Prezentare", "Operațiuni", "Familia", "Analiză", "Administrare"] as const;
export const hrefFor = (slug: string) => `/${slug === "audit" ? "audit" : slug}`;
