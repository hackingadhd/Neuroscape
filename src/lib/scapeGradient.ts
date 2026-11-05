// Grainy pastel "scape" gradients, matching the Mindscape website cards.

type Palette = { base: string; a: string; b: string; c: string };

const PALETTES: Record<string, Palette> = {
  neuro: { base: "#c9cbe0", a: "#9fa9cf", b: "#e6d9ef", c: "#b8c7dc" },
  dopamine: { base: "#e7d7cf", a: "#e9b9c6", b: "#c9cf9e", c: "#f1d2b4" },
  norepinephrine: { base: "#bfdcd6", a: "#8fc3c4", b: "#dbe7b4", c: "#7fa6b8" },
  serotonin: { base: "#e3dcef", a: "#cdbfe6", b: "#efd9e6", c: "#b9c6e8" },
  areas: { base: "#d9d6cf", a: "#e7b9c9", b: "#9fbf92", c: "#cfd6e6" },
  default: { base: "#d6d9e4", a: "#a8b4cf", b: "#e2dcec", c: "#c4d3d6" },
};

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

function mixWhite(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (v: number) => Math.round(v + (255 - v) * amount);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/** Full-strength gradient (thumbnails, chips). `light` washes it out for big panels. */
export function scapeGradient(topicId: string, light = 0): string {
  const p = PALETTES[topicId] ?? PALETTES.default;
  const c = (hex: string) => (light ? mixWhite(hex, light) : hex);
  return [
    NOISE,
    `radial-gradient(ellipse at 18% 22%, ${c(p.a)} 0%, transparent 55%)`,
    `radial-gradient(ellipse at 82% 28%, ${c(p.b)} 0%, transparent 55%)`,
    `radial-gradient(ellipse at 55% 92%, ${c(p.c)} 0%, transparent 60%)`,
    `linear-gradient(160deg, ${c(p.base)}, ${c(p.c)})`,
  ].join(", ");
}
