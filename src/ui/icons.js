// The order buttons speak in pictures first and words second. A thumb on a
// phone reads a sail shape or a ball faster than FULL / ROUND in nine-point
// caps, and a row of icons survives a narrow screen where five words do not.
// Every icon is a small inline SVG drawn in currentColor, so it takes the
// button's brass when the order is on and the dim ink when it is not — and it
// needs no asset files, which is the house rule for everything in here.
//
// The caption under each icon stays, small: the picture is the control, the
// word is the confirmation. The ? card explains what each order does.

const svg = (body, extra = '') =>
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
  'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' +
  extra + '>' + body + '</svg>';

// A hull line under the mast, shared by the three sail states.
const hull = '<path d="M4 19 Q12 22 20 19"/>';
const mast = '<path d="M9 3v16"/>';

export const ICONS = {
  // --- helm: how far the head comes round, and which way ---
  'helm-port-2':  svg('<path d="M13 6l-6 6 6 6"/><path d="M19 6l-6 6 6 6"/>'),
  'helm-port-1':  svg('<path d="M15 6l-6 6 6 6"/>'),
  'helm-steady':  svg('<path d="M12 20V5"/><path d="M7 10l5-5 5 5"/>'),
  'helm-stbd-1':  svg('<path d="M9 6l6 6-6 6"/>'),
  'helm-stbd-2':  svg('<path d="M11 6l6 6-6 6"/><path d="M5 6l6 6-6 6"/>'),

  // --- sails: how much canvas she carries ---
  'sail-full':    svg(mast + '<path d="M9 4l11 12H9z" fill="currentColor" fill-opacity="0.25"/>' + hull),
  'sail-battle':  svg(mast + '<path d="M9 8l7 8H9z" fill="currentColor" fill-opacity="0.25"/>' + hull),
  'sail-takein':  svg(mast + '<rect x="6.5" y="8" width="5" height="4" rx="1.2" fill="currentColor" fill-opacity="0.4"/>' + hull),

  // --- guns: the charge in the barrel ---
  'shot-round':   svg('<circle cx="12" cy="12" r="4.5" fill="currentColor"/>'),
  'shot-chain':   svg('<circle cx="6.5" cy="12" r="3" fill="currentColor"/><circle cx="17.5" cy="12" r="3" fill="currentColor"/><path d="M9.5 12h5"/>'),
  'shot-grape':   svg('<g fill="currentColor" stroke="none"><circle cx="8" cy="8" r="2"/><circle cx="15" cy="7" r="2"/><circle cx="12" cy="12.5" r="2"/><circle cx="6.5" cy="15" r="2"/><circle cx="17" cy="15" r="2"/><circle cx="11.5" cy="18.5" r="2"/></g>'),
  'shot-double':  svg('<circle cx="8.5" cy="12" r="4.5" fill="currentColor"/><circle cx="15.5" cy="12" r="4.5" fill="currentColor"/>'),
  'shot-hold':    svg('<path d="M8 6v12"/><path d="M16 6v12"/>'),
  'fire-party':   svg('<path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.8.8-3 1.6-3.8.2 1.4.9 2.2 1.9 2.4C11.2 8 10.5 5.5 12 3z" fill="currentColor" fill-opacity="0.3"/><path d="M6 21h12"/>'),

  // --- cable: under way, or the anchor going down or coming up ---
  'cable-stand':  svg('<path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>'),
  'cable-letgo':  svg('<circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M6 14a6 6 0 0 0 12 0"/><path d="M8 11h8"/><path d="M19 18l2 2 2-2" transform="translate(-1 -1)"/>'),
  'cable-weigh':  svg('<circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M6 14a6 6 0 0 0 12 0"/><path d="M8 11h8"/><path d="M18 21l2-2 2 2" transform="translate(-1 -1)"/>'),

  // --- close: keep off, throw the hooks, or man the prize ---
  'close-off':    svg('<rect x="3" y="8" width="6" height="8" rx="1.5"/><rect x="15" y="8" width="6" height="8" rx="1.5"/><path d="M10.5 12h3" stroke-dasharray="1.5 1.5"/>'),
  'close-grapple': svg('<path d="M12 3v11"/><path d="M6 12c0 4 2.5 7 6 7s6-3 6-7"/><path d="M6 12l-2 2M18 12l2 2"/><circle cx="12" cy="3" r="1.4"/>'),
  'close-prize':  svg('<path d="M6 21V4"/><path d="M6 5h11l-3 4 3 4H6" fill="currentColor" fill-opacity="0.3"/>'),

  // --- the deck: who goes over the rail, and how ---
  'melee-press':  svg('<path d="M5 5l14 14"/><path d="M19 5L5 19"/><path d="M4 19l2-2M18 19l2-2M4 5l2 2M18 5l2 2"/>'),
  'melee-boarders': svg('<path d="M6 18L18 6"/><path d="M15 6h3v3"/><path d="M5 17l2 2"/>'),
  'melee-hold':   svg('<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" fill="currentColor" fill-opacity="0.2"/>'),
  'melee-back':   svg('<path d="M4 20l9-9"/><path d="M13 11l4-4 3 3-4 4z" fill="currentColor" fill-opacity="0.3"/><path d="M15 5l4 4"/>'),

  // --- the button row ---
  'levels':       svg('<path d="M4 6h16M4 12h16M4 18h10"/>'),
};

// Stamp the icons into every button that asks for one. Called once at boot;
// the markup carries data-ic so index.html stays the only place that says
// which control is which.
export function applyIcons(root) {
  for (const b of root.querySelectorAll('button[data-ic]')) {
    const body = ICONS[b.dataset.ic];
    if (!body) continue;
    const holder = document.createElement('span');
    holder.className = 'ic';
    holder.innerHTML = body;
    b.prepend(holder);
  }
}
