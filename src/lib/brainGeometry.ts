// Procedural anatomical-ish brain: two folded hemispheres, a cerebellum with
// folia and a brainstem. Built once and cached. Region weights are stored per
// vertex so the scene can light up any region with a single attribute swap.
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  SphereGeometry,
  Vector3,
} from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gauss, noise3, smoothstep } from "./noise";

export type SurfacePart = {
  geometry: BufferGeometry;
  weights: Record<string, Float32Array>;
};

export const CORTEX_REGIONS = ["cortex", "pfc", "dlpfc", "ofc", "ifg", "dmn", "parietal", "acc"] as const;
export const CEREBELLUM_REGIONS = ["cerebellum", "vermis"] as const;

const HEMI_OFFSET = 0.425;

function prep(widthSegs: number, heightSegs: number) {
  let g: BufferGeometry = new SphereGeometry(1, widthSegs, heightSegs);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  return g;
}

function buildHemisphere(side: 1 | -1): SurfacePart {
  const g = prep(300, 210);
  const pos = g.attributes.position as BufferAttribute;
  const count = pos.count;
  const lateral = new Float32Array(count);
  const medial = new Float32Array(count);
  const groove = new Float32Array(count);
  const keys = CORTEX_REGIONS;
  const weights: Record<string, Float32Array> = {};
  for (const k of keys) weights[k] = new Float32Array(count);

  // 1) Shape the ellipsoid into a hemisphere.
  for (let i = 0; i < count; i += 1) {
    let lx = pos.getX(i) * side; // + = away from midline
    let y = pos.getY(i);
    let z = pos.getZ(i);
    lx *= 0.6;
    y *= 0.72;
    z *= 1.02;
    // higher crown toward the back
    y += 0.05 * smoothstep(0.2, 0.7, y) * smoothstep(0.6, -0.4, z);
    // flatten the base
    if (y < -0.18) y = -0.18 + (y + 0.18) * 0.62;
    // raise the underside of the frontal lobe (orbits) and occipital lobe (room for cerebellum)
    const front = smoothstep(0.25, 0.95, z);
    const back = smoothstep(-0.2, -0.95, z);
    if (y < 0) y *= 1 - 0.32 * front - 0.5 * back;
    // temporal lobe hangs down and out a little on the side
    const temporal = gauss(z, 0.05, 0.32) * smoothstep(0.0, -0.3, y) * smoothstep(0.0, 0.45, lx);
    y -= 0.1 * temporal;
    lx += 0.05 * temporal;
    // narrower frontal pole
    lx *= 1 - 0.12 * smoothstep(0.5, 1.0, z);

    // flat medial wall
    const m = smoothstep(-0.3, -0.45, lx);
    if (lx < -0.38) lx = -0.38 + (lx + 0.38) * 0.14;

    // Sylvian fissure: a groove on the lateral surface separating temporal from frontal/parietal lobes
    const az = 0.48, ay = -0.13, bz = -0.28, by = 0.07;
    const abz = bz - az, aby = by - ay;
    const tSeg = Math.min(1, Math.max(0, ((z - az) * abz + (y - ay) * aby) / (abz * abz + aby * aby)));
    const dz = z - (az + abz * tSeg);
    const dy = y - (ay + aby * tSeg);
    const dist = Math.sqrt(dz * dz + dy * dy);
    groove[i] = Math.exp(-((dist / 0.03) ** 2)) * smoothstep(0.25, 0.45, lx);

    lateral[i] = lx;
    medial[i] = m;

    // Region weights (in shaped space, before folding)
    const pfc = smoothstep(0.3, 0.62, z);
    weights.cortex[i] = 1;
    weights.pfc[i] = pfc;
    weights.dlpfc[i] = smoothstep(0.22, 0.5, z) * smoothstep(0.75, 0.55, z) * smoothstep(0.05, 0.25, y) * smoothstep(0.1, 0.35, lx);
    weights.ofc[i] = smoothstep(0.3, 0.6, z) * smoothstep(-0.02, -0.15, y);
    weights.ifg[i] =
      gauss(z, 0.42, 0.13) * gauss(y, -0.04, 0.09) * smoothstep(0.25, 0.45, lx) * (side > 0 ? 1 : 0.55);
    weights.dmn[i] = Math.min(
      1,
      m * (smoothstep(0.2, 0.45, z) + smoothstep(-0.25, -0.55, z) * smoothstep(-0.1, 0.15, y)) +
        0.85 * gauss(z, -0.55, 0.14) * smoothstep(0.05, 0.25, y) * smoothstep(0.25, 0.45, lx),
    );
    weights.parietal[i] = smoothstep(-0.12, -0.4, z) * smoothstep(0.75, 0.55, -z) * smoothstep(0.15, 0.4, y);
    weights.acc[i] = m * gauss(z, 0.32, 0.17) * gauss(y, 0.14, 0.13);

    pos.setXYZ(i, side * (lx + HEMI_OFFSET), y, z);
  }
  g.computeVertexNormals();

  // 2) Fold the cortex into gyri and sulci along the normal.
  const nrm = g.attributes.normal as BufferAttribute;
  const colors = new Float32Array(count * 3);
  const crest = new Color("#f1d0d7");
  const sulcus = new Color("#a66a7d");
  const tmp = new Color();
  for (let i = 0; i < count; i += 1) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const sx = x * side + 3.1; // decorrelate left / right
    const wx = noise3(sx * 1.2 + 11, y * 1.2, z * 1.2) * 0.3;
    const wy = noise3(sx * 1.2, y * 1.2 + 23, z * 1.2) * 0.3;
    const wz = noise3(sx * 1.2, y * 1.2, z * 1.2 + 37) * 0.3;
    // stretch frequency vertically so gyri run roughly up-down on the sides
    const n = noise3((sx + wx) * 2.6, (y + wy) * 2.6, (z + wz) * 2.6);
    // rounded gyri separated by narrow sulci
    const ridge = smoothstep(0.0, 0.26, Math.abs(n));
    let disp = 0.055 * (ridge - 0.75) + 0.003 * noise3(sx * 12, y * 12, z * 12);
    disp -= 0.075 * groove[i];
    if (medial[i] > 0.5) disp = Math.min(disp, 0) * 0.6;
    pos.setXYZ(i, x + nrm.getX(i) * disp, y + nrm.getY(i) * disp, z + nrm.getZ(i) * disp);
    const shade = Math.min(ridge, 1 - groove[i] * 0.8);
    tmp.copy(sulcus).lerp(crest, 0.1 + 0.9 * shade * shade);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.setAttribute("aHl", new BufferAttribute(new Float32Array(count), 1));
  g.computeVertexNormals();
  normalizeWeights(weights);
  void lateral;
  return { geometry: g, weights };
}

function buildCerebellum(): SurfacePart {
  const g = prep(200, 140);
  const pos = g.attributes.position as BufferAttribute;
  const count = pos.count;
  const weights: Record<string, Float32Array> = {
    cerebellum: new Float32Array(count).fill(1),
    vermis: new Float32Array(count),
  };
  const colors = new Float32Array(count * 3);
  const light = new Color("#efd3d9");
  const dark = new Color("#b98595");
  const tmp = new Color();
  for (let i = 0; i < count; i += 1) {
    const ux = pos.getX(i), uy = pos.getY(i), uz = pos.getZ(i);
    let x = ux * 0.66, y = uy * 0.3, z = uz * 0.4;
    // two lobes with a midline notch at the back
    const notch = gauss(x, 0, 0.09) * smoothstep(0.0, -0.3, z);
    z += 0.06 * notch;
    y -= 0.02 * notch;
    // flatter top
    if (y > 0.12) y = 0.12 + (y - 0.12) * 0.5;
    // folia: fine horizontal ridges
    const f = Math.sin((uy + 0.08 * noise3(ux * 3, uy * 3, uz * 3)) * 62);
    const r = smoothstep(-0.6, 0.9, f);
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const d = 0.016 * (r - 0.6);
    x += (x / len) * d;
    y += (y / len) * d;
    z += (z / len) * d;
    pos.setXYZ(i, x, y - 0.44, z - 0.6);
    weights.vermis[i] = gauss(x, 0, 0.11);
    tmp.copy(dark).lerp(light, 0.3 + 0.7 * r);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.setAttribute("aHl", new BufferAttribute(new Float32Array(count), 1));
  g.computeVertexNormals();
  normalizeWeights(weights);
  return { geometry: g, weights };
}

// Scale every region so its strongest vertex reaches 1, then sharpen the edge.
function normalizeWeights(weights: Record<string, Float32Array>) {
  for (const arr of Object.values(weights)) {
    let max = 0;
    for (let i = 0; i < arr.length; i += 1) if (arr[i] > max) max = arr[i];
    if (max <= 0) continue;
    for (let i = 0; i < arr.length; i += 1) arr[i] = smoothstep(0.12, 0.7, arr[i] / max);
  }
}

let cache: { left: SurfacePart; right: SurfacePart; cerebellum: SurfacePart } | null = null;

export function getBrainSurfaces() {
  if (!cache) {
    cache = { left: buildHemisphere(-1), right: buildHemisphere(1), cerebellum: buildCerebellum() };
  }
  return cache;
}

// ---------- Deep structures & pathways ----------

type V3 = [number, number, number];

export type DeepSpec =
  | { kind: "ellipsoid"; center: V3; scale: V3; rot?: V3; mirror?: boolean }
  | { kind: "tube"; points: V3[]; radius: number; mirror?: boolean };

export const DEEP: Record<string, { color: string; parts: DeepSpec[] }> = {
  thalamus: { color: "#c9b48c", parts: [{ kind: "ellipsoid", center: [0.1, -0.04, -0.14], scale: [0.09, 0.08, 0.15], mirror: true }] },
  caudate: {
    color: "#e0954f",
    parts: [
      { kind: "ellipsoid", center: [0.16, 0.06, 0.3], scale: [0.07, 0.09, 0.11], mirror: true },
      {
        kind: "tube",
        radius: 0.035,
        mirror: true,
        points: [[0.16, 0.08, 0.3], [0.18, 0.18, 0.08], [0.2, 0.17, -0.22], [0.27, 0.04, -0.42], [0.32, -0.12, -0.32], [0.33, -0.2, -0.12]],
      },
    ],
  },
  putamen: { color: "#eaa866", parts: [{ kind: "ellipsoid", center: [0.29, -0.04, 0.1], scale: [0.065, 0.12, 0.19], mirror: true }] },
  nacc: { color: "#f2b660", parts: [{ kind: "ellipsoid", center: [0.12, -0.14, 0.3], scale: [0.055, 0.05, 0.06], mirror: true }] },
  acc: {
    color: "#9a7ad0",
    parts: [{
      kind: "tube",
      radius: 0.04,
      mirror: true,
      points: [[0.05, -0.1, 0.5], [0.05, 0.12, 0.56], [0.05, 0.3, 0.4], [0.05, 0.36, 0.15], [0.05, 0.32, -0.08]],
    }],
  },
  vta: { color: "#e0a030", parts: [{ kind: "ellipsoid", center: [0, -0.3, -0.1], scale: [0.06, 0.04, 0.05] }] },
  sn: { color: "#7a5a3a", parts: [{ kind: "ellipsoid", center: [0.09, -0.3, -0.1], scale: [0.06, 0.025, 0.06], mirror: true }] },
  lc: { color: "#3f7fd0", parts: [{ kind: "ellipsoid", center: [0.05, -0.5, -0.3], scale: [0.03, 0.03, 0.04], mirror: true }] },
  raphe: {
    color: "#6b8be0",
    parts: [
      { kind: "ellipsoid", center: [0, -0.36, -0.2], scale: [0.025, 0.05, 0.03] },
      { kind: "ellipsoid", center: [0, -0.5, -0.26], scale: [0.025, 0.06, 0.03] },
      { kind: "ellipsoid", center: [0, -0.66, -0.3], scale: [0.022, 0.05, 0.028] },
    ],
  },
};

export const PATHWAYS: Record<string, { color: string; source: string; curves: V3[][] }> = {
  mesocortical: {
    color: "#e6a425",
    source: "vta",
    curves: [
      [[0.02, -0.3, -0.1], [0.08, -0.16, 0.08], [0.12, 0.04, 0.34], [0.2, 0.24, 0.55], [0.3, 0.32, 0.74]],
      [[0.02, -0.3, -0.1], [0.06, -0.12, 0.12], [0.1, 0.16, 0.36], [0.14, 0.4, 0.5], [0.22, 0.5, 0.56]],
      [[0.02, -0.3, -0.1], [0.07, -0.2, 0.2], [0.12, -0.12, 0.48], [0.2, -0.06, 0.74]],
    ],
  },
  mesolimbic: {
    color: "#f0b44a",
    source: "vta",
    curves: [
      [[0.02, -0.3, -0.1], [0.06, -0.26, 0.05], [0.1, -0.2, 0.2], [0.12, -0.14, 0.3]],
      [[0.02, -0.3, -0.1], [0.1, -0.24, -0.02], [0.2, -0.22, 0.04], [0.26, -0.26, -0.02]],
    ],
  },
  nigrostriatal: {
    color: "#c47f2a",
    source: "sn",
    curves: [
      [[0.09, -0.3, -0.1], [0.18, -0.18, -0.02], [0.27, -0.06, 0.08], [0.3, 0.0, 0.16]],
      [[0.09, -0.3, -0.1], [0.14, -0.12, 0.06], [0.16, 0.02, 0.22], [0.16, 0.08, 0.3]],
      [[0.09, -0.3, -0.1], [0.16, -0.06, -0.06], [0.19, 0.14, -0.04], [0.19, 0.17, 0.06]],
    ],
  },
  lcProj: {
    color: "#2fa3a8",
    source: "lc",
    curves: [
      [[0.05, -0.5, -0.3], [0.07, -0.25, -0.22], [0.1, -0.02, -0.12], [0.16, 0.2, 0.2], [0.28, 0.4, 0.58]],
      [[0.05, -0.5, -0.3], [0.08, -0.22, -0.28], [0.18, 0.12, -0.32], [0.34, 0.5, -0.36]],
      [[0.05, -0.5, -0.3], [0.1, -0.3, -0.18], [0.14, -0.06, -0.15], [0.12, -0.04, -0.14]],
      [[0.05, -0.5, -0.3], [0.16, -0.48, -0.44], [0.3, -0.44, -0.6]],
      [[0.05, -0.5, -0.3], [0.1, -0.2, -0.46], [0.22, 0.1, -0.7], [0.26, 0.18, -0.86]],
      [[0.05, -0.5, -0.3], [0.2, -0.32, -0.08], [0.4, -0.3, 0.12], [0.52, -0.22, 0.2]],
    ],
  },
  rapheProj: {
    color: "#6b8be0",
    source: "raphe",
    curves: [
      [[0, -0.36, -0.2], [0.06, -0.14, -0.06], [0.12, 0.1, 0.24], [0.2, 0.34, 0.6]],
      [[0, -0.36, -0.2], [0.08, -0.12, -0.02], [0.2, -0.04, 0.1], [0.28, -0.04, 0.12]],
      [[0, -0.5, -0.26], [0.1, -0.3, -0.34], [0.22, 0.04, -0.46], [0.32, 0.42, -0.42]],
      [[0, -0.66, -0.3], [0.12, -0.56, -0.44], [0.3, -0.44, -0.62]],
      [[0, -0.36, -0.2], [0.18, -0.3, 0.02], [0.4, -0.3, 0.18], [0.5, -0.22, 0.3]],
      [[0, -0.5, -0.26], [0.1, -0.2, -0.5], [0.2, 0.12, -0.78]],
    ],
  },
};

export function mirrorCurves(curves: V3[][]): CatmullRomCurve3[] {
  const out: CatmullRomCurve3[] = [];
  for (const pts of curves) {
    out.push(new CatmullRomCurve3(pts.map((p) => new Vector3(p[0], p[1], p[2]))));
    out.push(new CatmullRomCurve3(pts.map((p) => new Vector3(-p[0], p[1], p[2]))));
  }
  return out;
}

export const ANCHORS: Record<string, V3> = {
  cortex: [0.5, 0.62, 0.0],
  pfc: [0.32, 0.3, 0.86],
  dlpfc: [0.5, 0.36, 0.5],
  ofc: [0.22, -0.12, 0.8],
  ifg: [0.6, -0.02, 0.44],
  dmn: [0.42, 0.45, -0.6],
  parietal: [0.42, 0.55, -0.45],
  acc: [0.05, 0.56, 0.05],
  caudate: [0.18, 0.16, 0.22],
  putamen: [0.34, 0.1, -0.02],
  nacc: [0.12, -0.14, 0.3],
  thalamus: [0.1, -0.04, -0.14],
  cerebellum: [0.5, -0.44, -0.6],
  vermis: [0, -0.4, -0.98],
  vta: [0, -0.3, -0.1],
  sn: [0.09, -0.3, -0.1],
  lc: [0.05, -0.5, -0.3],
  raphe: [0, -0.52, -0.26],
  mesocortical: [0.16, 0.12, 0.44],
  mesolimbic: [0.1, -0.2, 0.2],
  nigrostriatal: [0.2, -0.1, 0.06],
  lcProj: [0.2, 0.12, -0.34],
  rapheProj: [0.22, 0.04, -0.46],
};

export const CORTEX_SET = new Set<string>(CORTEX_REGIONS);
export const CEREBELLUM_SET = new Set<string>(CEREBELLUM_REGIONS);
