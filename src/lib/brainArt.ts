// Procedural SVG artwork (thumbnails and imaging cards) returned as
// data URIs so they work anywhere an <img src> is expected.

type Spot = { x: number; y: number; rx: number; ry: number };

// Side view, front of the head on the left. viewBox 0 0 120 100.
const SIDE: Record<string, Spot[]> = {
  cortex: [{ x: 56, y: 42, rx: 44, ry: 30 }],
  pfc: [{ x: 28, y: 42, rx: 17, ry: 21 }],
  dlpfc: [{ x: 33, y: 29, rx: 12, ry: 9 }],
  ofc: [{ x: 28, y: 59, rx: 13, ry: 6 }],
  ifg: [{ x: 37, y: 51, rx: 9, ry: 7 }],
  dmn: [{ x: 40, y: 34, rx: 9, ry: 9 }, { x: 84, y: 32, rx: 10, ry: 9 }],
  parietal: [{ x: 82, y: 26, rx: 14, ry: 10 }],
  acc: [{ x: 47, y: 38, rx: 12, ry: 6 }],
  caudate: [{ x: 56, y: 44, rx: 11, ry: 6 }],
  putamen: [{ x: 61, y: 52, rx: 7, ry: 6 }],
  nacc: [{ x: 49, y: 56, rx: 5, ry: 4.5 }],
  thalamus: [{ x: 67, y: 49, rx: 7, ry: 5 }],
  cerebellum: [{ x: 88, y: 73, rx: 15, ry: 10 }],
  vermis: [{ x: 88, y: 73, rx: 6, ry: 9 }],
  vta: [{ x: 69, y: 64, rx: 4, ry: 4 }],
  sn: [{ x: 66, y: 63, rx: 5, ry: 3 }],
  lc: [{ x: 74, y: 74, rx: 3.5, ry: 3.5 }],
  raphe: [{ x: 71, y: 72, rx: 2.8, ry: 9 }],
};

// Axial (top-down) slice, front at the top. viewBox 0 0 120 120.
const AXIAL: Record<string, Array<[number, number, number]>> = {
  cortex: [[60, 60, 40]],
  pfc: [[48, 26, 11], [72, 26, 11]],
  dlpfc: [[42, 30, 9], [78, 30, 9]],
  ofc: [[52, 20, 7], [68, 20, 7]],
  ifg: [[36, 40, 7], [84, 40, 9]],
  dmn: [[60, 30, 8], [60, 86, 9]],
  acc: [[60, 38, 8]],
  caudate: [[50, 50, 6], [70, 50, 6]],
  putamen: [[44, 58, 6], [76, 58, 6]],
  nacc: [[54, 46, 4], [66, 46, 4]],
  thalamus: [[54, 64, 6], [66, 64, 6]],
  cerebellum: [[48, 96, 9], [72, 96, 9]],
  vermis: [[60, 96, 7]],
  vta: [[60, 72, 4]],
  sn: [[55, 72, 4], [65, 72, 4]],
  lc: [[56, 80, 3], [64, 80, 3]],
  raphe: [[60, 78, 4]],
};

const svgUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const CEREBRUM =
  "M14 50 C10 30 26 12 50 11 C66 10 76 9 90 15 C106 22 112 36 108 50 C106 58 100 62 92 62 C86 63 80 60 74 62 C66 64 60 66 52 64 C44 62 38 66 30 64 C20 62 15 58 14 50 Z";
const GYRI = [
  "M30 20 C36 28 30 34 38 40", "M46 14 C44 22 52 26 48 34", "M60 12 C58 22 66 26 62 36",
  "M74 12 C72 20 80 26 76 34", "M88 17 C84 26 92 30 88 40", "M100 26 C96 32 104 38 98 44",
  "M22 34 C30 38 24 46 32 50", "M42 44 C52 40 56 48 66 44", "M70 44 C80 40 84 50 96 46",
  "M40 56 C50 52 60 58 72 54", "M20 46 C24 52 18 56 24 60",
];

export function brainThumb(regions: string[], accent: string, soft: string): string {
  const spots = regions
    .flatMap((r) => SIDE[r] ?? [])
    .map((s) => `<ellipse cx="${s.x}" cy="${s.y}" rx="${s.rx}" ry="${s.ry}" fill="${accent}" opacity="0.78" filter="url(#b)"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100">
<defs>
<radialGradient id="g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff6f6"/><stop offset="0.55" stop-color="#f0d4da"/><stop offset="1" stop-color="#d5a9b6"/></radialGradient>
<radialGradient id="c" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#f3dde0"/><stop offset="1" stop-color="#c79aa7"/></radialGradient>
<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
<filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<clipPath id="k"><path d="${CEREBRUM}"/></clipPath>
</defs>
<ellipse cx="62" cy="92" rx="38" ry="4" fill="#6b5a4a" opacity="0.18" filter="url(#s)"/>
<path d="M66 60 C68 70 70 80 66 92 L76 92 C78 82 80 72 78 60 Z" fill="url(#c)" stroke="#b88c99" stroke-width="0.8"/>
<ellipse cx="88" cy="72" rx="16" ry="11" fill="url(#c)" stroke="#b88c99" stroke-width="0.8"/>
<path d="M75 68 Q88 64 101 69 M74 73 Q88 69 103 74 M76 78 Q88 75 100 79" stroke="#b88c99" stroke-width="0.7" fill="none"/>
<path d="${CEREBRUM}" fill="url(#g)" stroke="#b88c99" stroke-width="1"/>
<g clip-path="url(#k)">${spots}</g>
<g clip-path="url(#k)" fill="none" stroke="#c08f9d" stroke-width="1.1" stroke-linecap="round" opacity="0.8">${GYRI.map((d) => `<path d="${d}"/>`).join("")}</g>
${regions.some((r) => ["cerebellum", "vermis", "lc", "raphe", "vta"].includes(r))
  ? `<g>${regions.flatMap((r) => (["cerebellum", "vermis", "lc", "raphe", "vta"].includes(r) ? SIDE[r] : [])).map((s) => `<ellipse cx="${s.x}" cy="${s.y}" rx="${s.rx}" ry="${s.ry}" fill="${accent}" opacity="0.75" filter="url(#b)"/>`).join("")}</g>`
  : ""}
<circle cx="110" cy="10" r="0" fill="${soft}"/>
</svg>`;
  return svgUri(svg);
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function imagingArt(kind: "fmri" | "pet" | "dti", regions: string[], accent: string): string {
  const spots = regions.flatMap((r) => AXIAL[r] ?? []);
  const rnd = seeded(regions.join("").length * 97 + kind.length * 13);
  let body = "";
  if (kind === "fmri") {
    body = spots
      .map(([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r * 1.2}" fill="url(#hot)" filter="url(#b)"/>`)
      .join("");
  } else if (kind === "pet") {
    body = `<ellipse cx="60" cy="60" rx="38" ry="48" fill="url(#cool)" opacity="0.9" filter="url(#b)"/>` +
      spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 1.4}" fill="url(#pet)" filter="url(#b)"/>`).join("");
  } else {
    const colors = ["#e0544f", "#4f8fe0", "#4fbf6a", accent];
    for (let i = 0; i < 26; i += 1) {
      const x = 30 + rnd() * 60;
      const y = 22 + rnd() * 76;
      const tx = spots.length ? spots[i % spots.length][0] : 60;
      const ty = spots.length ? spots[i % spots.length][1] : 60;
      body += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${((x + tx) / 2 + (rnd() - 0.5) * 30).toFixed(1)} ${((y + ty) / 2).toFixed(1)} ${tx} ${ty}" stroke="${colors[i % colors.length]}" stroke-width="${(0.8 + rnd() * 1.2).toFixed(2)}" fill="none" opacity="0.85"/>`;
    }
  }
  const bg = kind === "dti" ? "#14161c" : kind === "pet" ? "#0f1020" : "#1a1a1a";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs>
<radialGradient id="hot"><stop offset="0" stop-color="#fff6a0"/><stop offset="0.45" stop-color="#ff9a2a"/><stop offset="1" stop-color="#e2342a" stop-opacity="0"/></radialGradient>
<radialGradient id="pet"><stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#ffe14a"/><stop offset="0.6" stop-color="#ff5a2a"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="cool"><stop offset="0" stop-color="#2a8a6a"/><stop offset="0.7" stop-color="#1f3f9a"/><stop offset="1" stop-color="#14185a"/></radialGradient>
<radialGradient id="gm" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#9a9a9a"/><stop offset="0.8" stop-color="#6c6c6c"/><stop offset="1" stop-color="#3a3a3a"/></radialGradient>
<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>
<clipPath id="k"><ellipse cx="60" cy="60" rx="40" ry="50"/></clipPath>
</defs>
<rect width="120" height="120" fill="${bg}"/>
${kind === "dti" ? "" : `<ellipse cx="60" cy="60" rx="40" ry="50" fill="url(#gm)"/>
<path d="M60 12 L60 108" stroke="#2a2a2a" stroke-width="1.4"/>
<path d="M44 46 C40 56 44 66 50 70 M76 46 C80 56 76 66 70 70" stroke="#3a3a3a" stroke-width="3" fill="none"/>`}
<g clip-path="url(#k)">${body}</g>
<ellipse cx="60" cy="60" rx="40" ry="50" fill="none" stroke="${kind === "dti" ? "#555" : "#cfcfcf"}" stroke-width="1"/>
</svg>`;
  return svgUri(svg);
}
