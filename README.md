# Outsourcify — corporate website + CMS

Bilingual (Georgian primary, English secondary) website for **Outsourcify** — accounting,
tax consulting and business process outsourcing. It has a chat-style consultation booking,
SEO built in from the start, and a flat-file CMS so the client can edit everything without
touching code.

**Stack:** plain PHP 8.1+, HTML, CSS and vanilla JS. No database, no build step,
no npm dependencies. It runs on any shared hosting (Hostinger, cPanel) and uses the same approach as the Webico site.

```
php -S localhost:8000 router.php   # local preview → http://localhost:8000
```

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

Services: accounting & bookkeeping, tax consulting, tax return preparation & filing,
historical records correction, BPO and financial consulting.

Every slug can be changed in the CMS (Georgian slugs are transliterated to Latin automatically).
New pages and services get their own URLs in both languages.

```
index.php          front controller: routing, sitemap.xml, robots.txt, 404
router.php         the same routing for `php -S` (local)
.htaccess          Apache/LiteSpeed: HTTPS, www→non-www, front controller, caching, security headers
inc/               core (never public — blocked by .htaccess)
  core.php         i18n helpers, JSON storage, CSRF, sanitising, slugify
  content.php      loaders, URL building, routing, hreflang alternates
  schema.php       ★ component/record definitions — drives both the admin forms and sanitising
  blocks.php       ★ reusable section renderers (hero, cards, services, split, steps, compare, faq, cta…)
  layout.php       <head> SEO/OG/hreflang/JSON-LD, header + mega menu, mobile menu, footer
  strings.php      UI strings (buttons, form labels, chat questions) — overridable in CMS
  booking.php      working hours, free slots, labels (KA/EN)
  auth.php, media.php, mail.php, icons.php, logo.php
api/               lead.php (contact form), book.php (booking), slots.php (free times)
admin/             CMS (index.php, ui.php, admin.js, admin.css)
content/           ★ all site content as JSON (blocked from the web)
assets/            css/site.css, js/site.js, fonts (TBCX), img/brand, img/photos
tools/seed-content.php   regenerates default content (php tools/seed-content.php --force)
tools/seo-report.php     writes the SEO table → SEO.md
```

---

## CMS — `/admin/`

On the first visit, `/admin/` asks you to create the administrator account (password: at least 10 characters).
The password hash is stored in `content/auth.php` (not in git).

| Section | What the client can do |
|---|---|
| **Pages** | Edit every page as a list of reusable blocks: change text in KA/EN side by side, reorder (↑↓), duplicate, hide, delete, **add new blocks** (14 types). Per-page SEO title/description with live character counters, slug, OG image, noindex. **Create new pages.** |
| **Services** | Add, edit, reorder, hide and delete services. Each service has its own page (intro, rich description, "what's included", audience, benefits, service FAQ, SEO). Services appear automatically in the mega menu, homepage, footer, booking chat and sitemap. |
| **FAQ** | Manage questions by category (general / services / process / booking). FAQ schema is generated automatically. |
| **Testimonials** | Add real client testimonials. **The section stays hidden until the first testimonial is added**, so nothing invented is ever published. |
| **Who we serve** | Client types / industries cards. |
| **Menu & footer** | Header navigation (with services mega menu toggle) and both footer link columns. |
| **Photos** | Upload (auto-resized to 2000px and converted to WebP, SEO-friendly file name taken from the original), browse, delete. A picker lets any image field choose from the library or upload in place. |
| **Submissions** | Consultation bookings and contact-form messages: details, status (new / contacted / done / cancelled — cancelling frees the time slot), delete, **CSV export**. |
| **Settings** | Contacts, address, hours, socials, footer text, notification email · SEO (domain, GA4, Search Console, organization description, noindex switch) · booking schedule (days, hours, slot length, notice, blocked dates) · shared process steps and CTA · **every UI text** (buttons, form labels, chat questions) in both languages. |
| **Dashboard** | New submissions, upcoming consultations, an **SEO health check** listing pages whose titles/descriptions are outside the recommended length. |

Changes appear on the site immediately. Everything is saved atomically to `content/*.json`.

### Block types (reusable components)
Hero · Page header (with breadcrumbs) · Cards (grid / strip / dark bento / numbered) · Services grid or list ·
Image + text · Process steps (shared or custom) · Comparison table · Who we serve · Testimonials · FAQ ·
CTA band · Stats (only for real numbers) · Rich text (with automatic table of contents) · Booking chat · Contact + form + map.

---

## Booking (chat-style)

On the booking page it runs inline; on every other page it opens from the floating button or any
"Book a consultation" button (on mobile it's a full-screen sheet opened from the bottom bar).

1. Service → 2. About your business → 3. Support needed (multi-select) → 4. Date & time
(live free slots, or "agree on a time later") → 5. Name → 6. Email → 7. Phone → 8. Message (optional)
→ 9. Summary with edit links → confirmation screen with **Add to Google Calendar**.

- Progress bar, typing indicator, back/edit at every step, validation, progress kept in `sessionStorage`.
- On service pages, the "Book" button pre-selects that service.
- Double-booking is prevented with a file lock; if a slot is taken meanwhile, the user is sent back to pick another.
- The team gets an email (Georgian) and the client gets a confirmation in their own language.
- Rate limits and honeypot on both endpoints.

**Email:** PHP `mail()` from `no-reply@<domain>` → address set in *Settings → notification email*
(fallback: contact email, then `info@outsourcify.ge`). On Hostinger this works once the domain's
email is set up. Check SPF/DKIM if mail lands in spam.

---

## SEO

- Georgian at `/`, English at `/en/`. Every page has `canonical`, `hreflang` ka/en/x-default, OG/Twitter tags and a unique title and description.
- JSON-LD `@graph`: **Organization + AccountingService** (LocalBusiness subtype), WebSite, WebPage (About/Contact/Collection),
  **BreadcrumbList**, **Service** (service pages), **ItemList** (services), **FAQPage** (any page with an FAQ block).
- `sitemap.xml` with `xhtml:link` alternates for both languages. `robots.txt` blocks `/admin`, `/api`, `/content`.
- Exactly one H1 per page, no skipped heading levels, semantic landmarks, breadcrumbs on all inner pages.
- Images: descriptive file names, alt text in both languages, `srcset` (560/960/1600), `width`/`height` to prevent CLS, lazy loading; the LCP image uses `fetchpriority=high`.
- **All SEO titles, meta descriptions, URLs and keywords (KA + EN)** → [`SEO.md`](SEO.md).
  Regenerate after content edits: `php tools/seo-report.php > SEO.md`.

## Performance and accessibility

- ~15 KB CSS + ~9 KB JS (gzipped), no frameworks, fonts preloaded with `font-display: swap`, SVG icons and logo inline (logo as a sprite).
- Static assets cached for a year and cache-busted by file hash (`?v=`), gzip enabled, HTML never cached.
- Animations use transform/opacity only and switch off with `prefers-reduced-motion`.
- Skip link, visible focus states, keyboard-accessible mega menu (Esc, focus-out), mobile menu, FAQ (`<details>`),
  labelled form fields with `aria-invalid` and live error messages, `aria-live` chat log, WCAG AA contrast.
- Tested with no horizontal scroll at 360, 390, 768, 900, 1024, 1180, 1280, 1340 and 1440 px.

---

## Deployment (Hostinger / cPanel)

1. Upload everything to `public_html` (the site must be at the domain root).
2. Make `content/` and `assets/img/uploads/` writable by PHP (755/775).
3. Visit `/admin/` and create the admin account.
4. *Settings → SEO*: check the domain (`https://outsourcify.ge`), add GA4 / Search Console if needed.
5. Submit `https://outsourcify.ge/sitemap.xml` in Google Search Console.

> ⚠️ When deploying with git, **don't overwrite `content/`** on the server after the client starts
> editing — CMS changes live there. `content/auth.php`, `leads.json` and `bookings.json` are git-ignored.

Nginx: route everything that isn't a file to `index.php` (`try_files $uri $uri/ /index.php?$query_string;`)
and deny `/content`, `/inc` and `/tools`.

---

## Content notes — please verify before launch

The live site couldn't be fetched from this build environment, so content was built from the
brand book, the logo files and the publicly indexed description of outsourcify.ge:
accounting services with a certified team, well-organised accounting, effective software, historical records
correction, tax consultation, tax return filing, BPO (staff working in the client's office) and financial consulting
for businesses of all sizes, plus the contact details +995 591 171 888 and info@outsourcify.ge.

Deliberately **not** included (add them in the CMS when you have them): statistics and numbers, client names/logos,
certifications, testimonials, prices, office address, working hours, social links and a map.

Please review:
- the detailed "what's included" lists and FAQ answers for each service (standard descriptions of these services — adjust to the actual scope);
- the **Privacy Policy and Terms** — sensible templates based on what the site collects, **to be reviewed by a lawyer**;
- the booking schedule (Mon–Fri 10:00–18:00, 30-minute slots by default — *Settings → Booking*).

Brand: colours #0D4E8B / #237BC5 / white from the brand book. The logo was vectorised from the supplied PDF.
The header uses a horizontal lockup (ring + wordmark) for legibility at small sizes, and the full logo is used on the admin login page and the OG image.
Typography is TBCX (supports Georgian and Latin). Photos are the brand-book imagery, converted to grayscale WebP with a blue brand tint applied in CSS.
