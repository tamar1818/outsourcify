# Outsourcify — corporate website + CMS

Bilingual (Georgian primary, English secondary) website for **Outsourcify** — accounting,
tax consulting and business process outsourcing. It has a chat-style consultation booking,
SEO built in from the start, and a flat-file CMS so the client can edit everything without touching code.

**Stack:** Node.js 18+ with the **Express** framework, server-side rendered HTML, plain CSS and vanilla JS.
No database and no front-end build step. Content is stored as JSON.

```bash
npm install
npm start        # → http://localhost:3000   (npm run dev — restarts on file changes)
```

---

## Deploying on Hostinger (Node.js Web App → Import from GitHub)

| Setting | Value |
|---|---|
| Framework preset | **Express** |
| Branch | `main` |
| Node version | **20.x** or **22.x** (18.x also works) |
| Root directory | `./` |
| Build command | `npm install` (default) — there's nothing to build |
| Start command / entry file | `npm start` · `server.js` |

**Environment variables** (Hostinger → *Environment variables → Add*; all optional):

| Variable | What it's for |
|---|---|
| `DATA_DIR` | Where CMS content, uploads, bookings and the admin password are stored. Defaults to `./data`. **Set this to a folder outside the app directory if your plan allows it**, so a redeploy can't wipe CMS edits (e.g. `/home/<user>/outsourcify-data`). |
| `SESSION_SECRET` | A long random string for admin sessions. If empty, one is generated in `DATA_DIR/secret.key`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Sending booking and contact notifications. For Hostinger email: `smtp.hostinger.com`, `465`, e.g. `no-reply@outsourcify.ge` and its password. Without these, submissions are still saved and shown in the admin panel, but no emails are sent. |
| `MAIL_FROM` | Optional sender, e.g. `Outsourcify <no-reply@outsourcify.ge>` |

After the first deploy:
1. Open `/admin` and create the administrator account (password: at least 10 characters).
2. In *Settings → SEO*, check the domain (`https://outsourcify.ge`).
3. Connect the domain in Hostinger and submit `https://outsourcify.ge/sitemap.xml` in Google Search Console.

> ⚠️ **Redeploys and content.** CMS edits live in `DATA_DIR`, not in git. On first start the default content from
> `content/` is copied there, and after that it's never overwritten. If `DATA_DIR` sits inside the app folder
> and the host replaces that folder on redeploy, edits can be lost — so use an outside `DATA_DIR`, and download
> **Admin → Backup** before each redeploy (the same screen restores it).

---

## Structure

| URL (KA · primary) | URL (EN) | Page |
|---|---|---|
| `/` | `/en/` | Home |
| `/chven-shesakheb` | `/en/about-us` | About us |
| `/servisebi` | `/en/services` | Services overview |
| `/servisebi/<slug>` | `/en/services/<slug>` | 6 individual service landing pages |
| `/rogor-vmushaobt` | `/en/how-it-works` | How it works |
| `/ratom-outsourcify` | `/en/why-outsourcify` | Why Outsourcify (+ in-house vs outsourcing table) |
| `/vistan-vmushaobt` | `/en/industries` | Who we serve / client types |
| `/khshirad-dasmuli-kitkhvebi` | `/en/faq` | FAQ (4 categories) |
| `/kontakti` | `/en/contact` | Contact + form |
| `/konsultatsiis-dajavshna` | `/en/book-a-consultation` | Chat-style booking |
| `/konfidentsialurobis-politika` | `/en/privacy-policy` | Privacy Policy |
| `/tsesebi-da-pirobebi` | `/en/terms-and-conditions` | Terms & Conditions |
| `/sitemap.xml`, `/robots.txt` | | generated automatically |

```
server.js            Express app: security headers, static files, sessions, routes
src/
  core.js            language helpers, JSON storage (DATA_DIR), sanitising, slugify
  content.js         loaders, URL building, routing, hreflang alternates
  schema.js          ★ component/record definitions — drive both the admin forms and sanitising
  blocks.js          ★ reusable section renderers (hero, cards, services, split, steps, compare, faq, cta…)
  layout.js          <head> SEO/OG/hreflang/JSON-LD, header + mega menu, mobile menu, footer
  strings.js         UI strings (buttons, form labels, chat questions) — overridable in the CMS
  booking.js · mail.js · auth.js · media.js · icons.js · logo.js
  routes/site.js     pages, services, sitemap.xml, robots.txt, 404
  routes/api.js      /api/slots · /api/book · /api/lead
  admin/             CMS (/admin): router.js + ui.js
public/              static files: assets/css, assets/js, fonts (TBCX), images, admin/admin.{css,js}
content/             default content (JSON) — copied into DATA_DIR on first start
tools/               check.js (render test) · seo-report.js (→ SEO.md) · reset-content.js
```

Only `public/` and `DATA_DIR/uploads` are served to the web. Source code, `content/` and `DATA_DIR` never are.

| Script | What it does |
|---|---|
| `npm start` | runs the server |
| `npm run dev` | runs with auto-restart |
| `npm run check` | renders every page in both languages (quick smoke test) |
| `npm run seo` | regenerates `SEO.md` from the current content |
| `npm run reset-content` | copies missing default content into `DATA_DIR` (`-- --force` overwrites content, never bookings, leads or the password) |

---

## CMS — `/admin`

| Section | What the client can do |
|---|---|
| **Pages** | Edit every page as a list of reusable blocks: change text in KA/EN side by side, reorder (↑↓), duplicate, hide, delete, **add new blocks** (14 types). Per-page SEO title/description with live character counters, slug, OG image, noindex. **Create new pages.** |
| **Services** | Add, edit, reorder, hide and delete services. Each has its own page (intro, rich description, "what's included", audience, benefits, service FAQ, SEO). Services appear automatically in the mega menu, homepage, footer, booking chat and sitemap. |
| **FAQ** | Questions by category (general / services / process / booking). FAQ schema is generated automatically. |
| **Testimonials** | Real client testimonials. **The section stays hidden until the first one is added**, so nothing invented is ever published. |
| **Who we serve** | Client types / industries cards. |
| **Menu & footer** | Header navigation (with a services mega-menu toggle) and both footer link columns. |
| **Photos** | Upload (resized to 2000px and converted to WebP via `sharp`, with an SEO-friendly file name), browse, delete. Any image field can pick from the library or upload in place. |
| **Submissions** | Bookings and contact messages: details, status (new / contacted / done / cancelled — cancelling frees the slot), delete, **CSV export**. |
| **Settings** | Contacts, address, hours, socials, footer text, notification email · SEO (domain, GA4, Search Console, organization description, noindex switch) · booking schedule (days, hours, slot length, notice, blocked dates) · shared process steps and CTA · **every UI text** in both languages. |
| **Backup** | Download all content, bookings and messages as one JSON file, and restore it. |
| **Dashboard** | New submissions, upcoming consultations and an **SEO health check** of title/description lengths. |

Security: scrypt password hashing, signed HttpOnly session cookie, CSRF tokens on every form, 15-minute lockout after
6 failed logins, uploads checked by content (not extension) with SVG scripts blocked, all output escaped,
and rate limits plus a honeypot on public forms.

---

## Booking (chat-style)

Runs inline on the booking page. On every other page it opens from the floating button or any "Book" button
(on mobile, as a full-screen sheet from the bottom bar).

1. Service → 2. About your business → 3. Support needed (multi-select) → 4. Date & time (live free slots,
or "agree on a time later") → 5. Name → 6. Email → 7. Phone → 8. Message (optional) → 9. Summary with edit links →
confirmation with **Add to Google Calendar**.

Progress bar, typing indicator, back/edit at every step, validation, and progress kept in `sessionStorage`.
Double-booking is prevented, since the check and the write happen in one synchronous step. If a slot gets taken in
the meantime, the visitor is sent back to choose another. The team gets a Georgian email and the client a confirmation
in their own language (when SMTP is configured). Times are in `Asia/Tbilisi`.

---

## SEO

- Georgian at `/`, English at `/en/`. Each page has `canonical`, `hreflang` ka/en/x-default, OG/Twitter tags and a unique title and description.
- JSON-LD `@graph`: **Organization + AccountingService**, WebSite, WebPage, **BreadcrumbList**, **Service**, **ItemList**, **FAQPage**.
- `sitemap.xml` with language alternates. `robots.txt` blocks `/admin` and `/api`.
- One H1 per page, no skipped heading levels, breadcrumbs, `srcset`, `width`/`height` on images, lazy loading, `fetchpriority` on the hero image.
- All titles, descriptions, URLs and keywords (KA + EN) → [`SEO.md`](SEO.md).

## Performance and accessibility

~15 KB CSS + ~9 KB JS gzipped, no front-end frameworks, gzip compression, year-long caching for versioned assets,
and preloaded fonts. Reduced-motion support, skip link, visible focus states, keyboard-accessible menus, labelled
forms with live errors, and WCAG AA contrast. Tested with no horizontal scroll at 360–1440 px on all 34 pages.

---

## Content notes — please verify before launch

Content is based on the brand book, the logo files and the public description of outsourcify.ge: accounting with a
certified team, organised accounting, effective software, historical records correction, tax consultation, tax return
filing, BPO (staff in the client's office) and financial consulting for businesses of all sizes, plus the contact
details +995 591 171 888 and info@outsourcify.ge.

Deliberately **not** included (add them in the CMS when you have them): statistics, client names and logos,
certifications, testimonials, prices, office address, working hours, social links and a map.
The **Privacy Policy and Terms** are templates **to be reviewed by a lawyer**.
The default booking schedule is Mon–Fri 10:00–18:00 in 30-minute slots.
The TBCX font files are copyrighted — confirm the licence covers web use.
