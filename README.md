# The Pasta Company

Brand website for The Pasta Company, a durum wheat pasta brand of Eshanura
Enterprises Private Limited. Static HTML, no runtime framework, no build-time
dependencies beyond Python and Node for the generator.

**Live:** https://pastacompany-eshanura.web.app (Firebase project
`pastacompany-eshanura`). The custom domain `pasta.eshanura.com` is registered
and its A record already matches — see [Custom domain](#custom-domain) for the
one DNS record still outstanding.

Every visual on the site is derived from the brand's reference design; the
Eshanura wordmark in the footer comes from the sister **The Nuts Company**
build at full resolution.

---

## Quick start

```bash
npm install          # playwright-core + axe-core (dev only)
npm run assets       # crop + alpha-key imagery out of the reference design
npm run fonts        # self-host Playfair Display, Kaushan Script, Poppins
npm run build        # generate the HTML into the repo root
npm run check        # static link / alt / id / orphan-asset checks
npm run audit        # axe-core + behaviour assertions in a real browser
npm run serve        # http://127.0.0.1:4180
npm run deploy      # firebase deploy --only hosting
npm run shots        # full-page screenshots to build/shots/
```

`npm run all` chains assets → fonts → build → check.

The browser-driven steps (`audit`, `shots`) use the Chrome already installed on
the machine via `playwright-core`, so no browser download is required.

---

## Layout

```
build/
  extract_assets.py   crops and keys imagery out of the reference PNG
  fetch_fonts.py      downloads + self-hosts the woff2 files
  data.mjs            the content model: products, recipes, nav, trade copy
  site.mjs            the HTML generator (layouts, components, pages)
  serve.mjs           static preview server
  check_site.py       static checks axe cannot perform
  audit.mjs           axe-core + interaction assertions
  screenshot.mjs      desktop + mobile capture
assets/
  css/styles.css      the design system
  css/fonts.css       generated @font-face sheet
  js/app.js           cart, filtering, search, drawers
  img/                every asset, produced by extract_assets.py
*.html                generated — edit build/data.mjs or build/site.mjs instead
```

**Edit the source, not the output.** The HTML files are generated artefacts.

---

## How the imagery was produced

The reference design is a 1024 × 1536 screenshot, which is low resolution for a
production site and, more importantly, has its own interface baked into the
photography. `build/extract_assets.py` handles both problems:

- **Coordinates are detected, not guessed.** Pack-shot and shape-art bounds are
  found by walking the image for non-backdrop columns and rows, so no crop can
  reach into a neighbouring bag.
- **Baked UI is removed.** Crops start below the reference's own header. The
  recipe-card crops inset past the card border, the cream title strip and the
  circular arrow button. The saffron "sticky note" on the hero is *inpainted* —
  its pixels are diffused inward from the surrounding pixels, which reconstructs
  the out-of-focus kitchen backdrop convincingly.
- **Products are cut out.** Packs and loose pasta are lifted onto transparency
  with a per-row background estimate. The estimate only accepts light,
  low-saturation pixels as background, so a bag spanning most of a row cannot
  drag it off the backdrop. The soft edge is then un-multiplied against that
  backdrop, otherwise a pale halo follows the product onto dark surfaces.
- **Small cutouts are upscaled** with Lanczos plus an unsharp pass, which keeps
  them usable at card size without the ringing a harder sharpen would add.

The wordmark is **not** an image — it is live HTML type (see `.logo` in
`styles.css`) so it stays sharp at every size and needs no asset.

---

## SEO

Every page ships a JSON-LD `@graph` built by `build/site.mjs`:

| Node | Where |
| --- | --- |
| `Organization`, `Brand`, `WebSite` | every page — including the Eshanura postal address, which gives Google a verified business location |
| `Product` + one `Offer` per pack size | home and pasta pages, so prices and stock state can surface in results |
| `Recipe` with `recipeIngredient` / `recipeInstructions` | all four recipe pages — the richest result type a food brand can win |
| `BreadcrumbList` | every page except the home page |
| `FAQPage` | contact page |

`npm run check` fails the build if a page loses its canonical, its `og:url`, or
its structured data; if JSON-LD stops parsing; if a title exceeds 60 characters
or a description exceeds 160 (both truncated by Google); or if the 404 page ever
becomes indexable.

### Getting indexed

Technical SEO is automatic — `sitemap.xml` lists every page with a curated
priority, and `robots.txt` points at it. Google still has to *discover* the
domain, and nothing in this repo can force that. Two things make it fast:

1. Add `pasta.eshanura.com` as a **domain property** in Google Search Console
   and submit `https://pasta.eshanura.com/sitemap.xml`. This is the only step
   that reliably triggers a crawl request; do it the day the domain resolves.
2. Leave `sitemap.xml` linked from `robots.txt` and `<link rel="sitemap">` in
   every head — both are already in place.

Indexing then typically takes days, not minutes. Google's old
`/ping?sitemap=` endpoint no longer does anything useful.

## Custom domain

`pasta.eshanura.com` is registered against the hosting site and resolves to
Firebase's IP. The TLS certificate is still `CERT_PENDING`, which needs one TXT
record that only the DNS provider can add:

| Host | Type | Value |
| --- | --- | --- |
| `_acme-challenge.pasta.eshanura.com` | TXT | see below |

The challenge token rotates, so read the current value from
**Firebase console → Hosting → Add custom domain → pasta.eshanura.com**, or run:

```bash
node build/add_domain.mjs pastacompany-eshanura pasta.eshanura.com
```

Once the record is in place the certificate issues on its own, usually within
minutes, and the domain starts serving. Re-run the deploy afterwards if you
want to be certain the release is current.

`build/add_domain.mjs` also lists the domains already mapped to the site, so it
is safe to re-run — it exits early if the domain is present.

## Quality gates

`npm run check` fails the build on: a missing `lang`, an empty `<title>` or
meta description, anything other than exactly one `<h1>`, a duplicate `id`, an
`<img>` with no `alt`, a link or asset path that does not resolve, a fragment
pointing at an id that does not exist (including across pages), and an asset
sitting on disk that nothing references.

`npm run audit` fails on any serious or critical axe-core violation, and also
asserts behaviour: shape filtering narrows the grid, the size picker sets
`aria-pressed`, add-to-cart produces the right line, quantity and total, the
stepper and remove work, the cart drawer closes, search returns hits, the mobile
nav opens, and the enquiry forms refuse an invalid submit. It also fails if any
card's Add to Cart button is not on the same baseline as its neighbours, and
watches for console errors, page errors and failed requests.

Current state: **13 pages, zero axe violations, zero runtime errors, all
behaviour assertions passing.**

---

## Content caveats — please read before going live

- **Prices are placeholders.** Every price in `build/data.mjs` is invented and
  flagged as such in `priceNote`, which is rendered on the pages that show
  pricing and in the cart footer. Replace them with the rate card from Eshanura
  before launch. The sibling Nuts Company build uses the same convention.
- **No checkout.** The cart is real and persists to `localStorage`, but there is
  no payment processor behind it. Checkout tells the user to phone or email
  Customer Care, and the trade forms validate and confirm but do not transmit.
  Both notes are visible in the UI rather than hidden.
- **Recipes are original.** The four recipes reference the reference design's
  card titles. The ingredients and method were written for this build.
- **Photography is limited by the source.** The reference is the only source of
  imagery, so product shots are small and upscaled. Re-shooting the range at
  print resolution would materially improve the site; the asset paths and
  component markup would not need to change.
- **Social links are placeholders** to the brand's presumed handles.

---

## Accessibility notes

Colour tokens are tuned so text clears WCAG AA on every surface it appears on:
`--gold-600` (5.1:1 on cream) for gold text, `--gold-500` used only as a
surface colour paired with `--green-900` text (5.7:1), and `--gold-400`
(5.8:1) for gold on the dark green panels. Drawers trap focus and close on
Escape; the mobile nav and both drawers manage `aria-expanded` / `aria-modal`;
all motion is disabled under `prefers-reduced-motion`.

---

© The Pasta Company — a product by Eshanura Enterprises Private Limited.
