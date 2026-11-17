# LOS MUENTO portal: project rules for Claude Code

Production target: https://portal.losmuento.com. Full original spec is in docs/SPEC.md (add it there).

## Status
- Phase 1 (visual foundation): DONE. Pages are navigable, data is demo data from `src/lib/demo-data.ts`.
- Phase 2 (database, auth, RBAC): DONE. PostgreSQL + Prisma schema, NextAuth Discord OAuth, sessions, middleware, RBAC permissions, audit log, first-Boss setup wizard, rank/dept/crew config screens.
- Phase 3 (member profiles, directory, departments, crews, recruitment, promotions, warnings, archiving): DONE. All 26 tests pass, `npm run build` succeeds.
- Phase 4 (Jafuri, Teritorii, Calendar Evenimente, Sarcini, Armurărie, Seif și inventar, Finanțe, Activitate overview): DONE. `npm run build` succeeds, 26 pages, zero errors.
- Phase 5 (Clasamente, Anunțuri, Statistici, Conducere, Jurnal de audit): DONE. `npm run build` succeeds, 26 pages, zero errors.
- Phase 6 (Sondaje, Antrenamente, Wiki intern, Discord bot, module polish): DONE. `npm run build` succeeds, 29 pages, zero errors. Discord bot in `discord-bot/` — separate process, run after `npm install` there and filling `.env`.
- Next: Phase 7 — await owner review before starting.
- STOP at the end of every phase and wait for the owner's review.

## Language
The whole interface is in Romanian (html lang="ro"). Keep all new UI text, errors, Discord embeds and reports in Romanian. Rank names (Boss, Underboss, Consigliere, Capo, Sottocapo, Soldier, Associate) and the slogan stay as they are. Status keywords in `src/lib/utils.ts` (`toneFor`) are matched in Romanian: update it when adding statuses. Plan an i18n layer (e.g. next-intl) before Phase 3 if a second language is ever needed.

## Stack
Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind 3, Recharts, lucide-react.
Phase 2 adds PostgreSQL + Prisma. The Discord bot is a separate process/container sharing the same DB and service layer. Never embed it in route handlers.

## Rules that never change
- Backend permission checks on every protected action. Hiding UI is not security.
- No hardcoded domains, Discord IDs, secrets or org config. Use env vars and the config tables.
- Only approved chest/financial transactions change balances. Money as integer minor units inside DB transactions. Corrections need a reason and an audit record.
- Archive, never delete, member history. Audit logs are append-only.
- A module is done only when UI, API, DB, permissions, validation and tests all work.
- Original design only. No Rockstar logos, art or screenshots.

## Design system (see /design-system in the app)
Colours are Tailwind tokens: ink, charcoal, panel, pink, violet, sunset, emerald, gold, muted.
Fonts: Big Shoulders Display (headings, numbers), Manrope (body). Reusable classes in `globals.css`:
`panel btn-primary btn-gold btn-ghost btn-danger input label badge h-page h-card th td`.
Pink/violet carry the atmosphere. Emerald/gold identify LOS MUENTO. Keep motion minimal and honour reduced motion.

## Images
Photos are supplied by the owner in `public/images` (see the README there). Slots are defined in `src/config/assets.ts`; every slot has a built-in fallback. Never download or generate photos.

## Navigation
Modules are declared once in `src/config/nav.ts` (label, icon, minLevel, phase). The demo `minLevel` filter is UI-only; Phase 2 replaces it with server-side RBAC. Rank levels: Boss 100, Underboss 90, Consigliere 80, Capo 60, Sottocapo 50, Soldier 30, Associate 20 (configurable later).

## Removing demo data before launch
Delete `src/lib/demo-data.ts` usages, the "Preview as" switcher (`NEXT_PUBLIC_DEMO_DATA=false` hides it), and the demo banners.
