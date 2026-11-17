# Image slots

Drop a file with one of these exact names into this folder and it replaces the
built-in fallback automatically. No code changes. Restart `npm run dev` if the
page does not pick it up (slots are checked on the server).

| Slot | File name (first match wins) | Size | Ratio | Where it appears |
|---|---|---|---|---|
| Login background | login-bg.jpg / .webp / .png | 2560x1440 | 16:9 | Login page |
| Access-pending background | auth-pending-bg.jpg / .webp / .png | 2560x1440 | 16:9 | Pending screen |
| Dashboard banner | dashboard-hero.jpg / .webp / .png | 2400x600 | 4:1 | Dashboard welcome card |
| Sidebar texture | sidebar-texture.jpg / .webp / .png | 600x1600 | 3:8 | Sidebar (12% opacity) |
| PDF report header | report-header.jpg / .webp / .png | 2100x500 | 21:5 | Reports (Phase 5) |
| Skull emblem | logo-emblem.svg / .png / .webp | 512x512 | 1:1 | Login, sidebar, reports |

Tips: keep photos under 400 KB (use WebP), dark and low-contrast in the centre so text stays readable.
Only use images you own or are licensed to use. Do not use Rockstar Games artwork or screenshots.
