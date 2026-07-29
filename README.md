# Meridian — School Management System (Frontend-Only Edition)

A complete, role-based School Management System UI built with **only HTML,
CSS and vanilla JavaScript** — no backend, no framework, no build step, no
npm install. Open it in a browser and it works.

There are 4 dashboards (Admin, Teacher, Student, Parent), each fully
interactive: adding/editing/deleting real records, marking attendance,
entering marks with automatic grade calculation, collecting fees with
printable receipts, building a weekly timetable, posting notices, and
exporting CSV reports — all backed by the browser's own `localStorage`
acting as an in-browser "database."

---

## 🚀 Running it

**Easiest — just open it:**
Double-click `index.html`. That's it.

**Most reliable — serve it locally (recommended):**
Some browsers (notably Firefox) isolate storage *per file* when pages are
opened directly from disk (`file://`), which breaks the shared login/data
this app relies on across pages. Chrome and Edge handle this fine with a
plain double-click, but if you hit login/data issues, serve the folder
with any static server and open it over `http://localhost` instead:

```bash
# Option A — Python (already installed on most systems)
cd sms-frontend
python -m http.server 8000
# then open http://localhost:8000

# Option B — Node
npx serve .

# Option C — VS Code
# Right-click index.html → "Open with Live Server"
```

No installation, build step, or dependency is required either way.

---

## 🔑 Demo accounts

| Role    | Username   | Password     |
|---------|------------|--------------|
| Admin   | `admin`    | `admin123`   |
| Teacher | `teacher1` | `teacher123` |
| Student | `student1` | `student123` |
| Parent  | `parent1`  | `parent123`  |

The login page has one-tap buttons that autofill these for you. If data
ever gets into a weird state, click **"Reset demo data"** on the login
page to wipe `localStorage` and reseed everything from scratch.

### Logging in as a teacher/student/parent you just created

You can sign in with **either the login username or the email address**
on the account. When Admin adds a teacher, student or parent with "Create
a login account" checked, a confirmation window shows the generated
username and password right away — and usernames are now readable (e.g.
`priya.sharma` from "Priya Sharma") instead of a random string. Editing
that person's email later keeps their login in sync automatically, and
you can reset their password any time from the same edit screen (open the
record → "Login account" section near the bottom). Parents can also be
linked to one or more children directly from **Admin → Parents**, in
addition to setting a student's parent from the student's own form.

---

## ✨ What's implemented

- **Auth (simulated)** — login, logout, "remember" session, forgot-password
  explainer, change password, editable profile with photo upload (stored
  as a data URL, so it works with zero backend).
- **Admin** — dashboard with 3 hand-drawn SVG charts (attendance trend,
  fee collection, class distribution), full student, teacher & **parent**
  CRUD with photo upload and login-account management, class & subject
  management, attendance overview + CSV export, exam creation + marks
  browsing + CSV export, fee structures + fee collection + printable
  receipts, weekly timetable builder, notice board, and a reports hub.
- **Teacher** — today's classes, mark attendance (Present/Absent/Late/
  Leave) per class/subject/date, enter marks with live grade preview,
  student roster for their classes.
- **Student** — attendance %, marks & CGPA, a printable report card,
  fee structure & payment history, weekly timetable, notices.
- **Parent** — a card per linked child, each opening a detail view with
  that child's attendance, marks and timetable.
- **Search, filtering, pagination** on every list.
- **Dark mode** (persisted), **mobile-responsive** layout with a
  collapsible sidebar.
- **CSV export** for attendance/marks/fees (opens directly in Excel or
  Sheets), and **print-to-PDF** for report cards and fee receipts via the
  browser's native print dialog.

---

## 🧠 How it works without a backend

`js/core/db.js` implements a tiny CRUD layer over `localStorage`, storing
each "table" (students, teachers, classes, attendance, marks, fees,
timetable, notices, users…) as a JSON array under its own key. It mirrors
a real relational design — including thoughtful cascade rules on delete
(e.g. deleting a class unassigns its students rather than deleting them;
deleting a student *does* remove their attendance/marks/payments; deleting
a fee structure that already has payments against it is blocked, the same
way a real foreign-key `RESTRICT` would behave).

`js/core/auth.js` simulates a session by storing the logged-in user's id
and role in `localStorage`. **This is a demo convenience, not real
security** — anyone with access to the browser can read or edit the
stored data via devtools. There is no server, so there is nothing to
attack, but don't treat this as a security model to reuse for a real
deployment.

`js/core/ui.js` is a tiny hash-based router (`#dashboard`, `#students`,
`#child/3`, …) that shows/hides `<section class="view">` blocks, plus a
modal/toast system and hand-rolled SVG chart renderers (line, bar, donut)
— there's no Chart.js or any other charting library.

`js/core/icons.js` is a self-contained set of ~35 line icons as inline
SVG strings, so the project has no icon-font dependency either.

---

## 📁 File structure

```
sms-frontend/
├── index.html              Login page
├── admin.html               Admin dashboard shell (all admin views)
├── teacher.html              Teacher dashboard shell
├── student.html              Student dashboard shell
├── parent.html                Parent dashboard shell
├── css/
│   └── style.css              Full design system (tokens, components, dark mode, print)
└── js/
    ├── core/
    │   ├── icons.js               Inline SVG icon set
    │   ├── db.js                   localStorage data layer + seed data
    │   ├── auth.js                  Session/login simulation
    │   ├── ui.js                    Router, modal, toast, charts, formatting
    │   └── shell.js                  Renders sidebar nav / topbar per role
    └── pages/
        ├── login.js
        ├── account.js                    Shared "Profile" & "Change Password" views
        ├── admin.js + admin-*.js           One file per admin module
        ├── teacher.js + teacher-*.js        One file per teacher module
        ├── student-dashboard.js + student-records.js
        └── parent.js
```

Every HTML file loads the same `css/style.css` and the relevant `js/core/*`
scripts, then its own `js/pages/*` scripts — plain `<script src="">` tags,
no bundler, no ES module `import`/`export` (deliberately, so the files
still work if opened directly from disk in browsers that restrict module
scripts over `file://`).

---

## 🎨 Design

No Bootstrap, no Tailwind, no UI kit — the whole design system in
`style.css` is hand-written: a pine-green/gold/paper palette (rather than
the generic purple-on-white look most admin templates default to), Lora
for headings paired with IBM Plex Sans for body text and IBM Plex Mono
for record codes (admission numbers, receipt numbers), a custom modal/
toast/status-badge/chip system, and three hand-drawn SVG chart types.

---

## ⚠️ Limitations (by design, given "frontend only")

- **No real backend or database.** Everything lives in one browser's
  `localStorage`. Clearing site data, using a different browser, or going
  incognito starts fresh.
- **No real authentication security.** Passwords are stored in plain text
  in `localStorage` for demo purposes — there's no server to hash them
  against.
- **Single-device only.** Data doesn't sync between devices or browsers;
  there's nothing to sync it *through*.
- **"PDF export"** uses the browser's native print-to-PDF rather than a
  bundled PDF library, to keep the project dependency-free.
- Two Google Fonts are loaded from `fonts.googleapis.com` for the
  Lora/IBM Plex typefaces; everything else — including all icons and
  charts — is fully self-contained. If you're offline, the page falls
  back to system serif/sans fonts automatically.

If you outgrow these limitations, the natural next step is pairing this
same UI with a real backend (Flask/Django/Node/etc.) behind a REST API —
the `DB.*` layer in `db.js` is deliberately shaped like a REST client
(`all`, `find`, `insert`, `update`, `remove`) so swapping it for real
`fetch()` calls later wouldn't require rewriting the views.
