/* ==========================================================================
   ZEFERINO'S PORTFOLIO DATA
   This is the only file you edit to add a project. See README.md, section
   "Adding a project", for the steps. Only real photos of completed work go
   here. Never add placeholder or stock images.

   Each project:
     id        unique, lowercase, no spaces (used in the web address)
     title     short name of the work
     city, state
     types     one or more of PROJECT_TYPES (drives the service filter)
     service   text shown on the project page
     text      one or two sentences describing the work (used for SEO too)
     cover     index in photos[] used on cards
     feature   index in photos[] used on the home page (optional)
     photos    list of real photos, in the order you want them shown:
               { url: 'images/...jpg', title: 'Descriptive text (used as ALT)' }
               A photo can be a video: add  video: 'videos/...mp4'
     pairs     before and after comparisons, using two photos from THIS project:
               { before: 'images/...', after: 'images/...', label: '...' , view: 'side' }
               Leave [] when there are no matching before and after photos.
   ========================================================================== */

const PROJECT_TYPES = [
  'Trim & molding',
  'Architectural details',
  'Doors & windows',
  'Flooring',
  'Stairs & railings'
];

const H = 'images/sanibel-exterior-handrail/';

const projects = [
  {
    id: 'sanibel-handrail',
    title: 'Exterior wood handrail',
    city: 'Sanibel Island', state: 'FL',
    types: ['Stairs & railings'],
    service: 'Exterior finish carpentry',
    text: 'Installation of an exterior wood handrail on the stairs and porch of a residential property, with attention to precise alignment, secure installation and clean finishing.',
    cover: 0,
    photos: ['4EA3DBFF-8CCE-4055-ACD4-BB834CF81EDC', '6342C326-B229-47BE-9545-8562816ABA6C', '732B7692-87C6-42E9-A679-8B90C5EA64F4', 'C3C7060E-694A-445E-A18D-D41A167435DA', '9F43FB68-CFC7-4308-9ECE-886829AC72D7', '9B67283C-C193-4368-9B80-06FD240A8675', '4A6715AE-7844-4985-BA0A-C1273ADAF72C', '26DB59AF-25AC-4096-A038-03B0751374B5', '46C60CD9-CA19-4242-96A9-6BFBAD2EC5AD', '974BC3AB-8362-40AA-9B57-31410517765A', 'BCFB0049-DC83-4F3E-B7DB-36A4330BFBC5', 'D94BD2A5-2852-4F19-945F-BBD602754D6F', 'DC545279-C570-4097-AC85-0BA12940A3F0']
      .map(f => ({ url: H + f + '_1_105_c.jpeg', title: '' })),
    pairs: []
  },
  {
    id: 'sanibel-flooring',
    title: 'Vinyl plank flooring',
    city: 'Sanibel Island', state: 'FL',
    types: ['Flooring'],
    service: 'Flooring installation',
    text: 'Vinyl plank flooring throughout a residence, from sound-membrane preparation to the finished floor in the living area, bedroom, kitchen and hallway.',
    cover: 8, feature: 8,
    photos: [['01-prep-living-room', 'Preparation: living room'], ['02-prep-bedroom-entry', 'Preparation: bedroom entry'], ['03-prep-bedroom', 'Preparation: bedroom'], ['04-prep-wide-living', 'Preparation: living area'], ['05-prep-living-water-view', 'Preparation: living area with water view'], ['06-prep-kitchen', 'Preparation: kitchen'], ['07-installed-living-room', 'Installed: living room'], ['08-installed-living-water-view', 'Installed: living area with water view'], ['09-installed-bedroom', 'Installed: bedroom'], ['10-installed-hallway', 'Installed: hallway'], ['11-installed-kitchen', 'Installed: kitchen']]
      .map(([f, t]) => ({ url: 'images/sanibel-vinyl-' + f + '.jpg', title: t })),
    pairs: []
  },
  {
    id: 'sanibel-deck-railing',
    title: 'Deck railing repair',
    city: 'Sanibel Island', state: 'FL',
    types: ['Stairs & railings'],
    service: 'Exterior finish carpentry',
    text: 'Repair of a damaged section of deck railing on a raised home: new wood railing and balusters built and fitted to the existing rails and stairs.',
    cover: 4, feature: 4,
    photos: [['01-before-stairs', 'Before: deck and stair railing'], ['02-before-railing', 'Before: damaged railing section'], ['03-after-railing', 'After: new railing section installed'], ['04-after-view', 'After: new railing seen from the deck'], ['05-after-exterior', 'After: the finished deck from outside']]
      .map(([f, t]) => ({ url: 'images/sanibel-deck-railing-' + f + '.jpg', title: t })),
    pairs: []
  },
  {
    id: 'sanibel-impact-doors',
    title: 'Impact sliding door replacement',
    city: 'Sanibel Island', state: 'FL',
    types: ['Doors & windows'],
    service: 'Door installation',
    text: 'Replacement of the old standard sliding glass doors on two levels of a Sanibel Island home with new PGT WinGuard impact-rated sliding doors.',
    cover: 6, feature: 7,
    photos: [['01-before-upper-doors', 'Before: old sliding doors on the upper deck'], ['02-before-deck-doors', 'Before: old sliding doors on the lower deck'], ['03-removing-old-door', 'Removing the old sliding door'], ['04-old-panels-removed', 'Old door panels removed'], ['05-opening-ready', 'Opening prepared for the new door'], ['06-installing-impact-door', 'Installing the new impact sliding door'], ['07-after-upper-impact-door', 'After: new impact sliding door on the upper deck'], ['08-after-deck-impact-doors', 'After: new impact sliding doors on the lower deck']]
      .map(([f, t]) => ({ url: 'images/sanibel-impact-doors-' + f + '.jpg', title: t })),
    pairs: [
      { before: 'images/sanibel-impact-doors-01-before-upper-doors.jpg', after: 'images/sanibel-impact-doors-07-after-upper-impact-door.jpg', label: 'Upper deck sliding doors, before and after' , view: 'side' }
    ]
  },
  {
    id: 'fort-myers-crown-molding',
    title: 'Crown molding and tray ceilings',
    city: 'Fort Myers', state: 'FL',
    types: ['Trim & molding', 'Architectural details'],
    service: 'New construction finish carpentry',
    text: 'Crown molding, tray ceiling trim and layered frame ceilings installed in new construction homes at Esplanade Lake Club in Fort Myers, from foyers and hallways to great rooms and bedrooms.',
    cover: 2, feature: 4,
    photos: [{ url: 'videos/zeferinos-promo-reel-poster.jpg', video: 'videos/zeferinos-promo-reel.mp4', title: 'Video: crown molding installation and the finished rooms' }].concat([['01-before-tray-ceiling', 'Before: octagonal tray ceiling without trim'], ['02-after-tray-ceiling-crown', 'After: the same tray ceiling with crown molding'], ['03-tray-ceiling-bay-windows', 'Tray ceiling with crown over a bay window'], ['04-foyer-triple-frame-ceiling', 'Foyer ceiling with three layered trim frames'], ['05-coffered-frame-detail', 'Layered frame ceiling detail'], ['06-hallway-frame-ceiling', 'Hallway ceiling with double trim frame'], ['07-hallway-tray-crown', 'Hallway tray ceiling with crown'], ['08-great-room-tray', 'Great room tray ceiling with crown'], ['09-bedroom-tray-crown', 'Bedroom tray ceiling with crown'], ['10-great-room-crown', 'Crown molding through the great room'], ['11-tray-crown-entry-view', 'Tray ceiling with crown at the entry'], ['12-tray-crown-bedroom', 'Tray ceiling with recessed lights and crown'], ['13-crown-corner-detail', 'Crown molding returns on a wall column'], ['14-crown-kitchen-column', 'Crown molding around a kitchen column']]
      .map(([f, t]) => ({ url: 'images/fort-myers-crown-' + f + '.jpg', title: t }))),
    pairs: [
      { before: 'images/fort-myers-crown-01-before-tray-ceiling.jpg', after: 'images/fort-myers-crown-02-after-tray-ceiling-crown.jpg', label: 'Tray ceiling, before and after crown molding' , view: 'side' }
    ]
  },
  {
    id: 'new-construction-windows',
    title: 'New construction window installation',
    city: 'Arcadia Area', state: 'FL',
    types: ['Doors & windows'],
    service: 'Window installation',
    text: 'Installation of new PlyGem windows in a new construction home near Arcadia, with flashing tape sealed around every opening, followed by exterior window trim and siding.',
    cover: 6, feature: 6,
    photos: [['01-before-front-openings', 'Before: rough window openings on the front of the house'], ['02-before-corner', 'Before: house wrapped, openings ready'], ['03-rough-opening-flashed', 'Rough opening with sill flashing'], ['04-new-plygem-window', 'New PlyGem window before installation'], ['05-window-installed', 'Window installed in the opening'], ['06-window-flashing-tape', 'Window sealed with flashing tape'], ['07-front-windows-installed', 'After: front windows and door installed'], ['08-side-window-installed', 'Side window installed'], ['09-rear-window-installed', 'Rear window installed'], ['10-window-trim-siding', 'Window trim with siding going on']]
      .map(([f, t]) => ({ url: 'images/new-construction-windows-' + f + '.jpg', title: t })),
    pairs: [
      { before: 'images/new-construction-windows-01-before-front-openings.jpg', after: 'images/new-construction-windows-07-front-windows-installed.jpg', label: 'Front of the house, before and after the windows' , view: 'side' }
    ]
  },
  {
    id: 'southaven-hospital',
    title: 'Hospital interior finish carpentry',
    city: 'Southaven', state: 'MS',
    types: ['Architectural details'],
    service: 'Commercial finish carpentry',
    text: 'Interior finish carpentry at a hospital in the Memphis area: decorative ceiling beams, picture-frame wall molding, shiplap walls, a wood slat accent wall and door casings.',
    cover: 4, feature: 1,
    photos: [['01-ceiling-beam', 'Decorative ceiling beam on a shiplap ceiling'], ['02-ceiling-beams-lobby', 'Ceiling beams at the entrance'], ['03-beam-detail', 'Beam detail with trim at the ceiling'], ['04-beams-shiplap-wall', 'Ceiling beams and a tall shiplap wall'], ['05-slat-accent-wall', 'Wood slat accent wall'], ['06-wall-molding', 'Picture-frame wall molding'], ['07-wall-molding-panels', 'Wall molding panels on an angled wall'], ['08-wall-molding-hallway', 'Wall molding along the hallway'], ['09-molding-corner-detail', 'Molding detail at an inside corner'], ['10-molding-detail', 'Molding detail at an outside corner'], ['11-door-casing', 'Door casing with shiplap surround'], ['12-shiplap-wall-in-progress', 'Shiplap wall during installation']]
      .map(([f, t]) => ({ url: 'images/southaven-hospital-' + f + '.jpg', title: t })),
    pairs: []
  },
  {
    id: 'cape-coral',
    title: 'Vinyl plank flooring and stairs',
    city: 'Cape Coral', state: 'FL',
    types: ['Flooring', 'Stairs & railings'],
    service: 'Flooring and stairs',
    text: 'Vinyl plank flooring throughout a residence plus finished stairs with dark wood treads and white risers, shown before, during and after the work.',
    cover: 1,
    photos: [['01-stairs-before', 'Stairs before the work'], ['02-stairs-finished', 'Finished stairs with dark wood treads and white risers'], ['03-living-area', 'Open living area with vinyl plank flooring'], ['04-bedroom-view', 'Flooring leading into the bedroom'], ['05-hallway', 'Hallway with vinyl plank flooring'], ['06-bedroom', 'Bedroom with vinyl plank flooring'], ['07-bedroom-corner', 'Flooring and trim in a bedroom corner'], ['08-stairs-top-view', 'Finished stairs seen from the hallway'], ['09-video-glass-door-window', 'Planks laid beside a glass door and window'], ['10-video-large-window', 'Flooring in a room with a large window'], ['11-video-living-kitchen', 'Flooring in the open living and kitchen area'], ['12-video-hallway-install', 'Installation in progress in the hallway']]
      .map(([f, t]) => ({ url: 'images/cape-coral-' + f + '.jpg', title: t })),
    pairs: [
      { before: 'images/cape-coral-01-stairs-before.jpg', after: 'images/cape-coral-02-stairs-finished.jpg', label: 'Staircase, before and after' , view: 'side' }
    ]
  },
  {
    id: 'tampa',
    title: 'Flex molding on arched openings',
    city: 'Tampa', state: 'FL',
    types: ['Trim & molding'],
    service: 'Architectural trim',
    text: 'Flex molding casing installed around the arched openings of a residence, matched to the curve of each arch.',
    cover: 0, feature: 0,
    photos: [['01-arch-column', 'Arched opening with column view'], ['02-arch-kitchen', 'Arched opening to the kitchen'], ['03-arch-closet', 'Arched opening in a hallway'], ['04-arch-room', 'Arched opening into a room'], ['05-closet-door', 'Louvered closet door with trim beside the arch'], ['06-arch-bathroom', 'Arched opening to the bathroom'], ['07-arch-dining', 'Arched opening to the dining area']]
      .map(([f, t]) => ({ url: 'images/tampa-flex-molding-' + f + '.jpg', title: t })),
    pairs: []
  }
];

/* Photos shown in the hero slideshow on the home page. */
const heroSlides = [
  { url: 'images/southaven-hospital-05-slat-accent-wall.jpg', cap: 'Wood slat accent wall, Southaven, MS', pos: 'center 45%' },
  { url: 'images/fort-myers-crown-03-tray-ceiling-bay-windows.jpg', cap: 'Tray ceiling and crown molding, Fort Myers', pos: 'center 40%' },
  { url: 'images/southaven-hospital-02-ceiling-beams-lobby.jpg', cap: 'Decorative ceiling beams, Southaven, MS', pos: 'center 30%' },
  { url: 'images/tampa-flex-molding-01-arch-column.jpg', cap: 'Flex molding on an arched opening, Tampa', pos: 'center 35%' },
  { url: 'images/cape-coral-02-stairs-finished.jpg', cap: 'Finished stairs, Cape Coral', pos: 'center 55%' },
  { url: H + '4EA3DBFF-8CCE-4055-ACD4-BB834CF81EDC_1_105_c.jpeg', cap: 'Exterior wood handrail, Sanibel Island', pos: 'center 45%' }
];

/* Optimized copies made by scripts/optimize-images.py, in opt/ with the same path.
   Example: images/cape-coral-01-stairs-before.jpg -> opt/images/cape-coral-01-stairs-before-800.webp */
const optSrc = (url, w) => 'opt/' + url.replace(/\.(jpe?g|png)$/i, '') + '-' + w + '.webp';
const optSrcset = url => optSrc(url, 800) + ' 800w, ' + optSrc(url, 1600) + ' 1600w';
