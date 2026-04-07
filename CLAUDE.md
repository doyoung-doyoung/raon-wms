# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

There are no automated tests in this project.

## Tech Stack

- **Next.js 15** (App Router) + React 18, JavaScript only (no TypeScript)
- **Database:** Google Sheets via googleapis — no SQL, no migrations
- **Auth:** NextAuth.js with Google OAuth; admin role detected by matching session email against `ADMIN_EMAIL` env var
- **Styling:** Tailwind CSS
- **i18n:** Custom `useLang()` hook with JSON files in `/locales/` (ko, th, en)
- **PDF:** `@react-pdf/renderer` for React-based PDF templates; `jsPDF` for table-heavy docs. PDF rendering runs in a child process via `scripts/generate-pdf.js` due to Next.js constraints.
- **Email:** Nodemailer with Gmail SMTP
- **Error tracking:** Sentry (configured in `sentry.*.config.js`)

## Architecture

### Data Layer — Google Sheets as Database

All persistent data lives in Google Sheets. Each domain (employees, leaves, attendance, documents, warnings, etc.) has its own spreadsheet, referenced by `SHEETS_*_ID` env vars. CRUD operations are centralized in `lib/google/sheets.js`. There are no SQL migrations; schema is defined by column order in each sheet.

### API Routes

Each feature domain has a REST API at `app/api/[resource]/route.js`. Routes validate the NextAuth session, then read/write via `lib/google/sheets.js`. Pattern:

```js
const session = await getServerSession(authOptions)
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

Admin-only routes additionally check `session.user.isAdmin`.

### Authentication

Configured in `app/api/auth/[...nextauth]/route.js`. JWT strategy with 30-day sessions. The `isAdmin` flag is injected into the JWT token at sign-in by comparing the Google account email to `ADMIN_EMAIL`.

### PDF Generation

PDF templates are React components in `lib/pdf/` using `@react-pdf/renderer`. Because `@react-pdf/renderer` is incompatible with the Next.js server runtime, generation is offloaded to a Node child process: `app/api/documents/route.js` spawns `scripts/generate-pdf.js` which renders and returns base64-encoded PDF bytes.

**Important PDF rules:**
- All Thai strings must end with `\u00A0` (non-breaking space) to prevent last character clipping in react-pdf
- Do NOT add spaces between Thai words — Thai has no word spacing
- Do NOT use `\n` inside a single `<Text>` element — use separate `<Text>` elements for each line
- Font: Sarabun (Thai/Latin only) — Korean text will garble; use English labels instead
- `Font.registerHyphenationCallback(word => [word])` is set in `scripts/generate-pdf.js` to prevent Thai word breaking
- Scripts outputs JSON `{ pdf: base64, pages: N }` — not raw base64

### Internationalization

`lib/i18n/useLang.js` provides a `useLang()` hook returning `{ t, lang, setLang }`. The `t()` function resolves dot-notation keys from `/locales/{lang}.json` and supports placeholder substitution: `t('key', { name: 'value' })`. Language preference is persisted to `localStorage`.

### Session & Layout

`app/layout.jsx` wraps the app in `SessionProvider` and `LangProvider`. Protected pages live under `app/dashboard/` with its own `layout.jsx` that redirects unauthenticated users to `/login`.

### Settings System

- **API:** `app/api/settings/route.js` — GET (all authenticated), POST (admin only)
- **Shared cache:** `lib/settingsCache.js` — singleton module used by both settings and attendance routes so GPS config is always in sync
- **Default settings** include `menuItems` (visible toggles per menu) and `officeLocation` (lat, lng, radius, enabled)
- Settings are in-memory only — reset on server restart (intentional for simplicity)

### GPS Office Attendance

- Attendance API (`app/api/attendance/route.js`) reads `officeLocation` from shared settings cache
- If `officeLocation.enabled`, requires GPS coords on check-in/out; rejects if distance > radius (meters)
- Distance calculated via Haversine formula in the attendance route
- Settings page supports: Google Maps link paste (auto-parses lat/lng), browser GPS auto-fill, manual coordinate entry, radius slider (10–200m)

### Employee Self-Service Endpoints

- `GET /api/employees/me` — returns own employee record (non-admin); used by employee-facing pages to avoid hitting admin-only `/api/employees`

## Key Behaviors

### Leave → Attendance
- Attendance POST blocks check-in/out if employee has an approved leave covering today
- Error messages are bilingual: Thai / Korean

### Leave Approval → PDF + Email
- When admin approves a leave (PATCH `/api/leaves`), a leave approval certificate PDF is generated (`lib/pdf/leaveApproval.jsx`) and attached to the status notification email sent to the employee

### Dashboard Menu (Employee)
- `app/dashboard/page.jsx` fetches `/api/settings` on mount to build the quick menu dynamically
- Only items with `visible !== false` are shown
- UI language is Thai for employee-facing pages

### Document Requests (Employee)
- `app/documents/my-documents/page.jsx` uses `/api/employees/me` to get own employee ID, then fetches document requests
- Status tabs: all / pending / approved / rejected

## PDF Templates (`lib/pdf/`)

| File | Purpose |
|---|---|
| `salaryCertificate.jsx` | 재직증명서 (Employment certificate) |
| `payslip.jsx` | 월급명세서 (Pay slip) |
| `warningLetter.jsx` | Warning letter (1st/2nd/3rd) — English labels, Thai body |
| `leaveApproval.jsx` | Leave approval certificate — Thai primary, sent as email attachment |

## Environment Variables

Copy `.env.local.example` to `.env.local`. Key variables:

| Variable | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth app credentials |
| `ADMIN_EMAIL` | Email address granted admin role |
| `SHEETS_*_ID` | Google Sheets spreadsheet IDs per domain |
| `DRIVE_*_FOLDER_ID` | Google Drive folder IDs for file storage |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Path to `service-account.json` (not committed) |
| `GMAIL_USER/APP_PASSWORD` | Gmail SMTP credentials for Nodemailer |
| `COMPANY_*` | Company info injected into PDFs and emails |

`service-account.json` must be present locally (excluded from git) for Google Sheets/Drive access.
