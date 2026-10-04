/**
 * Static generator for The Pasta Company site.
 *
 * Reads the content model in data.mjs and writes plain HTML to the repo root.
 * No framework, no client-side templating: every page is fully rendered so it
 * works without JavaScript, and JavaScript only layers on the cart, filtering
 * and search.
 */

import { writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  brand,
  products,
  sizes,
  sizeNote,
  recipes,
  retailerBenefits,
  distributorBenefits,
  trustPoints,
  nav,
  priceNote,
} from "./data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* --- helpers ------------------------------------------------------------ */

const rupee = (n) => `₹${n}`;
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Resolve a root-relative asset path to the current page's depth. */
const asset = (p, depth) => (depth ? Array(depth).fill("../").join("") : "") + p;

const packImg = (slug, size) => `assets/img/packs/${slug}-${size}.png`;

/* --- icons -------------------------------------------------------------- */

const ICONS = {
  search: `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>`,
  cart: `<path d="M3 4h2.2l2.1 11.2a1.8 1.8 0 0 0 1.8 1.5h8.4a1.8 1.8 0 0 0 1.8-1.4L21 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>`,
  menu: `<path d="M3 6h18M3 12h18M3 18h18"/>`,
  close: `<path d="m5 5 14 14M19 5 5 19"/>`,
  arrow: `<path d="M4 12h15m-6-6 6 6-6 6"/>`,
  arrowUr: `<path d="M7 17 17 7m-8 0h8v8"/>`,
  check: `<path d="m4 12.5 5 5L20 6.5"/>`,
  wheat: `<path d="M12 22V9"/><path d="M12 9c0-3 2-5 5-5 0 3-2 5-5 5Zm0 0c0-3-2-5-5-5 0 3 2 5 5 5Z"/><path d="M12 15c0-2.6 1.8-4.5 4.4-4.5 0 2.6-1.8 4.5-4.4 4.5Zm0 0c0-2.6-1.8-4.5-4.4-4.5 0 2.6 1.8 4.5 4.4 4.5Z"/>`,
  bowl: `<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M8 8c0-1.5 1-2 1-3.5M12 8c0-1.8 1-2.4 1-4M16 8c0-1.5 1-2 1-3.5"/><path d="M2 20h20"/>`,
  heart: `<path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>`,
  users: `<circle cx="9" cy="8" r="3.4"/><path d="M2.6 20a6.4 6.4 0 0 1 12.8 0"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.6M18 14.4a6.4 6.4 0 0 1 3.4 5.6"/>`,
  level: `<path d="M12 3.5 14.6 9l6 .6-4.5 4 1.3 5.9L12 16.3 6.6 19.5 7.9 13.6 3.4 9.6 9.4 9Z"/>`,
  phone: `<path d="M6.4 3.5h2.9l1.6 4-2 1.4a11.5 11.5 0 0 0 6.2 6.2l1.4-2 4 1.6v2.9a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2Z"/>`,
  mail: `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.6 7 8.4 6 8.4-6"/>`,
  globe: `<circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6M3.2 14.5h17.6"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  minus: `<path d="M5 12h14"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/>`,
  bag: `<path d="M5 8h14l-1 12H6Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>`,
  trash: `<path d="M4.5 7h15M9.5 7V5.5h5V7M6.5 7l.9 13h9.2l.9-13"/>`,
  leaf: `<path d="M4.5 19.5C4.5 11 10 5 20 4.5 19.5 14.5 13.5 19.5 4.5 19.5Z"/><path d="M9 15c2.5-3 5.5-5.5 9-7"/>`,
  shield: `<path d="M12 3.2 19.5 6v6c0 4.3-3 7.7-7.5 8.8C7.5 19.7 4.5 16.3 4.5 12V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>`,
  truck: `<path d="M2.8 6.5h11v10h-11z"/><path d="M13.8 10h4l3.4 3.4v3.1h-7.4Z"/><circle cx="7" cy="18.5" r="1.9"/><circle cx="17.5" cy="18.5" r="1.9"/>`,
  instagram: `<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/>`,
  facebook: `<path d="M14.5 8.5V6.8c0-.8.4-1.3 1.4-1.3h1.7V2.6h-2.9c-2.9 0-4.2 1.9-4.2 4.3v1.6H8v3h2.5V22h4V11.5h2.9l.4-3Z"/>`,
  youtube: `<rect x="2.6" y="5.4" width="18.8" height="13.2" rx="4"/><path d="m10.4 9.6 5 2.4-5 2.4Z"/>`,
};

function icon(name, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

function sprite() {
  const symbols = Object.entries(ICONS)
    .map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`)
    .join("");
  return `<svg class="visually-hidden" aria-hidden="true" focusable="false"><defs>${symbols}</defs></svg>`;
}

const useIcon = (name, cls = "") =>
  `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

/* --- structured data ---------------------------------------------------- */

/** Absolute URL for a page path. */
const pageUrl = (file) => `${brand.url}/${file === "index.html" ? "" : file}`;

const ORG_ID = `${brand.url}/#organization`;
const SITE_ID = `${brand.url}/#website`;
const BRAND_ID = `${brand.url}/#brand`;
const ORG_REF = { "@id": ORG_ID };
const BRAND_REF = { "@id": BRAND_ID };

const packSlug = (p) => p.slug.replace(/^(desi|classic|masala|pasta)-/, "");

/** Nodes shared by every page: who we are, and what the site is. */
function coreGraph() {
  return [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: brand.legalShort,
      url: `${brand.url}/`,
      telephone: "+91-98394-36346",
      email: brand.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: brand.address.streetAddress,
        addressLocality: brand.address.addressLocality,
        addressRegion: brand.address.addressRegion,
        postalCode: brand.address.postalCode,
        addressCountry: brand.address.addressCountry,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer care",
        telephone: "+91-98394-36346",
        email: brand.email,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    },
    {
      "@type": "Brand",
      "@id": BRAND_ID,
      name: brand.name,
      slogan: brand.tagline,
      description:
        "Durum wheat pasta made for Indian kitchens — Desi Penne, Masala Fusilli, Classic Macaroni, Spaghetti and Pasta Mix in 100 g, 200 g and 500 g packs.",
      logo: `${brand.url}/assets/img/brand/favicon-512.png`,
      parentOrganization: ORG_REF,
    },
    {
      "@type": "WebSite",
      "@id": SITE_ID,
      url: `${brand.url}/`,
      name: brand.name,
      description: brand.tagline,
      inLanguage: "en-IN",
      publisher: ORG_REF,
    },
  ];
}

/** One Product node with a real Offer per pack size. */
function productGraph(p, url) {
  const slug = packSlug(p);
  const offers = sizes.map((s) => ({
    "@type": "Offer",
    name: `${p.name} ${s} g`,
    sku: `${slug}-${s}`,
    price: `${p.price[s]}.00`,
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    url: `${url}#${p.slug}`,
    seller: ORG_REF,
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
    },
  }));

  return {
    "@type": "Product",
    "@id": `${url}#${p.slug}`,
    name: p.name,
    description: p.long,
    sku: slug,
    image: [`${brand.url}/${p.shape}`],
    brand: BRAND_REF,
    manufacturer: ORG_REF,
    category: "Pasta > Durum Wheat Pasta",
    material: "100% Durum Wheat Semolina",
    offers: offers.length === 1 ? offers[0] : offers,
  };
}

/** Full Recipe node — the richest result type available to a food brand. */
function recipeGraph(r, url) {
  const product = products.find((p) => p.slug === r.product);
  return {
    "@type": "Recipe",
    "@id": `${url}#recipe`,
    name: r.title,
    description: r.intro,
    image: [`${brand.url}/${r.img}`],
    author: ORG_REF,
    publisher: ORG_REF,
    brand: BRAND_REF,
    datePublished: "2026-01-01",
    prepTime: `PT${r.time}M`,
    totalTime: `PT${r.time}M`,
    recipeYield: `Serves ${r.serves}`,
    recipeCategory: "Main Course",
    recipeCuisine: "Indian",
    keywords: `${r.title}, pasta recipe, desi pasta, ${product?.name ?? ""}`,
    recipeIngredient: r.ingredients.map(([, n]) => n),
    recipeInstructions: r.method.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s,
    })),
    isPartOf: { "@id": SITE_ID },
  };
}

function breadcrumbGraph(crumbs, url) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.href ? pageUrl(c.href) : url,
    })),
  };
}

function faqGraph(faqs, url) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function jsonLd(nodes) {
  // A literal "</script" in a description would close the block early.
  const payload = JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(
    /<\/script/gi,
    "<\\/script"
  );
  return `<script type="application/ld+json">${payload}</script>`;
}

/* --- layout ------------------------------------------------------------- */

function logo(depth) {
  return `<a class="logo" href="${asset("index.html", depth)}" aria-label="${esc(brand.name)} — home">
      <span class="logo__the">The</span>
      <span class="logo__pasta">Pasta</span>
      <span class="logo__company">Company<span class="logo__tm" aria-hidden="true">™</span></span>
    </a>`;
}

function header(page, depth) {
  const links = nav
    .map(
      (n) =>
        `<a class="nav__link" href="${asset(n.href, depth)}"${n.href === page ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`
    )
    .join("");

  const mlinks = nav
    .map((n) => `<a href="${asset(n.href, depth)}"${n.href === page ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`)
    .join("");

  return `<header class="header" id="site-header">
      <div class="shell shell--wide header__bar">
        ${logo(depth)}
        <nav class="nav" aria-label="Primary">${links}</nav>
        <div class="header__tools">
          <button class="icon-btn" type="button" data-open-search aria-label="Search the site">${useIcon("search")}</button>
          <button class="icon-btn" type="button" data-open-cart aria-label="Open cart">
            ${useIcon("cart")}<span class="cart-count" data-cart-count data-count="0"></span>
          </button>
          <a class="btn btn--sm" href="${asset("pasta.html", depth)}">Buy Now ${useIcon("arr", "arr")}</a>
          <button class="icon-btn burger" type="button" data-open-menu aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">${useIcon("menu")}</button>
        </div>
      </div>
    </header>
    <nav class="mnav" id="mobile-nav" aria-label="Mobile">
      ${mlinks}
      <div class="mnav__cta"><a class="btn btn--block" href="${asset("pasta.html", depth)}">Buy Now ${useIcon("arr", "arr")}</a></div>
    </nav>`;
}

function footer(depth) {
  const linkList = (items) =>
    `<ul class="footer__links">${items
      .map((n) => `<li><a href="${asset(n.href, depth)}">${esc(n.label)}</a></li>`)
      .join("")}</ul>`;

  const quick = linkList(nav.slice(0, 3));
  const trade = linkList(nav.slice(3, 6));
  const socials = brand.social
    .map(
      (s) =>
        `<a href="${s.href}" aria-label="${esc(s.label)}" rel="noopener noreferrer" target="_blank">${useIcon(s.icon)}</a>`
    )
    .join("");

  return `<footer class="footer">
      <div class="shell shell--wide">
        <div class="footer__grid">
          <div class="footer__brand">
            ${logo(depth)}
            <p>${esc(brand.tagline)}</p>
            <div class="parent" style="margin-top:1.5rem">
              <span class="parent__label">A brand by</span>
              <img src="${asset("assets/img/brand/eshanura-wordmark.png", depth)}" alt="Eshanura" width="520" height="108">
              <small>Eshanura Enterprises Private Limited</small>
            </div>
          </div>
          <div class="footer__col">
            <h2 class="footer__title">Quick Links</h2>
            ${quick}
          </div>
          <div class="footer__col">
            <h2 class="footer__title">Trade</h2>
            ${trade}
            <h2 class="footer__title" style="margin-top:1.5rem">Support</h2>
            <ul class="footer__links"><li><a href="${asset("contact.html", depth)}">Contact</a></li></ul>
          </div>
          <div class="footer__col">
            <h2 class="footer__title">Customer Care</h2>
            <ul class="contact-list">
              <li>${useIcon("phone")}<a href="tel:${brand.phoneHref}">${esc(brand.phone)}</a></li>
              <li>${useIcon("mail")}<a href="mailto:${brand.email}">${esc(brand.email)}</a></li>
              <li>${useIcon("globe")}<a href="https://${brand.domain}" rel="noopener noreferrer" target="_blank">${esc(brand.domain)}</a></li>
            </ul>
          </div>
          <div class="footer__col">
            <h2 class="footer__title">Follow Us</h2>
            <div class="socials">${socials}</div>
          </div>
        </div>
        <div class="footer__base">
          <p>© ${new Date().getFullYear()} ${esc(brand.name)}. A product by ${esc(brand.legal)}.</p>
          <nav aria-label="Legal"><a href="${asset("legal.html", depth)}#privacy">Privacy Policy</a><a href="${asset("legal.html", depth)}#terms">Terms &amp; Conditions</a></nav>
        </div>
      </div>
    </footer>`;
}

function overlays(depth) {
  return `<div class="drawer-scrim" data-close-all hidden-skip></div>
    <aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">
      <div class="drawer__head">
        <h2 id="cart-title">Your Cart</h2>
        <button class="icon-btn" type="button" data-close-cart aria-label="Close cart">${useIcon("close")}</button>
      </div>
      <div class="drawer__body" data-cart-body></div>
      <div class="drawer__foot">
        <div class="drawer__total"><span>Total</span><span data-cart-total>₹0</span></div>
        <p class="drawer__fine">${esc(priceNote)}</p>
        <button class="btn btn--block" type="button" data-checkout>Checkout</button>
        <p class="form__note" style="margin-top:.75rem" data-checkout-note>Online checkout is not live yet. Use the trade enquiry forms or call ${esc(brand.phone)} to order.</p>
      </div>
    </aside>

    <aside class="drawer" id="search-drawer" role="dialog" aria-modal="true" aria-labelledby="search-title" tabindex="-1">
      <div class="drawer__head">
        <h2 id="search-title">Search</h2>
        <button class="icon-btn" type="button" data-close-search aria-label="Close search">${useIcon("close")}</button>
      </div>
      <div class="drawer__body">
        <form class="search" role="search" data-search-form>
          <div class="field">
            <label for="search-input">Search pasta, recipes and more</label>
            <input id="search-input" type="search" placeholder="Try &ldquo;fusilli&rdquo; or &ldquo;tadka&rdquo;" autocomplete="off" data-search-input>
          </div>
        </form>
        <div class="search__results" data-search-results role="status" aria-live="polite"></div>
      </div>
    </aside>

    <div class="toast" data-toast role="status" aria-live="polite"></div>`;
}

function layout({
  page,
  title,
  description,
  depth = 0,
  body,
  ogImage = "assets/img/brand/og-pasta.webp",
  ogAlt,
  ogType = "website",
  keywords = "",
  schema = [],
  noindex = false,
}) {
  const full = title === brand.name ? title : `${title} | ${brand.name}`;
  const url = pageUrl(page);
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title === brand.name ? `${brand.name} — Durum Wheat Pasta for Indian Kitchens` : full)}</title>
<meta name="description" content="${esc(description)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ""}
<meta name="author" content="${esc(brand.legalShort)}">
<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}">
<meta name="googlebot" content="${noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}">
<meta name="theme-color" content="#123f30">
<meta name="format-detection" content="telephone=no">
<link rel="canonical" href="${url}">

<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(brand.name)}">
<meta property="og:title" content="${esc(title === brand.name ? `${brand.name} — Durum Wheat Pasta` : full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${brand.url}/${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ogAlt ?? full)}">
<meta property="og:locale" content="en_IN">
<meta property="og:site_name" content="${esc(brand.legalShort)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(full)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${brand.url}/${ogImage}">

<link rel="icon" href="${asset("favicon.ico", depth)}" sizes="any">
<link rel="icon" href="${asset("assets/img/brand/favicon-32.png", depth)}" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${asset("assets/img/brand/apple-touch-icon.png", depth)}">
<link rel="manifest" href="${asset("site.webmanifest", depth)}">
<link rel="sitemap" type="application/xml" href="${asset("sitemap.xml", depth)}">
<link rel="preload" href="${asset("assets/fonts/playfair-800-latin.woff2", depth)}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${asset("assets/fonts/poppins-400-latin.woff2", depth)}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset("assets/css/fonts.css", depth)}">
<link rel="stylesheet" href="${asset("assets/css/styles.css", depth)}">
${jsonLd([...coreGraph(), ...(schema ?? [])])}
<noscript><style>.toast{display:none}</style></noscript>
</head>
<body data-page="${page}">
<a class="skip-link" href="#main">Skip to main content</a>
${sprite()}
${header(page, depth)}
<main id="main">
${body}
</main>
${footer(depth)}
${overlays(depth)}
<script src="${asset("assets/js/app.js", depth)}" defer></script>
</body>
</html>`;
}

/* --- components --------------------------------------------------------- */

function productCard(p, depth, { compact = false, level = 3 } = {}) {
  // Product slugs carry a qualifier the pack files drop: desi-penne -> penne,
  // pasta-mix -> mix. One place, so the pack path can never drift.
  const slug = p.slug.replace(/^(desi|classic|masala|pasta)-/, "");
  const H = `h${level}`;
  const sizeButtons = sizes
    .map(
      (s, i) => `<button class="size" type="button" aria-pressed="${i === 0}" data-size="${s}" data-price="${p.price[s]}" data-img="${asset(packImg(slug, s), depth)}">
        <img src="${asset(packImg(slug, s), depth)}" alt="${esc(p.name)} ${s} g pack" width="120" height="150" loading="lazy" decoding="async">
        <span class="size__label">${s} g</span>
        <span class="size__price">${rupee(p.price[s])}</span>
      </button>`
    )
    .join("");

  // The id anchors recipe pages and search hits to a specific product.
  return `<article class="pcard" id="${p.slug}" data-filter="${p.filter}" data-name="${esc(p.name)}">
    <div class="pcard__shape">
      <img src="${asset(p.shape, depth)}" alt="${esc(p.name)} — loose pasta" width="210" height="96" loading="${compact ? "lazy" : "eager"}" decoding="async">
    </div>
    <div class="pcard__body">
      <${H} class="pcard__title">${esc(p.name)}</${H}>
      <p class="pcard__blurb">${esc(p.blurb)}</p>
      <div class="sizes" role="group" aria-label="Choose a pack size for ${esc(p.name)}">${sizeButtons}</div>
      <button class="btn btn--block pcard__add" type="button" data-add-to-cart data-slug="${slug}" data-product="${esc(p.name)}">
        Add to Cart
      </button>
    </div>
  </article>`;
}

function recipeCard(r, depth, level = 3) {
  const H = `h${level}`;
  return `<a class="rcard" href="${asset(`recipe-${r.slug}.html`, depth)}">
    <div class="rcard__media">
      <span class="rcard__kicker">${esc(r.kicker)}</span>
      <img src="${asset(r.img, depth)}" alt="${esc(r.title)}" width="320" height="240" loading="lazy" decoding="async">
    </div>
    <div class="rcard__body">
      <${H}>${esc(r.title)}</${H}>
      <span class="rcard__go">${useIcon("arrow")}</span>
    </div>
    <ul class="rcard__meta">
      <li>${useIcon("clock")}${r.time} min</li>
      <li>${useIcon("level")}${esc(r.level)}</li>
      <li>${useIcon("users")}Serves ${esc(r.serves)}</li>
    </ul>
  </a>`;
}

function tradeList(items) {
  return `<ul class="trade-list">${items
    .map(
      (it) => `<li><span class="trade-list__tick">${useIcon("check")}</span><span class="trade-list__text">${esc(it.text ?? it)}${
        it.detail ? `<span class="trade-list__detail">${esc(it.detail)}</span>` : ""
      }</span></li>`
    )
    .join("")}</ul>`;
}

function pageHead(eyebrow, h1, lede, depth, crumbs = []) {
  const bc = crumbs.length
    ? `<nav class="breadcrumb" aria-label="Breadcrumb">${crumbs
        .map((c, i) =>
          i === crumbs.length - 1
            ? `<span aria-current="page">${esc(c.label)}</span>`
            : `<a href="${asset(c.href, depth)}">${esc(c.label)}</a><span aria-hidden="true">/</span>`
        )
        .join("")}</nav>`
    : "";
  return `<section class="pagehead">
    <div class="shell">${bc}
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${h1}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ""}
    </div>
  </section>`;
}

/* --- pages -------------------------------------------------------------- */

/** Single source for the FAQ so the markup and the FAQPage schema cannot drift. */
const faqs = [
  ["Is the pasta made from maida?", "No. Every shape in the range is milled on 100% durum wheat semolina. There is no maida blend anywhere in the recipe, which is why the pasta keeps a firm bite instead of going soft in a heavy sauce."],
  ["Which pack size should I buy?", "The 100 g pack is for trying a shape for the first time or for a single serving. The 200 g pack covers a typical week for one to two people. The 500 g pack is the family and gifting size. The recipe and the pasta are identical across all three."],
  ["Do you deliver directly to consumers?", "Currently the range moves through retail and distribution partners. Online checkout is not live on this site yet — call or email Customer Care and we will point you to the nearest stockist or take your order directly."],
  ["How do I stock The Pasta Company in my store?", "Retailers and distributors can both raise an enquiry through the forms on this site, or contact the trade team directly. We will share the rate card, case pack sizes and the POS kit."],
  ["Are the packs free of artificial colours?", "Yes. The golden colour comes from the durum wheat and the extrusion process. We add no artificial colours and no synthetic brighteners."],
  ["Who makes The Pasta Company?", "The Pasta Company is a brand of Eshanura Enterprises Private Limited, based in Lakhimpur Kheri, Uttar Pradesh. The same group makes The Nuts Company and EasyCare."],
];

function homePage() {
  const d = 0;
  const body = `
<section class="hero">
  <div class="shell shell--wide hero__grid">
    <div class="hero__copy">
      <h1 class="hero__title">Roz ka Khaana,<br>Thoda Italian,<br>Thoda <em>Desi.</em></h1>
      <p class="hero__sub">Durum wheat se bana pasta, har Indian kitchen ke liye.</p>
      <div class="hero__cta">
        <a class="btn" href="${asset("pasta.html", d)}">Explore Our Pasta ${useIcon("arr", "arr")}</a>
        <a class="btn btn--ghost" href="${asset("recipes.html", d)}">Recipes Dekho ${useIcon("arr", "arr")}</a>
      </div>
      <ul class="trust">
        ${trustPoints
          .map(
            (t) => `<li class="trust__item">
            <span class="trust__icon">${useIcon(t.icon)}</span>
            <span class="trust__label">${esc(t.title)}</span>
          </li>`
          )
          .join("")}
      </ul>
    </div>
    <div class="hero__media">
      <img src="${asset("assets/img/scenes/hero.webp", d)}" alt="Packs of The Pasta Company pasta on a kitchen counter beside fresh tomatoes and basil" width="626" height="537" fetchpriority="high" decoding="async">
      <div class="sticky"><p>Ab har pack mein zyada khushiyaan.</p></div>
    </div>
  </div>
</section>

<ul class="hero__marquee">
  <li>${useIcon("check")}100% Durum Wheat</li>
  <li>${useIcon("check")}No Maida</li>
  <li>${useIcon("check")}No Artificial Colours</li>
  <li>${useIcon("check")}Pack sizes 100 g · 200 g · 500 g</li>
</ul>

<section class="section" id="pasta">
  <div class="shell shell--wide">
    <div class="head">
      <div>
        <p class="eyebrow">Our Pasta</p>
        <h2 class="head__title">Hamare Pasta Parivaar</h2>
      </div>
      <div class="range__tabs" role="tablist" aria-label="Filter pasta by shape">
        <button class="tab" role="tab" aria-selected="true" data-tab="all">All Products</button>
        ${products
          .map(
            (p) =>
              `<button class="tab" role="tab" aria-selected="false" data-tab="${p.filter}">${esc(p.name.replace(/^(Desi|Masala|Classic) /, ""))}</button>`
          )
          .join("")}
      </div>
    </div>
    <div class="range__grid" data-range-grid>${products.map((p) => productCard(p, d, { compact: true })).join("")}</div>
    <p class="form__note" style="margin-top:1.5rem">${esc(priceNote)}</p>
  </div>
</section>

<section class="section section--tight">
  <div class="shell shell--wide">
    <div class="pillars">
      <div class="pillar"><span class="pillar__icon">${useIcon("wheat")}</span><h3>Real durum, never maida</h3><p>We mill on durum semolina only. That is what gives our pasta a firm bite instead of a soft, floury one.</p></div>
      <div class="pillar"><span class="pillar__icon">${useIcon("leaf")}</span><h3>Nothing you cannot read</h3><p>No artificial colours, no synthetic brighteners. What you see on the pack is what is in the pack.</p></div>
      <div class="pillar"><span class="pillar__icon">${useIcon("shield")}</span><h3>Consistent every batch</h3><p>Specified milling, a cooked-paste check and a pack-off lab test, so the 500 g tastes like the 100 g.</p></div>
    </div>
  </div>
</section>

<section class="section recipes-band" id="recipes">
  <div class="shell shell--wide">
    <div class="head">
      <div>
        <p class="eyebrow eyebrow--light">Recipes</p>
        <h2 class="head__title">Desi Tadka.<br>Italian Twist.</h2>
      </div>
      <div>
        <p class="lede" style="margin-bottom:1.25rem">Roz ke khaane ke liye naye pasta ideas.</p>
        <a class="btn btn--gold" href="${asset("recipes.html", d)}">Sabhi Recipes ${useIcon("arr", "arr")}</a>
      </div>
    </div>
    <div class="recipes-grid">${recipes.map((r) => recipeCard(r, d)).join("")}</div>
  </div>
</section>

<section class="section" id="trade">
  <div class="shell shell--wide trade-grid trade-grid--2">
    <div class="tradecard">
      <div class="tradecard__body tradecard--dark">
        <h2>For Retailers<br><span class="gold">Kirana ki Pasand</span></h2>
        ${tradeList(retailerBenefits)}
        <a class="btn btn--gold tradecard__cta" href="${asset("retailers.html", d)}">Retailer Inquiry ${useIcon("arr", "arr")}</a>
      </div>
      <div class="tradecard__media"><img src="${asset("assets/img/scenes/retail-aisle.webp", d)}" alt="Shelves of The Pasta Company packs in a kirana store" width="267" height="156" loading="lazy" decoding="async"></div>
    </div>
    <div class="tradecard">
      <div class="tradecard__body">
        <h2>For Distributors<br><span class="gold">Badhte Bharat ke saath Badhte Avsar</span></h2>
        ${tradeList(distributorBenefits)}
        <a class="btn tradecard__cta" href="${asset("distributors.html", d)}">Distributor Inquiry ${useIcon("arr", "arr")}</a>
      </div>
      <div class="tradecard__media"><img src="${asset("assets/img/scenes/distributor-cases.webp", d)}" alt="Printed shipping cartons of The Pasta Company stacked on a pallet" width="233" height="156" loading="lazy" decoding="async"></div>
    </div>
  </div>
</section>`;
  return layout({
    page: "index.html",
    title: brand.name,
    description:
      "100% durum wheat pasta for Indian kitchens. Desi Penne, Masala Fusilli, Classic Macaroni, Spaghetti and Pasta Mix in 100 g, 200 g and 500 g packs.",
    keywords:
      "durable wheat pasta, pasta India, desi penne, masala fusilli, macaroni, spaghetti, pasta mix, Eshanura Enterprises, pasta Lakhimpur Kheri",
    ogAlt: "The Pasta Company durum wheat pasta packs on a kitchen counter",
    ogImage: "assets/img/scenes/hero.webp",
    schema: [
      {
        "@type": "WebPage",
        "@id": `${brand.url}/#webpage`,
        url: `${brand.url}/`,
        name: `${brand.name} — Durum Wheat Pasta for Indian Kitchens`,
        isPartOf: { "@id": SITE_ID },
        about: { "@id": BRAND_ID },
        inLanguage: "en-IN",
      },
      {
        "@type": "ItemList",
        "@id": `${brand.url}/#rang`,
        name: "Our Pasta Parivaar",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.name,
          url: `${brand.url}/pasta.html#${p.slug}`,
        })),
      },
      ...products.map((p) => productGraph(p, pageUrl("pasta.html"))),
      {
        "@type": "ItemList",
        "@id": `${brand.url}/#recipes`,
        name: "Pasta Recipes",
        itemListElement: recipes.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: r.title,
          url: pageUrl(`recipe-${r.slug}.html`),
        })),
      },
    ],
    body,
  });
}

function pastaPage() {
  const d = 0;
  const body = `
${pageHead("Our Pasta", "Hamare Pasta Parivaar", "Five shapes, three pack sizes, one ingredient list: 100% durum wheat semolina. Pick the shape that matches the dish you are making.", d, [
    { label: "Home", href: "index.html" },
    { label: "Our Pasta" },
  ])}

<section class="section section--tight">
  <div class="shell shell--wide">
    <div class="range__tabs" role="tablist" aria-label="Filter pasta by shape" style="max-width:max-content">
      <button class="tab" role="tab" aria-selected="true" data-tab="all">All Products</button>
      ${products
        .map((p) => `<button class="tab" role="tab" aria-selected="false" data-tab="${p.filter}">${esc(p.name.replace(/^(Desi|Masala|Classic) /, ""))}</button>`)
        .join("")}
    </div>
    <div class="range__grid" data-range-grid>${products.map((p) => productCard(p, d, { level: 2 })).join("")}</div>
    <div class="note" style="margin-top:2rem">${useIcon("info")}<span>${esc(priceNote)}</span></div>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="head">
      <div>
        <p class="eyebrow">Cooking Guide</p>
        <h2 class="head__title">Salted water, big pot, eight minutes</h2>
      </div>
      <p class="lede">The only rule that matters: use a pot big enough that the pasta moves freely, and salt it like the sea.</p>
    </div>
    <div class="cook-scroll">
      <table class="cook-table">
        <caption class="visually-hidden">Cooking times and sizing for each pasta shape</caption>
        <thead><tr><th scope="col">Shape</th><th scope="col">Cook time</th><th scope="col">Water per 100 g</th><th scope="col">Best for</th></tr></thead>
        <tbody>
          ${products
            .map(
              (p) => `<tr><td>${esc(p.name)}</td><td>${p.cook.time} min</td><td>1 litre, 1 tbsp salt</td><td>${esc(p.tags[0])}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="pillars">
      <div class="pillar"><span class="pillar__icon">${useIcon("wheat")}</span><h3>100% Durum Wheat</h3><p>Durum semolina, milled to a fine grade. Never maida, never a blend.</p></div>
      <div class="pillar"><span class="pillar__icon">${useIcon("shield")}</span><h3>No Artificial Colours</h3><p>The golden colour comes from the wheat and the extrusion, not from an additive.</p></div>
      <div class="pillar"><span class="pillar__icon">${useIcon("truck")}</span><h3>Three pack sizes</h3><p>100 g to try, 200 g for the week, 500 g for the family. Every size, same recipe.</p></div>
    </div>
  </div>
</section>`;
  return layout({
    page: "pasta.html",
    title: "Our Pasta",
    description:
      "Shop the full range: Desi Penne, Masala Fusilli, Classic Macaroni, Spaghetti and Pasta Mix. 100% durum wheat, no maida, in 100 g, 200 g and 500 g packs.",
    keywords:
      "penne price, fusilli pasta, macaroni, spaghetti pasta, pasta mix, durum wheat pasta, buy pasta online India, pasta pack sizes",
    ogAlt: "The five pasta shapes in the range",
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "Our Pasta" },
        ],
        pageUrl("pasta.html")
      ),
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl("pasta.html")}#collection`,
        url: pageUrl("pasta.html"),
        name: "Our Pasta",
        description: "The Pasta Company range — five shapes, three pack sizes.",
        isPartOf: { "@id": SITE_ID },
        inLanguage: "en-IN",
      },
      ...products.map((p) => productGraph(p, pageUrl("pasta.html"))),
    ],
    body,
  });
}

function recipesIndexPage() {
  const d = 0;
  const body = `
${pageHead("Recipes", "Desi Tadka. Italian Twist.", "Four ways to cook the range, written for an Indian kitchen with what is already in the fridge.", d, [
    { label: "Home", href: "index.html" },
    { label: "Recipes" },
  ])}

<section class="section section--tight">
  <div class="shell shell--wide">
    <div class="recipes-grid">${recipes.map((r) => recipeCard(r, d, 2)).join("")}</div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="head">
      <div>
        <p class="eyebrow">Before You Start</p>
        <h2 class="head__title">Four things that make any pasta better</h2>
      </div>
    </div>
    <div class="trade-grid trade-grid--2">
      <div class="panel"><h3>Salt it properly</h3><p style="margin-top:.5rem">One tablespoon of salt per litre, and the water should taste distinctly of the sea. Under-salted pasta tastes flat no matter how good the sauce is.</p></div>
      <div class="panel"><h3>Keep a mug of the water</h3><p style="margin-top:.5rem">The starch left in the pot is what emulsifies sauce into something that coats instead of pools. Never drain all of it away.</p></div>
      <div class="panel"><h3>Finish in the pan</h3><p style="margin-top:.5rem">Toss pasta and sauce together over heat for the last two minutes. Plated separately, the pasta cools and the sauce slides off.</p></div>
      <div class="panel"><h3>Undercook by one minute</h3><p style="margin-top:.5rem">Pasta carries on cooking in the sauce. Pull it a minute early and it will land exactly right on the plate.</p></div>
    </div>
  </div>
</section>`;
  return layout({
    page: "recipes.html",
    title: "Recipes",
    description:
      "Pasta recipes for the Indian kitchen: Masala Pasta Tadka, Penne Arrabbiata Desi Style, Macaroni with Desi Veggies and Pasta Salad Chaat Style.",
    keywords:
      "pasta recipes, masala pasta tadka, penne arrabbiata, macaroni desi veggies, pasta salad chaat, easy pasta recipes India",
    ogAlt: "Pasta recipes from The Pasta Company",
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "Recipes" },
        ],
        pageUrl("recipes.html")
      ),
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl("recipes.html")}#collection`,
        url: pageUrl("recipes.html"),
        name: "Recipes",
        isPartOf: { "@id": SITE_ID },
        inLanguage: "en-IN",
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl("recipes.html")}#list`,
        name: "Pasta Recipes",
        numberOfItems: recipes.length,
        itemListElement: recipes.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: r.title,
          url: pageUrl(`recipe-${r.slug}.html`),
        })),
      },
    ],
    body,
  });
}

/** Compact buy panel shown beside a recipe. */
function productMini(p, depth) {
  const slug = p.slug.replace(/^(desi|classic|masala|pasta)-/, "");
  const buttons = sizes
    .map(
      (s) => `<button class="size" type="button" aria-pressed="false" data-size="${s}" data-price="${p.price[s]}" data-img="${asset(packImg(slug, s), depth)}">
        <img src="${asset(packImg(slug, s), depth)}" alt="${esc(p.name)} ${s} g pack" width="120" height="150" loading="lazy" decoding="async">
        <span class="size__label">${s} g</span>
        <span class="size__price">${rupee(p.price[s])}</span>
      </button>`
    )
    .join("");

  return `<div class="panel panel--buy">
    <p class="eyebrow">Cook it with</p>
    <div class="panel--buy__row">
      <img class="panel--buy__art" src="${asset(p.shape, depth)}" alt="${esc(p.name)} — loose pasta" width="210" height="96" loading="lazy" decoding="async">
      <div>
        <h2 class="panel--buy__name">${esc(p.name)}</h2>
        <p class="panel--buy__note">${esc(sizeNote[sizes[0]])} &middot; ${esc(p.blurb)}</p>
      </div>
    </div>
    <div class="sizes" role="group" aria-label="Choose a pack size for ${esc(p.name)}">${buttons}</div>
    <button class="btn btn--block" type="button" data-add-to-cart data-slug="${slug}" data-product="${esc(p.name)}">Add to Cart</button>
    <a class="btn btn--ghost btn--block" style="margin-top:.55rem" href="${asset(`pasta.html#${p.slug}`, depth)}">All pasta ${useIcon("arr", "arr")}</a>
  </div>`;
}

function recipePage(r) {
  const d = 0;
  const product = products.find((p) => p.slug === r.product);
  const others = recipes.filter((x) => x.slug !== r.slug).slice(0, 3);
  const body = `
${pageHead(r.kicker, esc(r.title), "", d, [
    { label: "Home", href: "index.html" },
    { label: "Recipes", href: "recipes.html" },
    { label: r.title },
  ])}

<section class="section section--tight">
  <div class="shell">
    <div class="recipe-hero">
      <div>
        <p class="lede">${esc(r.intro)}</p>
        <ul class="chips">
          <li class="chip">${useIcon("clock")}${r.time} minutes</li>
          <li class="chip">${useIcon("users")}Serves ${esc(r.serves)}</li>
          <li class="chip">${useIcon("level")}${esc(r.level)}</li>
        </ul>
        ${product ? productMini(product, d) : ""}
      </div>
      <div class="recipe-hero__media">
        <img src="${asset(r.img, d)}" alt="${esc(r.title)} served in a bowl" width="320" height="240" fetchpriority="high" decoding="async">
      </div>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="recipe-cols">
      <div class="panel">
        <h2 style="font-size:var(--step-2);margin-bottom:1rem">Ingredients</h2>
        <ul class="ingredients">
          ${r.ingredients.map(([q, n]) => `<li><b>${esc(q)}</b><span>${esc(n)}</span></li>`).join("")}
        </ul>
      </div>
      <div>
        <h2 style="font-size:var(--step-2);margin-bottom:1.25rem">Method</h2>
        <ol class="method">${r.method.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol>
        <div class="panel" style="margin-top:2rem">
          <h3 style="font-size:var(--step-1)">Chef's notes</h3>
          <ul class="tips" style="margin-top:.85rem">${r.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--tight recipes-band">
  <div class="shell shell--wide">
    <div class="head">
      <div>
        <p class="eyebrow eyebrow--light">More ideas</p>
        <h2 class="head__title">Cook something else</h2>
      </div>
    </div>
    <div class="recipes-grid">${others.map((o) => recipeCard(o, d)).join("")}</div>
  </div>
</section>`;
  return layout({
    page: `recipe-${r.slug}.html`,
    title: r.title,
    description: r.seo,
    keywords: `${r.title} recipe, ${r.title} ingredients, desi pasta recipe, pasta tadka, ${product?.name ?? "pasta"} recipe`,
    ogType: "article",
    ogAlt: `${r.title}, served in a bowl`,
    ogImage: r.img,
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "Recipes", href: "recipes.html" },
          { label: r.title },
        ],
        pageUrl(`recipe-${r.slug}.html`)
      ),
      recipeGraph(r, pageUrl(`recipe-${r.slug}.html`)),
      ...(product ? [productGraph(product, pageUrl("pasta.html"))] : []),
    ],
    body,
  });
}

function retailersPage() {
  const d = 0;
  const body = `
${pageHead("For Retailers", "Kirana ki Pasand", "A dry-goods staple with repeat demand, an eye-catching shelf block and a margin that works on a 100 g impulse buy as well as a 500 g family pack.", d, [
    { label: "Home", href: "index.html" },
    { label: "For Retailers" },
  ])}

<section class="section section--tight">
  <div class="shell">
    <div class="head">
      <div>
        <p class="eyebrow">Why it sells</p>
        <h2 class="head__title">Four reasons it moves off the shelf</h2>
      </div>
    </div>
    <div class="trade-grid trade-grid--2">
      <div class="panel"><h3>Fast moving category</h3><p style="margin-top:.5rem">Pasta is bought on a weekly shop, not on a festival. That repeat rhythm is what makes the facing count.</p></div>
      <div class="panel"><h3>Attractive margin</h3><p style="margin-top:.5rem">The 100 g pack is an impulse price point that lands well at the till, where a basket is already open.</p></div>
      <div class="panel"><h3>Eye-catching packs</h3><p style="margin-top:.5rem">Clear-front pouches with a warm gold label read well from two metres, which is how most aisles are actually scanned.</p></div>
      <div class="panel"><h3>Regular supply</h3><p style="margin-top:.5rem">Standardised case packs and a predictable replenishment cycle, so you are not chasing stock.</p></div>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="split">
      <div class="split__media"><img src="${asset("assets/img/scenes/retail-aisle.webp", d)}" alt="The Pasta Company packs on a retail shelf" width="267" height="156" loading="lazy" decoding="async"></div>
      <div>
        <p class="eyebrow">Point of sale</p>
        <h2 class="head__title">We back the shelf, not just the carton</h2>
        <p class="lede" style="margin-top:1.25rem">POS support is available on qualifying orders: shelf talkers, counter display units and counter staff material, supplied with the first case.</p>
        <ul class="trade-list" style="margin-top:1.5rem">
          ${[
            "Shelf talkers and wobblers",
            "Counter display units",
            "Planogram-ready case packs",
            "Counter staff training material",
          ]
            .map((t) => `<li><span class="trade-list__tick">${useIcon("check")}</span><span class="trade-list__text">${esc(t)}</span></li>`)
            .join("")}
        </ul>
      </div>
    </div>
  </div>
</section>

${inquiryForm({
    depth: d,
    id: "retailer-inquiry",
    eyebrow: "Become a stockist",
    title: "Retailer inquiry",
    lede: "Tell us where you stock and we will send the rate card, case pack sizes and the POS kit.",
    submit: "Send retailer inquiry",
    interests: ["100 g", "200 g", "500 g"],
    success: "Thank you — your retailer inquiry has been noted. Our trade team will call you within two working days.",
  })}`;
  return layout({
    page: "retailers.html",
    title: "For Retailers",
    description:
      "Stock The Pasta Company in your kirana or supermarket. Fast moving category, attractive margin, eye-catching packs, regular supply and POS support.",
    keywords:
      "pasta distributor India, pasta wholesale, kirana store stock, pasta retailer margin, durum wheat pasta wholesale, The Pasta Company stockist",
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "For Retailers" },
        ],
        pageUrl("retailers.html")
      ),
    ],
    body,
  });
}

function distributorsPage() {
  const d = 0;
  const body = `
${pageHead("For Distributors", "Badhte Bharat ke saath Badhte Avsar", "A dry-goods range with three pack sizes, high repeat purchase and the supply consistency a distribution network depends on.", d, [
    { label: "Home", href: "index.html" },
    { label: "For Distributors" },
  ])}

<section class="section section--tight">
  <div class="shell">
    <div class="head">
      <div>
        <p class="eyebrow">Why it travels</p>
        <h2 class="head__title">Built to move across the country</h2>
      </div>
    </div>
    <div class="trade-grid trade-grid--2">
      <div class="panel"><h3>Wide product range</h3><p style="margin-top:.5rem">Five shapes across 100 g, 200 g and 500 g. One supplier covers the trial size, the weekly buy and the family pack.</p></div>
      <div class="panel"><h3>High repeat purchase</h3><p style="margin-top:.5rem">Durum wheat pasta is a pantry staple with a short consideration cycle, which keeps secondary sales moving.</p></div>
      <div class="panel"><h3>PAN India potential</h3><p style="margin-top:.5rem">Ambient, non-refrigerated, long shelf life. The range travels without cold chain or special handling.</p></div>
      <div class="panel"><h3>Marketing support</h3><p style="margin-top:.5rem">Trade material, POS assets and recipe content you can run in-store or on your own channels.</p></div>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="split">
      <div class="split__media"><img src="${asset("assets/img/scenes/distributor-cases.webp", d)}" alt="Printed shipping cartons stacked on a pallet" width="233" height="156" loading="lazy" decoding="async"></div>
      <div>
        <p class="eyebrow">Supply</p>
        <h2 class="head__title">Consistent quality &amp; supply</h2>
        <p class="lede" style="margin-top:1.25rem">Every batch is cooked and tasted against a reference before release, and every case carries the same lot code back to the mill run. That is what lets you commit to a forecast.</p>
        <div class="stat-row">
          <div class="stat"><p class="stat__n">3</p><p class="stat__l">Pack sizes per shape</p></div>
          <div class="stat"><p class="stat__n">5</p><p class="stat__l">Shapes in the range</p></div>
          <div class="stat"><p class="stat__n">100%</p><p class="stat__l">Durum wheat</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

${inquiryForm({
    depth: d,
    id: "distributor-inquiry",
    eyebrow: "Distribution enquiry",
    title: "Distributor inquiry",
    lede: "Share your territory and current dry-goods portfolio. We will come back with margins, MOQs and a supply plan.",
    submit: "Send distributor inquiry",
    interests: ["North", "South", "East", "West", "Central"],
    success: "Thank you — your distributor inquiry has been noted. Our trade team will call you within two working days.",
  })}`;
  return layout({
    page: "distributors.html",
    title: "For Distributors",
    description:
      "Distribute The Pasta Company. Wide range in 100 g, 200 g and 500 g, high repeat purchase, PAN India potential, marketing support and consistent supply.",
    keywords:
      "pasta distribution India, pasta distributor, PAN India pasta, durum wheat pasta bulk, pasta supplier Uttar Pradesh",
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "For Distributors" },
        ],
        pageUrl("distributors.html")
      ),
    ],
    body,
  });
}

function inquiryForm({ depth, id, eyebrow, title, lede, submit, interests, success }) {
  return `<section class="section" id="${id}">
  <div class="shell">
    <div class="panel">
      <div style="max-width:52ch;margin-bottom:1.75rem">
        <p class="eyebrow">${esc(eyebrow)}</p>
        <h2 class="head__title">${esc(title)}</h2>
        <p class="lede" style="margin-top:1.1rem">${esc(lede)}</p>
      </div>
      <form class="form" data-enquiry="${esc(id)}" novalidate>
        <div class="form__row">
          <div class="field">
            <label for="${id}-name">Your name <span aria-hidden="true">*</span></label>
            <input id="${id}-name" name="name" type="text" autocomplete="name" required>
          </div>
          <div class="field">
            <label for="${id}-business">Business name <span aria-hidden="true">*</span></label>
            <input id="${id}-business" name="business" type="text" autocomplete="organization" required>
          </div>
        </div>
        <div class="form__row">
          <div class="field">
            <label for="${id}-phone">Phone <span aria-hidden="true">*</span></label>
            <input id="${id}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required>
          </div>
          <div class="field">
            <label for="${id}-email">Email <span aria-hidden="true">*</span></label>
            <input id="${id}-email" name="email" type="email" autocomplete="email" required>
          </div>
        </div>
        <div class="form__row">
          <div class="field">
            <label for="${id}-city">City / Territory</label>
            <input id="${id}-city" name="city" type="text" autocomplete="address-level2">
          </div>
          <div class="field">
            <label for="${id}-interest">Interested in</label>
            <select id="${id}-interest" name="interest">
              ${interests.map((i) => `<option>${esc(i)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field">
          <label for="${id}-message">Message</label>
          <textarea id="${id}-message" name="message" placeholder="Outlets, current monthly volumes, or anything we should know."></textarea>
        </div>
        <label class="checkbox">
          <input type="checkbox" name="consent" required>
          <span>I agree to be contacted about this enquiry. ${esc(brand.name)} does not add trade contacts to marketing lists.</span>
        </label>
        <div>
          <button class="btn" type="submit">${esc(submit)} ${useIcon("arr", "arr")}</button>
        </div>
        <p class="form-status" data-form-status role="status" hidden>${esc(success)}</p>
        <p class="form__note">This form is a demonstration build. Submissions are not transmitted — email ${esc(brand.email)} or call ${esc(brand.phone)} to reach the trade team.</p>
      </form>
    </div>
  </div>
</section>`;
}

function aboutPage() {
  const d = 0;
  const body = `
${pageHead("About", "Thoda Italian, Thoda Desi", "We are a pasta brand built inside Eshanura Enterprises, aimed squarely at the Indian kitchen.", d, [
    { label: "Home", href: "index.html" },
    { label: "About" },
  ])}

<section class="section section--tight">
  <div class="shell">
    <div class="split">
      <div>
        <p class="eyebrow">Our story</p>
        <h2 class="head__title">Made for the kitchen we actually eat in</h2>
        <div class="prose" style="margin-top:1.5rem">
          <p>Indian cooking had already absorbed pasta long before it became a supermarket staple — in street carts, in school tiffins, in every home that fried onions and tomatoes for a quick dinner. What was missing was a pasta made with the same care, from the same grain quality, as the food sold for export.</p>
          <p>The Pasta Company exists to close that gap. We mill on durum wheat semolina, run the extruder to a specification rather than to whatever the machine allows that morning, and taste-test a cooked sample from every batch before it goes anywhere near a pack.</p>
          <p>The result is pasta that holds its bite through a heavy tadka, survives a school lunchbox until noon, and still works when all you have is butter, garlic and a tomato.</p>
        </div>
        <div class="stat-row">
          <div class="stat"><p class="stat__n">5</p><p class="stat__l">Shapes in the range</p></div>
          <div class="stat"><p class="stat__n">3</p><p class="stat__l">Pack sizes each</p></div>
          <div class="stat"><p class="stat__n">100%</p><p class="stat__l">Durum wheat</p></div>
        </div>
      </div>
      <div class="split__media"><img src="${asset("assets/img/scenes/pantry.webp", d)}" alt="The Pasta Company packs on a kitchen counter" width="500" height="387" loading="lazy" decoding="async"></div>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="pillars">
      <div class="pillar"><span class="pillar__icon">${useIcon("wheat")}</span><h3>Durum, durum, durum</h3><p>One ingredient line: durum wheat semolina. The firmness, the colour and the cooking tolerance all come from the grain.</p></div>
      <div class="pillar"><span class="pillar__icon">${useIcon("shield")}</span><h3>Nothing hidden</h3><p>No artificial colours, no maida blend, no "natural colour" on a label we cannot explain.</p></div>
      <div class="pillar"><span class="pillar__icon">${useIcon("users")}</span><h3>Part of Eshanura</h3><p>Produced by Eshanura Enterprises Private Limited — the group behind The Nuts Company and a long line of pantry brands.</p></div>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="panel">
      <div class="parent">
        <span class="parent__label">A brand by</span>
        <img src="${asset("assets/img/brand/eshanura-wordmark.png", d)}" alt="Eshanura" width="520" height="108" loading="lazy">
        <small>Eshanura Enterprises Private Limited</small>
      </div>
      <p class="lede" style="margin-top:1.5rem">For trade enquiries, distribution or anything else, the Customer Care team answers on ${esc(brand.phone)} and at ${esc(brand.email)}.</p>
      <a class="btn" style="margin-top:1.25rem" href="${asset("contact.html", d)}">Contact us ${useIcon("arr", "arr")}</a>
    </div>
  </div>
</section>`;
  return layout({
    page: "about.html",
    title: "About",
    description:
      "The Pasta Company is a 100% durum wheat pasta brand by Eshanura Enterprises Private Limited, Lakhimpur Kheri, Uttar Pradesh — made for Indian kitchens.",
    keywords:
      "The Pasta Company about, Eshanura Enterprises pasta, pasta manufacturer Uttar Pradesh, durum wheat pasta brand India",
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "About" },
        ],
        pageUrl("about.html")
      ),
    ],
    body,
  });
}

function contactPage() {
  const d = 0;
  const body = `
${pageHead("Contact", "Customer Care", "Questions about a pack, an order, or stocking us in your store — one team handles all of it.", d, [
    { label: "Home", href: "index.html" },
    { label: "Contact" },
  ])}

<section class="section section--tight">
  <div class="shell">
    <div class="trade-grid trade-grid--2">
      <div class="panel">
        <h2 style="font-size:var(--step-2);margin-bottom:1.25rem">Reach us</h2>
        <ul class="contact-list">
          <li>${useIcon("phone")}<span><a href="tel:${brand.phoneHref}">${esc(brand.phone)}</a><br><small style="color:var(--ink-3)">Mon–Sat, 9 am to 6 pm IST</small></span></li>
          <li>${useIcon("mail")}<span><a href="mailto:${brand.email}">${esc(brand.email)}</a></span></li>
          <li>${useIcon("globe")}<span><a href="https://${brand.domain}" rel="noopener noreferrer" target="_blank">${esc(brand.domain)}</a></span></li>
        </ul>
        <div class="parent" style="margin-top:2rem">
          <span class="parent__label">A brand by</span>
          <img src="${asset("assets/img/brand/eshanura-wordmark.png", d)}" alt="Eshanura" width="520" height="108" loading="lazy">
          <small>Eshanura Enterprises Private Limited</small>
        </div>
      </div>
      <div class="panel">
        <h2 style="font-size:var(--step-2);margin-bottom:1.25rem">Send a message</h2>
        <form class="form" data-enquiry="contact" novalidate>
          <div class="field">
            <label for="c-name">Your name <span aria-hidden="true">*</span></label>
            <input id="c-name" name="name" type="text" autocomplete="name" required>
          </div>
          <div class="field">
            <label for="c-email">Email <span aria-hidden="true">*</span></label>
            <input id="c-email" name="email" type="email" autocomplete="email" required>
          </div>
          <div class="field">
            <label for="c-topic">What is this about?</label>
            <select id="c-topic" name="topic">
              <option>An order</option><option>A product question</option>
              <option>Become a retailer</option><option>Become a distributor</option><option>Something else</option>
            </select>
          </div>
          <div class="field">
            <label for="c-message">Message <span aria-hidden="true">*</span></label>
            <textarea id="c-message" name="message" required></textarea>
          </div>
          <label class="checkbox">
            <input type="checkbox" name="consent" required>
            <span>I agree to be contacted about this message.</span>
          </label>
          <div><button class="btn" type="submit">Send message ${useIcon("arr", "arr")}</button></div>
          <p class="form-status" data-form-status role="status" hidden>Thank you — your message has been noted. Our Customer Care team will reply within one working day.</p>
          <p class="form__note">This form is a demonstration build. Submissions are not transmitted — please email ${esc(brand.email)} or call ${esc(brand.phone)}.</p>
        </form>
      </div>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="head"><div><p class="eyebrow">FAQ</p><h2 class="head__title">Common questions</h2></div></div>
    <div class="faq">
      ${faqs
        .map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`)
        .join("")}
    </div>
  </div>
</section>`;
  return layout({
    page: "contact.html",
    title: "Contact",
    description: `Contact The Pasta Company Customer Care on ${brand.phone} or ${brand.email}. Retailer, distributor and consumer enquiries, plus common questions.`,
    keywords:
      "contact The Pasta Company, pasta customer care, Eshanura Enterprises contact, pasta retailer inquiry, pasta distributor inquiry",
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "Contact" },
        ],
        pageUrl("contact.html")
      ),
      faqGraph(faqs, pageUrl("contact.html")),
    ],
    body,
  });
}

function legalPage() {
  const d = 0;
  const body = `
${pageHead("Legal", "Privacy &amp; Terms", "", d, [
    { label: "Home", href: "index.html" },
    { label: "Legal" },
  ])}

<section class="section section--tight">
  <div class="shell">
    <div class="prose">
      <h2 id="privacy">Privacy Policy</h2>
      <p>Last updated ${new Date().getFullYear()}. ${esc(brand.name)} is a brand of ${esc(brand.legal)} ("we", "us"). This policy explains what we collect when you use this website.</p>
      <h3>What we collect</h3>
      <p>If you submit an enquiry form we collect the name, business name, email address, phone number and message you provide, along with the page you submitted from. We do not run advertising trackers or third-party analytics on this site.</p>
      <h3>How we use it</h3>
      <p>We use enquiry details only to respond to your enquiry and to keep a record of the conversation. Trade contacts supplied through the retailer or distributor forms are not added to any marketing list.</p>
      <h3>The cart</h3>
      <p>Items you add to the cart are stored in your browser's local storage only. Nothing is sent to us, and clearing your browser storage removes it. No payment details are collected on this site.</p>
      <h3>Your rights</h3>
      <p>Write to <a href="mailto:${brand.email}">${esc(brand.email)}</a> to ask what we hold about you, to correct it, or to have it deleted.</p>

      <h2 id="terms" style="margin-top:3rem">Terms &amp; Conditions</h2>
      <h3>Orders and pricing</h3>
      <p>This site is a demonstration build. Online checkout is not connected to a payment processor and no order placed here is binding. All prices shown are MRP inclusive of applicable taxes and are placeholders pending the final published rate card. Orders placed by phone or email are confirmed only once we send a written confirmation.</p>
      <h3>Product information</h3>
      <p>Pack photographs, weights and cooking guidance are provided for general information. Cooking times vary with your stove, your water volume and how hot you let the pot get — treat them as a starting point rather than a guarantee.</p>
      <h3>Intellectual property</h3>
      <p>The ${esc(brand.name)} name, logo, pack designs and all site content are the property of ${esc(brand.legal)} and may not be reproduced for commercial use without written permission.</p>
      <h3>Governing law</h3>
      <p>These terms are governed by the laws of India, and the courts at ${esc(brand.legal)}'s registered place of business have jurisdiction.</p>
      <h3>Contact</h3>
      <p>${esc(brand.name)} · ${esc(brand.legal)} · <a href="tel:${brand.phoneHref}">${esc(brand.phone)}</a> · <a href="mailto:${brand.email}">${esc(brand.email)}</a></p>
    </div>
  </div>
</section>`;
  return layout({
    page: "legal.html",
    title: "Privacy & Terms",
    description: `Privacy policy and terms & conditions for ${brand.name}, a brand of ${brand.legal}.`,
    schema: [
      breadcrumbGraph(
        [
          { label: "Home", href: "index.html" },
          { label: "Legal" },
        ],
        pageUrl("legal.html")
      ),
    ],
    body,
  });
}

function notFoundPage() {
  const d = 0;
  const body = `
<section class="section">
  <div class="shell" style="text-align:center;max-width:60ch">
    <p class="eyebrow">404</p>
    <h1>This page has boiled over</h1>
    <p class="lede" style="margin:1rem auto 2rem">The page you were looking for is not here. Try the pasta range, or head back to the kitchen.</p>
    <div class="hero__cta" style="justify-content:center">
      <a class="btn" href="${asset("pasta.html", d)}">Explore Our Pasta ${useIcon("arr", "arr")}</a>
      <a class="btn btn--ghost" href="${asset("index.html", d)}">Back to home</a>
    </div>
  </div>
</section>`;
  return layout({
    page: "404.html",
    title: "Page not found",
    description: "That page could not be found.",
    noindex: true,
    body,
  });
}

/* --- build -------------------------------------------------------------- */

function favicons() {
  // Reuse the Eshanura mark tinted to the brand green as the site icon.
  const dirs = { "assets/img/brand": join(ROOT, "assets", "img", "brand") };
  mkdirSync(dirs["assets/img/brand"], { recursive: true });
  return dirs;
}

function write(path, html) {
  writeFileSync(join(ROOT, path), html, "utf8");
  console.log(`  ${path.padEnd(28)} ${(html.length / 1024).toFixed(1)} KB`);
}

function main() {
  favicons();

  write("index.html", homePage());
  write("pasta.html", pastaPage());
  write("recipes.html", recipesIndexPage());
  for (const r of recipes) write(`recipe-${r.slug}.html`, recipePage(r));
  write("retailers.html", retailersPage());
  write("distributors.html", distributorsPage());
  write("about.html", aboutPage());
  write("contact.html", contactPage());
  write("legal.html", legalPage());
  write("404.html", notFoundPage());

  const pages = readdirSync(ROOT).filter((f) => f.endsWith(".html"));
  const today = new Date().toISOString().slice(0, 10);

  // Curated priorities: the range and the recipes are the pages worth crawling
  // first. Pages missing from this map fall back to a middling priority.
  const PRIORITY = {
    "index.html": { p: "1.0", f: "weekly" },
    "pasta.html": { p: "0.9", f: "monthly" },
    "recipes.html": { p: "0.8", f: "monthly" },
    "retailers.html": { p: "0.7", f: "monthly" },
    "distributors.html": { p: "0.7", f: "monthly" },
    "about.html": { p: "0.6", f: "yearly" },
    "contact.html": { p: "0.6", f: "yearly" },
    "legal.html": { p: "0.3", f: "yearly" },
  };

  const entries = [];
  for (const p of pages) {
    if (p === "404.html") continue; // an error page must never be indexed
    const meta = PRIORITY[p] ?? { p: "0.5", f: "monthly" };
    entries.push(
      `  <url>\n` +
        `    <loc>${brand.url}/${p === "index.html" ? "" : p}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${meta.f}</changefreq>\n` +
        `    <priority>${meta.p}</priority>\n` +
        `  </url>`
    );
  }

  write(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      entries.join("\n") +
      `\n</urlset>\n`
  );

  write(
    "robots.txt",
    `User-agent: *\n` +
      `Allow: /\n` +
      `Disallow: /build/\n` +
      `\n` +
      `# Build tooling carries no indexable content.\n` +
      `User-agent: GPTBot\n` +
      `Allow: /\n` +
      `\n` +
      `Sitemap: ${brand.url}/sitemap.xml\n`
  );

  write(
    "site.webmanifest",
    JSON.stringify(
      {
        name: brand.name,
        short_name: "The Pasta Co",
        description: "Durum wheat pasta for Indian kitchens.",
        start_url: "/",
        display: "standalone",
        background_color: "#fdf9f1",
        theme_color: "#123f30",
        icons: [
          { src: "assets/img/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
          { src: "assets/img/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      null,
      2
    ) + "\n"
  );

  console.log(`\n${pages.length} pages + sitemap + robots written.`);
}

main();
