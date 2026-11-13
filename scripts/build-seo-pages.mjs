// Builds the indexable service pages, css/site.css and sitemap.xml.
// Run from the repository root:  node scripts/build-seo-pages.mjs
//
// Why: the home page is a single-page app with hash routes (#services, #city-...).
// Google ignores everything after "#", so those views are not separate URLs and
// cannot rank on their own. Each page built here is a real URL with its own
// title, description, canonical, H1, content and structured data.
//
// Content rule: only facts already published on the site (services, real project
// photos and their cities, phone, email, service area). No address, licence,
// reviews, ratings or years in business are stated, because none is verified.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://www.zeferinosusa.com';
const PHONE = '(239) 324-1224';
const TEL = '+12393241224';
const EMAIL = 'zeferinosprecisionfinish@gmail.com';
const IG = 'https://www.instagram.com/zeferinosprecisionfinish/';
const BIZ_ID = SITE + '/#business';
const AREA = ['Fort Myers', 'Naples', 'Cape Coral', 'Bonita Springs', 'Estero', 'Sanibel Island'];

/* ---------- shared stylesheet: the home page's own styles + a few page rules ---------- */
const home = readFileSync('index.html', 'utf8');
const baseCss = home.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/url\(fonts\//g, 'url(/fonts/');
const pageCss = `
/* ---- service pages ---- */
.svc-page .page-head h1{max-width:18ch}
.prose{max-width:68ch}
.prose p{margin:0 0 22px;font-size:17.5px;color:var(--ink)}
.prose h2{margin:0 0 26px}
.prose ul{margin:0 0 26px;padding-left:20px}.prose li{margin:0 0 8px}
.two{display:grid;grid-template-columns:1.25fr 1fr;gap:80px;align-items:start}
@media(max-width:900px){.two{grid-template-columns:1fr;gap:48px}}
.aside-box{background:var(--linen);border:1px solid var(--hair);padding:36px 34px}
.aside-box h2{font-size:28px;margin:0 0 18px}
.aside-box ul{list-style:none;margin:0 0 26px;padding:0}
.aside-box li{padding:10px 0;border-bottom:1px solid var(--hair);font-size:15.5px}
.aside-box .btn{width:100%;justify-content:center;margin-top:10px}
.photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px}
.photo-grid figure{margin:0}
.photo-grid .ph{position:relative;aspect-ratio:4/3;overflow:hidden;background:#ddd}
.photo-grid img{width:100%;height:100%;object-fit:cover}
.photo-grid figcaption{font-size:14px;color:var(--stone);margin-top:10px;line-height:1.5}
.photo-grid figcaption b{font-weight:500;color:var(--ink)}
.faq{max-width:820px}
.faq details{border-bottom:1px solid var(--hair);padding:22px 0}
.faq summary{cursor:pointer;font-family:var(--serif);font-size:22px;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq details p{margin-top:12px;color:var(--stone)}
.svc-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;list-style:none;margin:0;padding:0}
.svc-links a{display:block;padding:20px 22px;border:1px solid var(--hair-dark);text-decoration:none;font-family:var(--serif);font-size:20px;background:var(--paper);color:var(--ink)}
.svc-links a:hover{border-color:var(--brass)}
.svc-links a[aria-current]{background:var(--linen)}
.area-list{display:flex;flex-wrap:wrap;gap:10px 22px;list-style:none;margin:18px 0 0;padding:0;color:var(--stone)}
`;
mkdirSync('css', { recursive: true });
writeFileSync('css/site.css', baseCss.trim() + '\n' + pageCss);

/* ---------- real project photos (captions as published on the site) ---------- */
const P = (file, caption, city) => ({ src: '/images/' + file, caption, city });
const ph = {
  fmTrayAfter: P('fort-myers-crown-02-after-tray-ceiling-crown.jpg', 'Tray ceiling with crown molding', 'Fort Myers, FL'),
  fmTrayBefore: P('fort-myers-crown-01-before-tray-ceiling.jpg', 'Before: tray ceiling without trim', 'Fort Myers, FL'),
  fmBay: P('fort-myers-crown-03-tray-ceiling-bay-windows.jpg', 'Tray ceiling with crown over a bay window', 'Fort Myers, FL'),
  fmFoyer: P('fort-myers-crown-04-foyer-triple-frame-ceiling.jpg', 'Foyer ceiling with three layered trim frames', 'Fort Myers, FL'),
  fmHall: P('fort-myers-crown-06-hallway-frame-ceiling.jpg', 'Hallway ceiling with double trim frame', 'Fort Myers, FL'),
  fmGreat: P('fort-myers-crown-10-great-room-crown.jpg', 'Crown molding through the great room', 'Fort Myers, FL'),
  fmCorner: P('fort-myers-crown-13-crown-corner-detail.jpg', 'Crown molding returns on a wall column', 'Fort Myers, FL'),
  fmColumn: P('fort-myers-crown-14-crown-kitchen-column.jpg', 'Crown molding around a kitchen column', 'Fort Myers, FL'),
  fmBedroom: P('fort-myers-crown-09-bedroom-tray-crown.jpg', 'Bedroom tray ceiling with crown', 'Fort Myers, FL'),
  ccCorner: P('cape-coral-07-bedroom-corner.jpg', 'Flooring and trim in a bedroom corner', 'Cape Coral, FL'),
  ccHall: P('cape-coral-05-hallway.jpg', 'Hallway with vinyl plank flooring', 'Cape Coral, FL'),
  ccStairs: P('cape-coral-02-stairs-finished.jpg', 'Finished stairs with dark wood treads and white risers', 'Cape Coral, FL'),
  tpArch: P('tampa-flex-molding-01-arch-column.jpg', 'Flex molding casing on an arched opening', 'Tampa, FL'),
  tpKitchen: P('tampa-flex-molding-02-arch-kitchen.jpg', 'Arched opening to the kitchen', 'Tampa, FL'),
  shCasing: P('southaven-hospital-11-door-casing.jpg', 'Door casing with shiplap surround', 'Southaven, MS'),
  shMolding: P('southaven-hospital-06-wall-molding.jpg', 'Picture-frame wall molding', 'Southaven, MS'),
  shSlat: P('southaven-hospital-05-slat-accent-wall.jpg', 'Wood slat accent wall', 'Southaven, MS'),
  shBeams: P('southaven-hospital-02-ceiling-beams-lobby.jpg', 'Decorative ceiling beams at the entrance', 'Southaven, MS'),
  sbRail: P('sanibel-deck-railing-03-after-railing.jpg', 'New deck railing section built and fitted', 'Sanibel Island, FL'),
  sbHandrail: P('sanibel-exterior-handrail/4EA3DBFF-8CCE-4055-ACD4-BB834CF81EDC_1_105_c.jpeg', 'Exterior wood handrail on stairs and porch', 'Sanibel Island, FL'),
};

const FM_PROJECT = 'Our Fort Myers work includes crown molding, tray ceiling trim and layered frame ceilings installed in new construction homes at Esplanade Lake Club, from foyers and hallways to great rooms and bedrooms.';

/* ---------- the pages ---------- */
const pages = [
  {
    slug: 'finish-carpentry-fort-myers',
    nav: 'Finish Carpentry in Fort Myers',
    service: 'Finish carpentry',
    title: "Finish Carpentry in Fort Myers, FL | Zeferino's Precision Finish",
    description: `Finish carpentry in Fort Myers, FL: crown molding, tray ceiling trim, baseboards, casing and stairs for homeowners and builders. Free estimates: ${PHONE}.`,
    h1: 'Finish carpentry in Fort Myers, FL',
    lead: 'Crown molding, tray ceiling trim, baseboards, casings, doors and stairs, installed for homeowners, builders and contractors in Fort Myers and across Lee County.',
    area: ['Fort Myers'],
    intro: [
      "Zeferino's Precision Finish installs the interior finish work that makes a house look complete: crown molding, ceiling trim, baseboards, door and window casing, interior doors, stairs and handrails. We work on new construction and on remodels in Fort Myers.",
      FM_PROJECT,
      'For builders and general contractors we provide labor-only finish carpentry: you supply the materials and the schedule, we install. Homeowners get the same crew and the same attention to joints, alignment and clean transitions.'
    ],
    includes: ['Crown molding and tray ceiling trim', 'Layered frame and coffered-style ceiling trim', 'Baseboards and shoe molding', 'Door and window casing', 'Interior doors and door trim', 'Stair treads, risers and handrails'],
    photos: [ph.fmTrayAfter, ph.fmFoyer, ph.fmGreat, ph.fmBay, ph.fmHall, ph.fmColumn],
    photosTitle: 'Finish carpentry in Fort Myers',
    faq: [
      ['Do you work in Fort Myers?', 'Yes. Fort Myers is one of our main service areas, along with Naples, Cape Coral, Bonita Springs, Estero and Sanibel Island.'],
      ['Do you work with builders and contractors?', 'Yes. We provide labor-only finish carpentry for builders, general contractors and millwork suppliers on new construction and remodels.'],
      ['How do I get an estimate?', `Call or text ${PHONE}, or send the form with the scope, the city and a few photos. Estimates are free.`]
    ]
  },
  {
    slug: 'trim-carpentry-naples',
    nav: 'Trim Carpentry in Naples',
    service: 'Trim carpentry',
    title: "Trim Carpentry in Naples, FL | Zeferino's Precision Finish",
    description: `Trim carpentry in Naples, FL: crown molding, baseboards, door and window casing, wall molding and arched trim. Free estimates: ${PHONE}.`,
    h1: 'Trim carpentry in Naples, FL',
    lead: 'Crown molding, baseboards, casings, wall molding and arched trim for homeowners, builders and contractors in Naples and Collier County.',
    area: ['Naples'],
    intro: [
      "Naples is part of our regular service area. Zeferino's Precision Finish installs interior trim for homes being built or remodeled: crown molding, baseboards, door and window casing, wall molding and flex molding on arched openings.",
      'Trim is where small errors show. We focus on tight miters and copes, consistent reveals on casings, and baseboards that run clean along walls and floors, so the trim is ready for paint.',
      'Builders and general contractors can book us for labor-only trim installation. The photos below are from our projects in Southwest Florida and beyond; each caption shows where the work was done.'
    ],
    includes: ['Crown molding', 'Baseboards and shoe molding', 'Door and window casing', 'Picture-frame wall molding and paneling', 'Flex molding on arched openings', 'Interior doors and trim'],
    photos: [ph.fmTrayAfter, ph.tpArch, ph.fmCorner, ph.ccCorner, ph.shMolding, ph.fmFoyer],
    photosTitle: 'Trim work from our projects',
    faq: [
      ['Do you install trim in Naples?', 'Yes. Naples is in our service area, together with Bonita Springs, Estero, Fort Myers, Cape Coral and Sanibel Island.'],
      ['Can you match the trim already in my home?', 'Tell us about the existing profiles and send photos. We review the scope with you before the free estimate.'],
      ['How do I get an estimate?', `Call or text ${PHONE}, or send the form with the scope, the city and a few photos. Estimates are free.`]
    ]
  },
  {
    slug: 'crown-molding-installation',
    nav: 'Crown Molding Installation',
    service: 'Crown molding installation',
    title: "Crown Molding Installation in Fort Myers & Naples | Zeferino's",
    description: `Crown molding installation in Southwest Florida: tray ceilings, layered frame ceilings and crown in every room. Fort Myers, Naples and nearby. Free estimates.`,
    h1: 'Crown molding installation in Southwest Florida',
    lead: 'Crown molding and ceiling trim cut and fitted to every corner, for new construction and remodels in Fort Myers, Naples and the surrounding area.',
    area: AREA,
    intro: [
      'Crown molding is cut to the angle of each wall and ceiling, coped or mitered at every corner and fitted so the joints close cleanly. We install crown in single rooms and throughout whole homes, including tray ceilings, columns and wall returns.',
      FM_PROJECT,
      'We install for homeowners and work labor-only for builders, general contractors and millwork suppliers.'
    ],
    includes: ['Crown molding in living areas, bedrooms and hallways', 'Tray ceiling crown and trim', 'Layered frame ceilings', 'Crown around columns and wall returns', 'Crown in kitchens'],
    photos: [ph.fmTrayBefore, ph.fmTrayAfter, ph.fmBay, ph.fmBedroom, ph.fmCorner, ph.fmColumn],
    photosTitle: 'Crown molding in Fort Myers',
    faq: [
      ['Do you install crown molding on tray ceilings?', 'Yes. Our Fort Myers projects include crown on octagonal and rectangular tray ceilings and layered frame ceilings.'],
      ['Which areas do you serve?', 'Fort Myers, Naples, Cape Coral, Bonita Springs, Estero, Sanibel Island and surrounding communities in Southwest Florida.'],
      ['How do I get an estimate?', `Call or text ${PHONE}, or send the form with the rooms, the city and a few photos. Estimates are free.`]
    ]
  },
  {
    slug: 'baseboard-installation',
    nav: 'Baseboard Installation',
    service: 'Baseboard installation',
    title: "Baseboard Installation in Fort Myers & Naples, FL | Zeferino's",
    description: `Baseboard installation in Southwest Florida: new baseboards and shoe molding with tight joints and clean transitions, for new floors, remodels and new construction.`,
    h1: 'Baseboard installation in Southwest Florida',
    lead: 'New baseboards with tight joints and seamless transitions room to room, for new construction, remodels and new floors.',
    area: AREA,
    intro: [
      'Baseboards finish the line where wall meets floor. We install new baseboards and shoe molding with coped or mitered inside corners, clean outside corners and neat returns at door casings.',
      'Baseboards are often replaced together with a new floor. We also install vinyl plank flooring, so the floor and the trim can be planned as one job.',
      'For builders and general contractors we provide labor-only baseboard and trim installation on new construction.'
    ],
    includes: ['New baseboards in any room', 'Shoe molding and quarter round', 'Baseboards after new flooring', 'Returns at door casings', 'Labor-only baseboards for builders'],
    photos: [ph.ccCorner, ph.ccHall, ph.shCasing, ph.ccStairs],
    photosTitle: 'Baseboards and trim from our projects',
    faq: [
      ['Can you install baseboards after new flooring?', 'Yes. We install vinyl plank flooring as well, so the floor and the baseboards can be done as one job.'],
      ['Which areas do you serve?', 'Fort Myers, Naples, Cape Coral, Bonita Springs, Estero, Sanibel Island and surrounding communities.'],
      ['How do I get an estimate?', `Call or text ${PHONE}, or send the form with the rooms, the city and a few photos. Estimates are free.`]
    ]
  },
  {
    slug: 'interior-trim-installation',
    nav: 'Interior Trim Installation',
    service: 'Interior trim installation',
    title: "Interior Trim Installation in Southwest Florida | Zeferino's",
    description: `Interior trim installation: crown molding, baseboards, door and window casing, wall molding, arches and interior doors. Fort Myers, Naples and Southwest Florida.`,
    h1: 'Interior trim installation',
    lead: 'Crown, baseboards, casings, wall molding, arches and interior doors, installed as one complete trim package for homes and builders in Southwest Florida.',
    area: AREA,
    intro: [
      'Interior trim covers every piece that frames a room: crown molding at the ceiling, baseboards at the floor, casing around doors and windows, wall molding and paneling, and curved casing on arched openings. We install the full package or any part of it.',
      'Our work includes crown and tray ceiling trim in Fort Myers, flex molding casing on arched openings in Tampa, and picture-frame wall molding, shiplap and door casing on a commercial interior in Southaven, Mississippi.',
      'We install for homeowners and provide labor-only trim installation for builders, general contractors and millwork suppliers.'
    ],
    includes: ['Crown molding and ceiling trim', 'Baseboards and shoe molding', 'Door and window casing', 'Interior doors', 'Picture-frame wall molding, paneling and shiplap', 'Flex molding on arched openings'],
    photos: [ph.fmFoyer, ph.tpArch, ph.shMolding, ph.shCasing, ph.ccCorner, ph.tpKitchen],
    photosTitle: 'Interior trim from our projects',
    faq: [
      ['Do you install trim on arched openings?', 'Yes. We fit flex molding casing to the curve of each arch.'],
      ['Do you work on commercial interiors?', 'Our projects include interior finish carpentry at a hospital in the Memphis area: wall molding, shiplap, ceiling beams and door casing.'],
      ['How do I get an estimate?', `Call or text ${PHONE}, or send the form with the scope, the city and a few photos. Estimates are free.`]
    ]
  },
  {
    slug: 'custom-carpentry-southwest-florida',
    nav: 'Custom Carpentry in Southwest Florida',
    service: 'Custom carpentry',
    title: "Custom Carpentry in Southwest Florida | Zeferino's Precision Finish",
    description: `Custom carpentry in Southwest Florida: accent walls, paneling, decorative beams, arched trim, stairs and handrails. Fort Myers, Naples, Sanibel. Free estimates.`,
    h1: 'Custom carpentry in Southwest Florida',
    lead: 'Accent walls, wall paneling, decorative beams, arched openings, stairs and handrails: the details that give a room character.',
    area: AREA,
    intro: [
      "Beyond standard trim, Zeferino's Precision Finish builds the project-specific details that change how a room feels: wood slat accent walls, picture-frame wall molding and shiplap, decorative ceiling beams, flex molding on arches, stairs and handrails.",
      'In Southwest Florida our work includes layered frame ceilings in Fort Myers, stairs with new treads and risers in Cape Coral, and an exterior wood handrail and a rebuilt deck railing section on Sanibel Island.',
      'Tell us what you have in mind, with photos or plans, and we will review the scope with you before the free estimate.'
    ],
    includes: ['Wood slat accent walls', 'Wall paneling, picture-frame molding and shiplap', 'Decorative ceiling beams', 'Layered frame ceilings', 'Flex molding on arched openings', 'Stairs, interior and exterior handrails'],
    photos: [ph.shSlat, ph.shBeams, ph.fmFoyer, ph.ccStairs, ph.sbHandrail, ph.sbRail],
    photosTitle: 'Custom carpentry from our projects',
    faq: [
      ['What kind of custom carpentry do you do?', 'Accent walls, wall paneling, decorative beams, layered ceiling trim, arched openings, stairs and handrails.'],
      ['Which areas do you serve?', 'Fort Myers, Naples, Cape Coral, Bonita Springs, Estero, Sanibel Island and surrounding communities.'],
      ['How do I get an estimate?', `Call or text ${PHONE}, or send the form with your idea, the city and a few photos. Estimates are free.`]
    ]
  }
];

/* ---------- templates ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const WM = '<span class="wm sm"><img class="wz" src="/images/wm-z.webp" alt=""><img class="ww" src="/images/wm-word.webp" alt=""></span>';
const city = n => ({ '@type': 'City', name: n, containedInPlace: { '@type': 'State', name: 'Florida' } });

const svcLinks = current => `<ul class="svc-links">${pages.map(p => `<li><a href="/${p.slug}/"${p.slug === current ? ' aria-current="page"' : ''}>${esc(p.nav)}</a></li>`).join('')}</ul>`;

const footer = `<footer class="site">
  <div class="wrap">
    <div class="foot-top">
      <img class="foot-logo" src="/images/logo-horizontal.webp" alt="Zeferino's Precision Finish &amp; Remodeling" width="1000" height="324" loading="lazy">
      <div><p>Precision in every detail.</p></div>
    </div>
    <div class="foot-grid">
      <div class="foot-about">
        <h4>Zeferino's Inc.</h4>
        <p>Precision Finish &amp; Remodeling. Finish carpentry and flooring installation for homeowners and builders in Southwest Florida.</p>
      </div>
      <div>
        <h4>Services</h4>
        <ul>${pages.map(p => `<li><a href="/${p.slug}/">${esc(p.nav)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul><li><a href="/#projects">Projects</a></li><li><a href="/#builders">For builders</a></li><li><a href="/#about">About</a></li><li><a href="/#contact">Free estimate</a></li><li><a href="https://g.page/r/CXTSTTdy2QNmEAI/review" target="_blank" rel="noopener">Leave a Google review</a></li></ul>
      </div>
      <div class="foot-contact">
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:${TEL}">${PHONE}</a></li>
          <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
          <li><a href="${IG}" target="_blank" rel="noopener">@zeferinosprecisionfinish</a></li>
          <li><span>Southwest Florida</span></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="foot-bottom"><div class="wrap"><span>© 2026 Zeferino's Inc. All rights reserved.</span><span>zeferinosusa.com</span></div></div>
</footer>`;

function page(p) {
  const url = `${SITE}/${p.slug}/`;
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': url + '#service',
      name: p.h1,
      serviceType: p.service,
      url,
      description: p.description,
      provider: { '@type': 'HomeAndConstructionBusiness', '@id': BIZ_ID, name: "Zeferino's Precision Finish & Remodeling", url: SITE + '/', telephone: '+1-239-324-1224' },
      areaServed: p.area.map(city)
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: p.nav, item: url }
      ]
    }
  ];
  const og = SITE + p.photos[0].src;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#161514">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Zeferino's Precision Finish &amp; Remodeling">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${JSON.stringify(ld)}
</script>
<link rel="preload" href="/fonts/pagella-regular.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="/fonts/inter-300.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/css/site.css">
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body class="svc-page">
<a class="skip" href="#main">Skip to content</a>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-phone" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14"/><path d="m3 6 9 7 9-7"/></g></symbol>
  <symbol id="i-ig" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none"/></g></symbol>
</svg>
<div class="topbar">
  <div class="wrap">
    <span class="area">Finish carpentry and trim installation in Southwest Florida</span>
    <div class="topbar-links">
      <a href="tel:${TEL}"><svg class="icon"><use href="#i-phone"/></svg>${PHONE}</a>
      <a class="wide" href="mailto:${EMAIL}"><svg class="icon"><use href="#i-mail"/></svg>${EMAIL}</a>
      <a href="${IG}" target="_blank" rel="noopener" aria-label="Instagram"><svg class="icon"><use href="#i-ig"/></svg><span class="wide">Instagram</span></a>
    </div>
  </div>
</div>
<header class="site">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Zeferino's Inc. home">
      <img class="brand-logo" src="/images/logo-horizontal-640.webp" alt="Zeferino's Precision Finish &amp; Remodeling" width="640" height="208">
      <span class="brand-compact" aria-hidden="true"><img class="bz" src="/images/wm-z.webp" alt="" width="160" height="135"><img class="bw" src="/images/wm-word.webp" alt="" width="420" height="66"></span>
    </a>
    <nav class="main" aria-label="Main">
      <a href="/#services">Services</a>
      <a href="/#projects">Projects</a>
      <a href="/#builders">Builders</a>
      <a href="/#about">About</a>
      <a class="btn" href="/#contact">Free estimate</a>
    </nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobileNav" aria-label="Open menu" onclick="toggleMenu()">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.4"/></svg>
    </button>
  </div>
  <nav class="mobile-nav" id="mobileNav" aria-label="Mobile">
    <a href="/">Home</a>
    <a href="/#services">Services</a>
    <a href="/#projects">Projects</a>
    <a href="/#builders">For builders</a>
    <a href="/#about">About</a>
    <a class="btn" href="/#contact">Request a free estimate</a>
  </nav>
</header>

<main id="main">
  <section class="page-head dark">
    <img class="watermark" src="/images/logo-z.png" alt="">
    <div class="wrap">
      <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a> &nbsp;/&nbsp; <a href="/#services">Services</a> &nbsp;/&nbsp; ${esc(p.nav)}</nav>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
      <div class="cta-row" style="margin-top:36px">
        <a class="btn" href="/#contact">Request a free estimate</a>
        <a class="btn line" href="tel:${TEL}">${PHONE}</a>
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap two">
      <div class="prose">
        <div class="kicker">${esc(p.service)}</div>
        <h2>What we install</h2>
        ${p.intro.map(t => `<p>${esc(t)}</p>`).join('\n        ')}
      </div>
      <aside class="aside-box" aria-label="Summary">
        <h2>Included</h2>
        <ul>${p.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        <p style="font-size:15px;color:var(--stone)">For homeowners, builders and general contractors. Labor-only installation is available.</p>
        <a class="btn ink" href="/#contact">Request a free estimate</a>
      </aside>
    </div>
  </section>

  <section class="band linen">
    <div class="wrap">
      <div class="section-head">
        <div><div class="kicker">Real job-site photographs</div><h2>${esc(p.photosTitle)}</h2></div>
        <p class="lead">Every photo is from a project completed by our crew. The caption shows where the work was done.</p>
      </div>
      <div class="photo-grid">
        ${p.photos.map(x => `<figure><div class="ph"><img src="${x.src}" alt="${esc(x.caption)}, ${esc(x.city)}" loading="lazy">${WM}</div><figcaption><b>${esc(x.city)}</b> · ${esc(x.caption)}</figcaption></figure>`).join('\n        ')}
      </div>
      <div class="band-foot"><p>See every project, room by room.</p><a class="more" href="/#projects">View completed projects</a></div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <div class="section-head">
        <div><div class="kicker">How we work</div><h2>From free estimate to final inspection</h2></div>
      </div>
      <div class="steps">
        <div class="step"><div class="num">i.</div><h3>Tell us about the project</h3><p>Call, email or send the form with the scope, the city and a few photos if you have them.</p></div>
        <div class="step"><div class="num">ii.</div><h3>Free estimate</h3><p>We review the scope with you and send a free estimate for the work.</p></div>
        <div class="step"><div class="num">iii.</div><h3>Installation</h3><p>We schedule the job and install with attention to alignment, joints and clean transitions.</p></div>
        <div class="step"><div class="num">iv.</div><h3>Final inspection</h3><p>We review the finished work with you before the job is closed out.</p></div>
      </div>
    </div>
  </section>

  <section class="band linen">
    <div class="wrap">
      <div class="kicker">Questions</div>
      <h2 style="margin-bottom:24px">Common questions</h2>
      <div class="faq">
        ${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <div class="kicker">Our services</div>
      <h2 style="margin-bottom:32px">Finish carpentry services</h2>
      ${svcLinks(p.slug)}
      <p style="margin-top:36px;color:var(--stone)">Service area:</p>
      <ul class="area-list">${AREA.map(a => `<li>${esc(a)}</li>`).join('')}<li>and surrounding communities</li></ul>
    </div>
  </section>

  <section class="band dark closing">
    <div class="wrap">
      <div class="kicker" style="justify-content:center">Let's talk</div>
      <h2>Tell us about your project.</h2>
      <p class="lead">Send the scope and a few photos, and we'll get back to you with a free estimate.</p>
      <div class="cta-row">
        <a class="btn" href="/#contact">Request a free estimate</a>
        <a class="btn line" href="tel:${TEL}">${PHONE}</a>
      </div>
    </div>
  </section>
</main>

${footer}
<script>
function toggleMenu(){const n=document.querySelector('#mobileNav'),b=document.querySelector('.menu-btn');const o=!n.classList.contains('open');n.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Close menu':'Open menu')}
</script>
</body>
</html>
`;
}

for (const p of pages) {
  mkdirSync(p.slug, { recursive: true });
  writeFileSync(`${p.slug}/index.html`, page(p));
}

/* ---------- sitemap: only real, canonical, indexable URLs ---------- */
const today = new Date().toISOString().slice(0, 10);
const urls = ['/', ...pages.map(p => `/${p.slug}/`), '/cleaning/'];
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);

console.log('Built', pages.length, 'service pages, css/site.css and sitemap.xml');
