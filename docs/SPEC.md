# LOS MUENTO Portal — Master Specification

**Production target:** https://portal.losmuento.com
**Stack:** Next.js 14 (App Router), React 18, TypeScript strict, Tailwind 3, Recharts, lucide-react, PostgreSQL + Prisma v5, NextAuth v4 (Discord OAuth)

---

## 1. Concept

The LOS MUENTO portal is a private web application for a Grand Theft Auto V roleplay organisation. It manages members, operations, finances, and internal communication — all in Romanian, styled in a dark mafia aesthetic (ink/charcoal backgrounds, pink/violet accent, emerald/gold identity colours).

Access is gated by Discord OAuth. Every member must be linked to a Discord account. A first-Boss setup wizard runs on the first login.

---

## 2. Rank Hierarchy

| Rank | Level |
|---|---|
| Boss | 100 |
| Underboss | 90 |
| Consigliere | 80 |
| Capo | 60 |
| Sottocapo | 50 |
| Soldier | 30 |
| Associate | 20 |

Rank levels are stored per-member. Permissions check `rankLevel` at the server, not in the UI.

---

## 3. Member Statuses

`ACTIV` · `INACTIV` · `SUSPENDAT` · `PROBATORIE` · `ARHIVAT`

Members are never deleted — they are archived. Audit logs are append-only.

---

## 4. Navigation Groups & Modules

### Prezentare
| Slug | Label | Min Level | Phase |
|---|---|---|---|
| dashboard | Panou | 20 | 1 |
| members | Membri | 20 | 3 |
| activitati | Activitățile mele | 20 | 4 |
| activity | Activitate (overview) | 20 | 4 |

### Operațiuni
| Slug | Label | Min Level | Phase |
|---|---|---|---|
| chest | Seif și inventar | 20 | 4 |
| finances | Finanțe | 80 | 4 |
| territories | Teritorii | 30 | 4 |
| robberies | Jafuri | 20 | 4 |
| armory | Armurărie | 20 | 4 |
| training | Antrenamente | 20 | 6 |

### Familia
| Slug | Label | Min Level | Phase |
|---|---|---|---|
| recruitment | Recrutare | 60 | 3 |
| events | Calendar evenimente | 20 | 4 |
| rankings | Clasamente | 20 | 5 |
| announcements | Anunțuri | 20 | 5 |
| polls | Sondaje | 20 | 6 |
| wiki | Wiki intern | 20 | 6 |

### Analiză
| Slug | Label | Min Level | Phase |
|---|---|---|---|
| analytics | Statistici | 60 | 5 |

### Administrare
| Slug | Label | Min Level | Phase |
|---|---|---|---|
| management | Conducere | 90 | 5 |
| configuration | Configurare | 100 | 2 |
| audit | Jurnal de audit | 90 | 5 |

---

## 5. Module Specifications

### 5.1 Dashboard (`/dashboard`)
- Personal stats: points, rank, member code, status
- Recent activities (last 5), upcoming events (next 3), active tasks count
- Monthly leaderboard preview (top 5)
- Pending announcements count badge

### 5.2 Membri (`/members`)
- Directory of all non-archived members, searchable by name/code
- Member profile page (`/members/[id]`): rank history, warnings, activity summary, crew/dept
- Promote/demote: Consigliere+ only, cannot promote to own level or above
- Issue warnings: Capo+ (severity: MINOR / MAJOR / FINAL)
- Change status: Capo+
- Archive member: Underboss+. Requires a reason. All history is kept.

### 5.3 Activitățile mele (`/activitati`)
- Members log their own activities with type, title, description, proof link (YouTube/Streamable/Imgur)
- Types and automatic point awards:
  - Misiune: +3 pts
  - Antrenament: +2 pts
  - Eveniment: +2 pts
  - Altele: +1 pt
- Points are added immediately to `member.points` on submit
- History table with proof link column

### 5.4 Activitate overview (`/activity`)
- Management view (all members) for current month
- Leaderboard by total points
- Recent activities list across all members
- Activity type breakdown stats

### 5.5 Seif și inventar (`/chest`)
- Single organisation chest with running balance
- Transaction types: DEPUNERE · RETRAGERE · TRANSFER · CORECTIE
- All transactions start in ASTEPTARE state
- Only APROBAT transactions change the balance (via atomic `{ increment: delta }`)
- Approval: Capo+. Corrections require a reason.
- Balance displayed in-page; pending approval section for Capo+

### 5.6 Finanțe (`/finances`)
- Separate ledger for RP currency, independent of chest stock
- Types: VENIT · CHELTUIALA · TRANSFER · AJUSTARE
- Configurable categories (Underboss+ creates them)
- Net balance = sum of APROBAT VENIT − APROBAT CHELTUIALA
- Submit: Capo+. Approve/reject: Underboss+.

### 5.7 Teritorii (`/territories`)
- Territory statuses: CONTROLAT · CONTESTAT · NEUTRU
- Territory history log: who changed what and when
- Manage (create/update): Capo+

### 5.8 Jafuri (`/robberies`)
- Each robbery has a unique reference number (JF-0001, JF-0002…)
- Statuses: PLANIFICAT · REUSIT · ESUAT · ANULAT
- Leader selects participants; total reward split equally per participant (share stored per row)
- Participants and their individual shares shown in the table
- Status update: Capo+

### 5.9 Armurărie (`/armory`)
- Weapon inventory: name, type, serial (optional unique), status (DISPONIBIL/ATRIBUIT/PIERDUT/RETRAS)
- Assign/return/transfer weapons — Sottocapo+
- Weapon history log per weapon
- Ammo stock: type → quantity, updatable by Sottocapo+
- Ammo allocations per member

### 5.10 Antrenamente (`/training`)
- Sottocapo+ creates training plans with ordered steps
- Each step has title + optional description
- Members mark steps complete with optional note + proof link (upsert — can re-submit)
- Per-member progress bar shown per plan
- Delete plan: Sottocapo+ (own) or Boss (any)

### 5.11 Recrutare (`/recruitment`)
- Recruiter (Capo+) adds a candidate (Discord name + optional ID)
- Statuses: CANDIDAT → PROBATIE → APROBAT / RESPINS
- Approve/reject: Capo+. On approval a Member record is created.
- Recruiter stats: total recruited, approval rate

### 5.12 Calendar evenimente (`/events`)
- Create events: Capo+ (types: SEDINTA / OPERATIUNE / INSTRUIRE / ALTELE)
- Attendance tracking per member: INVITAT → CONFIRMAT → PREZENT / ABSENT
- Members RSVP inline with attendance buttons
- Upcoming events shown prominently; past events dimmed
- Discord reminder sent 24h before event (via bot)

### 5.13 Clasamente (`/rankings`)
- Monthly leaderboard computed from `activity.points` grouped by member
- Underboss+ confirms the monthly winner (stored in MonthlyWinner table, unique per year/month)
- Hall of Fame: list of all confirmed past winners
- Monthly winner announced on Discord on the 1st of each month (via bot)

### 5.14 Anunțuri (`/announcements`)
- Capo+ creates announcements with optional rank-level filter (minLevel)
- Members only see announcements at or below their rank level
- Read tracking: members can mark read; unread shown with pink accent border
- Delete: author (Capo+) or Boss
- Posted to Discord automatically within 2 minutes of creation (via bot, `discordPostedAt` flag)

### 5.15 Statistici (`/analytics`)
- Bar chart: members by rank
- Bar chart: activities by type (count + points, last 6 months)
- Pie chart: robberies by status
- Access: Capo+ (60+)
- **TODO Phase 7:** date range filter, member/rank/dept filter, PDF export

### 5.16 Conducere (`/management`)
- Restricted to Underboss+ — others are redirected to dashboard
- Member status breakdown stats grid (Activi / Inactivi / Probatorie / Suspendați / Arhivați)
- Internal notes board: Underboss+ creates/deletes notes (Boss can delete any)

### 5.17 Configurare (`/configuration`)
- Boss only
- Rank management (name, level)
- Department management (name, lead)
- Crew management (name, capo, dept)
- Finance categories
- OrgConfig key-value store for Discord channel IDs, role IDs, etc.

### 5.18 Jurnal de audit (`/audit`)
- Underboss+ only
- Append-only log of all significant actions
- Columns: timestamp, actor (name + rank), action string, entity/ID, note
- Filters: by action string, entity string, actor (dropdown)
- Pagination: 50 rows per page

### 5.19 Sondaje (`/polls`)
- Capo+ creates polls: question, description, rank filter (minLevel), expiry datetime, 2–6 options
- Members vote once per poll (enforced server-side via unique constraint)
- Results (bar chart) revealed after voting or when poll closes
- Capo+ can close a poll early (own polls; Boss can close any)
- Closed polls shown dimmed below active ones

### 5.20 Wiki intern (`/wiki`, `/wiki/[slug]`)
- Capo+ creates pages: title, body (plain text), rank-level access filter
- Members see only pages at or below their rank level
- Edit: Capo+. Each edit saves the previous body as a WikiVersion (last 5 shown).
- Delete: Underboss+
- Index page: list of all accessible pages sorted by last updated

---

## 6. Discord Bot (`discord-bot/`)

Separate Node.js process — never runs inside Next.js route handlers. Shares the same PostgreSQL database via Prisma Client.

### Setup
```bash
cd discord-bot
npm install
cp .env.example .env   # fill in DISCORD_TOKEN + 4 channel IDs
npm run dev            # development
npm run build && npm start  # production
```

### Required env vars
| Var | Description |
|---|---|
| `DATABASE_URL` | Same Neon connection string as the Next.js app |
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_GUILD_ID` | Server (guild) ID |
| `DISCORD_ANNOUNCEMENTS_CHANNEL` | Channel for new announcements |
| `DISCORD_EVENTS_CHANNEL` | Channel for event reminders |
| `DISCORD_RANKINGS_CHANNEL` | Channel for weekly/monthly reports |
| `DISCORD_ALERTS_CHANNEL` | Channel for low-chest alerts |

### Scheduled jobs
| Job | Schedule | Description |
|---|---|---|
| Pending announcements | Every 2 min | Posts any announcement where `discordPostedAt IS NULL` |
| Event reminders | Every 30 min | Sends reminder for events starting within 24h, sets `reminderSentAt` |
| Weekly rankings | Monday 09:00 | Top 10 members by points for the past 7 days |
| Monthly winner | 1st of month 10:00 | Announces confirmed MonthlyWinner for previous month |
| Low chest alert | Daily 12:00 | Alerts if `chest.balance < 100 000` |

---

## 7. Permissions Summary

| Action | Min Level |
|---|---|
| View any page | 20 (Associate) |
| Submit chest/finance tx, log activity | 20 |
| Manage armory | 50 (Sottocapo) |
| Create training plans | 50 (Sottocapo) |
| Issue warnings, change status, manage tasks/events/territories/robberies | 60 (Capo) |
| Create announcements, polls, wiki pages | 60 (Capo) |
| Approve recruits | 60 (Capo) |
| Promote/demote members | 80 (Consigliere) |
| Approve finance records | 90 (Underboss) |
| View management, write management notes | 90 (Underboss) |
| View audit log | 90 (Underboss) |
| Delete wiki pages | 90 (Underboss) |
| Confirm monthly winner | 90 (Underboss) |
| Archive members | 90 (Underboss) |
| All configuration | 100 (Boss) |

---

## 8. Data Rules

- **Money** is stored as integer minor units (e.g. `100000` = $1 000.00 in-game). Never floats.
- **Balances** are only modified by approved transactions — never set directly.
- **Corrections** always require a reason field and generate an audit log entry.
- **Archive, never delete** — members, activity, history, warnings are permanent records.
- **Audit log** is append-only. No update or delete on `AuditLog`.

---

## 9. Design System

| Token | Use |
|---|---|
| `ink` | Page background |
| `charcoal` | Secondary surfaces |
| `panel` | Cards and panels (class: `panel`) |
| `pink` / `violet` | Atmosphere, accents, primary actions |
| `emerald` | Success, active, positive states |
| `gold` | Identity, points, money, highlights |
| `muted` | Secondary text |
| `sunset` | Warnings, in-progress |

**Fonts:** Big Shoulders Display (headings, numbers) · Manrope (body)

**Reusable CSS classes** (defined in `globals.css`):
`panel` `btn-primary` `btn-gold` `btn-ghost` `btn-danger` `input` `label` `badge` `h-page` `h-card` `th` `td`

---

## 10. What Remains (Phase 7+)

- **Demo data removal** — delete `src/lib/demo-data.ts` usages, remove "Preview as" switcher, set `NEXT_PUBLIC_DEMO_DATA=false`
- **Tests** — Phases 4–6 have no test coverage (Phase 3 has 3 test files)
- **Analytics filters** — date range, member, rank, department
- **Analytics PDF export** — with LOS MUENTO branding
- **Configurable ranking weights** — currently hardcoded in `src/app/actions/activity.ts`
- **Deployment** — CI/CD pipeline to portal.losmuento.com, production env vars
