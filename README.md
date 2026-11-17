# LOS MUENTO portal

Organisation management platform for the LOS MUENTO FiveM roleplay family.
UNA FAMILIA. UN LEGADO.

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm run build      # production build check
```
Node 20+ required.

Interfața este în limba română.

## What exists (Phase 1)
- Cinematic login and access-pending screens (Vice City-inspired original artwork)
- App shell: collapsible sidebar with grouped sections, rank-filtered navigation, mobile drawer, header, notification centre
- Dashboard with all 15 widgets (demo data), member directory and profile, shells for every module
- Design system page at /design-system (Boss preview only)

Use the "Preview as" switcher in the sidebar to see the navigation as Boss, Capo or Soldier.
Sign-in is a preview link; real Discord OAuth arrives in Phase 2.

## Images
See `public/images/README.md`. Drop files in with the listed names; they replace the built-in fallbacks.

## Roadmap
1 Visual foundation (done) | 2 Auth, DB, RBAC, setup wizard | 3 Members and hierarchy | 4 Operational modules |
5 Analytics, PDF, search, audit | 6 Discord bot | 7 Security, backups, deployment.
See CLAUDE.md for the rules each phase must follow.
