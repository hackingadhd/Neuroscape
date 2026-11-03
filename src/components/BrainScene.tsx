import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Html, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  FrontSide,
  Group,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NormalBlending,
  Plane,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import type { BrainState, CellItem, ViewMode } from "../data/cells";
import {
  ANCHORS,
  CEREBELLUM_SET,
  CORTEX_SET,
  DEEP,
  PATHWAYS,
  getBrainSurfaces,
  mirrorCurves,
  type SurfacePart,
} from "../lib/brainGeometry";
import { sceneRegistry } from "../lib/sceneRegistry";

type BrainSceneProps = {
  cell: CellItem;
  activeOrganelle: string;
  viewMode: ViewMode;
  crossSection: boolean;
  autoRotate: boolean;
  resetKey: number;
  brainState?: BrainState;
  showLabel?: boolean;
  registerExport?: boolean;
  onPick?: (organelleId: string) => void;
  /** Overrides what is highlighted (used by the step-by-step journey). */
  override?: { target: string; name: string; color: string } | null;
};

type Uniforms = {
  uHlColor: { value: Color };
  uHlAmt: { value: number };
  uPulse: { value: number };
  uGhost: { value: number };
};

// ---- materials ---------------------------------------------------------

function makeSurfaceMaterial(): { material: MeshPhysicalMaterial; uniforms: Uniforms } {
  const uniforms: Uniforms = {
    uHlColor: { value: new Color("#c96b8f") },
    uHlAmt: { value: 0 },
    uPulse: { value: 0.8 },
    uGhost: { value: 0 },
  };
  const material = new MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    sheen: 0.4,
    sheenColor: new Color("#ffe8ee"),
    sheenRoughness: 0.6,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aHl;\nvarying float vHl;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHl = aHl;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uHlColor;\nuniform float uHlAmt;\nuniform float uPulse;\nuniform float uGhost;\nvarying float vHl;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float hl = clamp(vHl * uHlAmt, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.92, 0.95), 0.55 * uGhost);
        diffuseColor.rgb = mix(diffuseColor.rgb, uHlColor * (0.8 + 0.3 * uPulse) * (0.75 + 0.25 * diffuseColor.r), hl * 0.9);
        if (!gl_FrontFacing) diffuseColor.rgb *= 0.7;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uHlColor * hl * uPulse * 0.4;",
      );
  };
  material.customProgramCacheKey = () => "brain-surface";
  return { material, uniforms };
}

function stateParams(state: BrainState) {
  if (state === "adhd") return { glow: 0.3, strength: 0.5 };
  return { glow: 1, strength: 1 };
}

// ---- surfaces ----------------------------------------------------------

function Surface({
  part,
  highlight,
  color,
  opacity,
  crossSection,
  clipPlane,
  brainState,
  onPickVertex,
}: {
  part: SurfacePart;
  highlight: string | null;
  color: string;
  opacity: number;
  crossSection: boolean;
  clipPlane: Plane;
  brainState: BrainState;
  onPickVertex?: (part: SurfacePart, vertex: number) => void;
}) {
  const { material, uniforms } = useMemo(makeSurfaceMaterial, []);
  const fade = useRef(0);

  useEffect(() => {
    const attr = part.geometry.getAttribute("aHl") as BufferAttribute;
    const src = highlight ? part.weights[highlight] : null;
    if (src) (attr.array as Float32Array).set(src);
    else (attr.array as Float32Array).fill(0);
    attr.needsUpdate = true;
    fade.current = 0;
    uniforms.uHlColor.value.set(color);
  }, [part, highlight, color, uniforms]);

  useEffect(() => {
    const ghost = opacity < 1;
    material.transparent = ghost;
    material.opacity = opacity;
    material.depthWrite = !ghost;
    material.side = crossSection && !ghost ? DoubleSide : FrontSide;
    material.clippingPlanes = crossSection ? [clipPlane] : [];
    material.needsUpdate = true;
    uniforms.uGhost.value = ghost ? 1 : 0;
  }, [material, uniforms, opacity, crossSection, clipPlane]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    fade.current = Math.min(1, fade.current + delta * 2.2);
    const p = stateParams(brainState);
    let pulse = p.glow + 0.22 * Math.sin(t * 2.4);
    if (brainState === "adhd") {
      // irregular, flickery activity — attention "drops out" now and then
      pulse += 0.18 * Math.sin(t * 7.3) * Math.sin(t * 1.3) - (Math.sin(t * 0.9) > 0.75 ? 0.3 : 0);
    }
    uniforms.uPulse.value = Math.max(0.05, pulse);
    uniforms.uHlAmt.value = highlight ? fade.current * p.strength : 0;
  });

  return (
    <mesh
      geometry={part.geometry}
      material={material}
      castShadow={opacity === 1}
      receiveShadow
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!onPickVertex || e.delta > 4 || !e.face) return;
        e.stopPropagation();
        onPickVertex(part, e.face.a);
      }}
    />
  );
}

function Brainstem({ opacity, crossSection, clipPlane }: { opacity: number; crossSection: boolean; clipPlane: Plane }) {
  const material = useMemo(
    () => new MeshPhysicalMaterial({ color: "#e6c3cc", roughness: 0.5, clearcoat: 0.3, sheen: 0.3 }),
    [],
  );
  const stem = useMemo(() => new CylinderGeometry(0.12, 0.085, 0.9, 48, 8), []);
  const pons = useMemo(() => new SphereGeometry(1, 48, 32), []);
  useEffect(() => {
    material.transparent = opacity < 1;
    material.opacity = opacity;
    material.depthWrite = opacity === 1;
    material.clippingPlanes = crossSection ? [clipPlane] : [];
    material.color.set(opacity < 1 ? "#f6e4ea" : "#e6c3cc");
    material.needsUpdate = true;
  }, [material, opacity, crossSection, clipPlane]);
  return (
    <group>
      <mesh geometry={stem} material={material} position={[0, -0.62, -0.28]} rotation={[-0.22, 0, 0]} castShadow />
      <mesh geometry={pons} material={material} position={[0, -0.5, -0.2]} scale={[0.15, 0.13, 0.13]} />
    </group>
  );
}

// ---- deep structures ----------------------------------------------------

function DeepStructure({
  id,
  active,
  dim,
  visible,
  onPick,
}: {
  id: string;
  active: boolean;
  dim: boolean;
  visible: boolean;
  onPick?: (id: string) => void;
}) {
  const spec = DEEP[id];
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: spec.color,
        roughness: 0.42,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        emissive: new Color(spec.color),
        emissiveIntensity: 0,
      }),
    [spec.color],
  );
  const geometries = useMemo(() => {
    const out: Array<{ geometry: BufferGeometry; position: Vector3; scale: Vector3 }> = [];
    const sphere = new SphereGeometry(1, 40, 28);
    for (const part of spec.parts) {
      const mirrors = part.mirror ? [1, -1] : [1];
      for (const m of mirrors) {
        if (part.kind === "ellipsoid") {
          out.push({
            geometry: sphere,
            position: new Vector3(part.center[0] * m, part.center[1], part.center[2]),
            scale: new Vector3(...part.scale),
          });
        } else {
          const curve = new CatmullRomCurve3(part.points.map((p) => new Vector3(p[0] * m, p[1], p[2])));
          out.push({ geometry: new TubeGeometry(curve, 64, part.radius, 14, false), position: new Vector3(), scale: new Vector3(1, 1, 1) });
        }
      }
    }
    return out;
  }, [spec]);

  useEffect(() => {
    material.transparent = dim;
    material.opacity = dim ? 0.12 : 1;
    material.depthWrite = !dim;
    material.needsUpdate = true;
  }, [material, dim]);

  useFrame(({ clock }) => {
    material.emissiveIntensity = active ? 0.45 + 0.3 * Math.sin(clock.elapsedTime * 3) : 0.04;
  });

  if (!visible) return null;
  return (
    <group>
      {geometries.map((g, i) => (
        <mesh
          key={i}
          geometry={g.geometry}
          material={material}
          position={g.position}
          scale={g.scale}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (!onPick || e.delta > 4) return;
            e.stopPropagation();
            onPick(id);
          }}
        />
      ))}
    </group>
  );
}

// ---- pathways with live signal particles --------------------------------
//
// Typical: lots of bright dots, nearly all reach the end and make the target glow.
// ADHD: about half as many dots, slower and patchier; many turn grey and fade out
// before arriving, so the targets light up far less.

const PER_CURVE = 16;

const pointsVertex = `
attribute float aAlpha;
attribute float aSize;
attribute float aGrey;
varying float vAlpha;
varying float vGrey;
uniform float uScale;
uniform float uSize;
void main() {
  vAlpha = aAlpha;
  vGrey = aGrey;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const pointsFragment = `
uniform vec3 uColor;
varying float vAlpha;
varying float vGrey;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.1, d);
  float rim = smoothstep(0.5, 0.35, d);
  vec3 base = mix(uColor, vec3(0.62, 0.6, 0.6), vGrey);
  vec3 col = mix(base * 0.75, mix(base, vec3(1.0), 0.45), core);
  gl_FragColor = vec4(col, rim * vAlpha);
}`;

const glowFragment = `
uniform vec3 uColor;
varying float vAlpha;
varying float vGrey;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float halo = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.35 * halo), halo * halo * vAlpha);
}`;

const PATH_STATE = {
  typical: { share: 1, fizzle: 0.03, speed: 1, tube: 0.9, dot: 1.25, glow: 1, glowSize: 1.6 },
  adhd: { share: 0.4, fizzle: 0.65, speed: 0.65, tube: 0.14, dot: 0.8, glow: 0.3, glowSize: 0.6 },
} as const;

function Pathway({
  id,
  active,
  brainState,
}: {
  id: string;
  active: boolean;
  brainState: BrainState;
}) {
  const spec = PATHWAYS[id];
  const curves = useMemo<CatmullRomCurve3[]>(() => mirrorCurves(spec.curves), [spec]);
  const tubes = useMemo(() => curves.map((c) => new TubeGeometry(c, 48, 0.0065, 8, false)), [curves]);
  const tubeMaterial = useMemo(
    () => new MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.4, depthWrite: false }),
    [spec.color],
  );
  const { size } = useThree();
  const count = curves.length * PER_CURVE;

  const sim = useMemo(() => {
    const curve = new Uint16Array(count);
    const t = new Float32Array(count);
    const speed = new Float32Array(count);
    const fizzleAt = new Float32Array(count);
    const fade = new Float32Array(count);
    const rank = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      curve[i] = i % curves.length;
      t[i] = Math.random();
      speed[i] = 0.16 + Math.random() * 0.12;
      fizzleAt[i] = -1;
      fade[i] = 1;
      rank[i] = Math.random(); // decides which dots exist when signals are sparse
    }
    return { curve, t, speed, fizzleAt, fade, rank, glow: new Float32Array(curves.length) };
  }, [count, curves.length]);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aGrey", new BufferAttribute(new Float32Array(count), 1));
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) sizes[i] = 0.042 + Math.random() * 0.028;
    g.setAttribute("aSize", new BufferAttribute(sizes, 1));
    return g;
  }, [count]);

  // One glow at the end of each route that flares when a signal arrives
  const glowGeometry = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(curves.length * 3);
    const v = new Vector3();
    curves.forEach((c, i) => {
      c.getPointAt(1, v);
      pos.set([v.x, v.y, v.z], i * 3);
    });
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(curves.length), 1));
    g.setAttribute("aGrey", new BufferAttribute(new Float32Array(curves.length), 1));
    g.setAttribute("aSize", new BufferAttribute(new Float32Array(curves.length).fill(0.32), 1));
    return g;
  }, [curves]);

  const pointsMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: new Color(spec.color) }, uScale: { value: 600 }, uSize: { value: 1 } },
        vertexShader: pointsVertex,
        fragmentShader: pointsFragment,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
      }),
    [spec.color],
  );

  const glowMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: new Color(spec.color) }, uScale: { value: 600 }, uSize: { value: 1 } },
        vertexShader: pointsVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
      }),
    [spec.color],
  );

  const ps = PATH_STATE[brainState];

  useEffect(() => {
    tubeMaterial.opacity = ps.tube * (active ? 1 : 0.6);
  }, [active, tubeMaterial, ps.tube]);

  const tmp = useMemo(() => new Vector3(), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const serotonin = id === "rapheProj";
    // serotonin's role in ADHD is smaller, so its difference is milder
    const fizzleChance = serotonin && brainState === "adhd" ? 0.3 : ps.fizzle;
    const share = serotonin && brainState === "adhd" ? 0.7 : ps.share;
    const scale = size.height * 1.15 * Math.min(window.devicePixelRatio, 2);
    pointsMaterial.uniforms.uScale.value = scale;
    glowMaterial.uniforms.uScale.value = scale;
    pointsMaterial.uniforms.uSize.value = ps.dot;
    glowMaterial.uniforms.uSize.value = ps.glowSize;
    const pos = geometry.getAttribute("position") as BufferAttribute;
    const alpha = geometry.getAttribute("aAlpha") as BufferAttribute;
    const grey = geometry.getAttribute("aGrey") as BufferAttribute;
    for (let i = 0; i < count; i += 1) {
      const exists = sim.rank[i] < share;
      const jitter = brainState === "adhd" ? 0.55 + Math.random() * 0.9 : 1;
      sim.t[i] += sim.speed[i] * delta * ps.speed * jitter;
      const fizzling = sim.fizzleAt[i] > 0 && sim.t[i] > sim.fizzleAt[i];
      if (fizzling) sim.fade[i] -= delta * 2.2; // signal lost before reaching its target
      if (sim.t[i] >= 1 || sim.fade[i] <= 0) {
        if (sim.t[i] >= 1 && exists && sim.fizzleAt[i] < 0) sim.glow[sim.curve[i]] = 1; // arrived!
        sim.t[i] = 0;
        sim.fade[i] = 1;
        sim.fizzleAt[i] = Math.random() < fizzleChance ? 0.2 + Math.random() * 0.55 : -1;
      }
      curves[sim.curve[i]].getPointAt(Math.min(sim.t[i], 1), tmp);
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
      const ends = Math.min(1, sim.t[i] * 8) * Math.min(1, (1 - sim.t[i]) * 6);
      alpha.setX(i, exists ? Math.max(0, ends * sim.fade[i]) * (active ? 1 : 0.8) : 0);
      grey.setX(i, fizzling ? Math.min(1, (1 - sim.fade[i]) * 2 + 0.4) : 0);
    }
    pos.needsUpdate = true;
    alpha.needsUpdate = true;
    grey.needsUpdate = true;

    const galpha = glowGeometry.getAttribute("aAlpha") as BufferAttribute;
    for (let c = 0; c < curves.length; c += 1) {
      sim.glow[c] = Math.max(0, sim.glow[c] - delta * 1.6);
      galpha.setX(c, sim.glow[c] * 0.9 * ps.glow);
    }
    galpha.needsUpdate = true;
  });

  return (
    <group>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} material={tubeMaterial} renderOrder={2} />
      ))}
      <points geometry={glowGeometry} material={glowMaterial} renderOrder={3} frustumCulled={false} />
      <points geometry={geometry} material={pointsMaterial} renderOrder={4} frustumCulled={false} />
    </group>
  );
}

// ---- model --------------------------------------------------------------

const DEEP_IDS = Object.keys(DEEP);

function BrainModel({
  cell,
  activeOrganelle,
  viewMode,
  crossSection,
  autoRotate,
  brainState = "adhd",
  showLabel = true,
  registerExport = true,
  onPick,
  override = null,
}: Omit<BrainSceneProps, "resetKey">) {
  const group = useRef<Group>(null);
  const flip = useRef<Group>(null);
  const exportRoot = useRef<Group>(null);
  const surfaces = useMemo(getBrainSurfaces, []);
  const selected = cell.organelles.find((o) => o.id === activeOrganelle) ?? cell.organelles[0];
  const organelle = override ?? { target: selected.target as string, name: selected.name, color: selected.color };
  const target: string = organelle.target;
  const isSynapse = target.startsWith("synapse:");
  const cortexTarget = CORTEX_SET.has(target) ? target : null;
  const cerebTarget = CEREBELLUM_SET.has(target) ? target : null;
  const deepTarget = DEEP[target] ? target : null;
  const pathTarget = PATHWAYS[target] ? target : null;
  const neurochem = ["neuro", "dopamine", "norepinephrine", "serotonin", "areas"].includes(cell.id);
  const needsInside = Boolean(deepTarget || pathTarget || isSynapse || neurochem);
  const shellOpacity = viewMode === "focus" ? 0.1 : needsInside && !crossSection ? 0.24 : 1;

  const pathways = useMemo(() => {
    const set = new Set<string>(cell.pathways);
    if (pathTarget) set.add(pathTarget);
    return [...set];
  }, [cell.pathways, pathTarget]);

  // nuclei that are the source of a visible pathway stay visible
  const pathSources = new Set(pathways.map((p) => PATHWAYS[p]?.source));

  const clipPlane = useMemo(() => new Plane(new Vector3(0, 0, -1), 0.05), []);
  const localPlane = useMemo(() => new Plane(new Vector3(0, 0, -1), 0.05), []);
  const pop = useRef(1);

  useEffect(() => {
    pop.current = 0;
  }, [cell.id]);

  useLayoutEffect(() => {
    if (registerExport) sceneRegistry.model = exportRoot.current;
    return () => {
      if (registerExport && sceneRegistry.model === exportRoot.current) sceneRegistry.model = null;
    };
  }, [registerExport]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (autoRotate) g.rotation.y += delta * 0.12;
    // "flip" transition when switching topics: a quick spin that settles back
    if (pop.current < 1 && flip.current) {
      pop.current = Math.min(1, pop.current + delta * 1.6);
      const e = 1 - Math.pow(1 - pop.current, 3);
      flip.current.scale.setScalar(0.86 + 0.14 * e);
      flip.current.rotation.y = (1 - e) * 1.4;
    }
    g.updateMatrixWorld();
    clipPlane.copy(localPlane).applyMatrix4(g.matrixWorld);
  });

  const pickCortex = (part: SurfacePart, vertex: number) => {
    if (!onPick) return;
    let best: string | null = null;
    let bestW = 0.35;
    for (const o of cell.organelles) {
      const w = part.weights[o.target]?.[vertex] ?? 0;
      if (w > bestW && o.target !== "cortex") {
        best = o.id;
        bestW = w;
      }
    }
    if (best) onPick(best);
  };

  const pickDeep = (id: string) => {
    if (!onPick) return;
    const match = cell.organelles.find((o) => o.target === id);
    if (match) onPick(match.id);
  };

  const anchor = ANCHORS[target];
  const showDeep = shellOpacity < 1 || crossSection;

  return (
    <group ref={group} position={[0, 0.12, 0]} rotation={[0, -0.62, 0]}>
      <group ref={flip}>
      <group ref={exportRoot} name="brain-gain-model" scale={1.32}>
        <Surface
          part={surfaces.left}
          highlight={cortexTarget}
          color={organelle.color}
          opacity={shellOpacity}
          crossSection={crossSection}
          clipPlane={clipPlane}
          brainState={brainState}
          onPickVertex={pickCortex}
        />
        <Surface
          part={surfaces.right}
          highlight={cortexTarget}
          color={organelle.color}
          opacity={shellOpacity}
          crossSection={crossSection}
          clipPlane={clipPlane}
          brainState={brainState}
          onPickVertex={pickCortex}
        />
        <Surface
          part={surfaces.cerebellum}
          highlight={cerebTarget}
          color={organelle.color}
          opacity={shellOpacity}
          crossSection={crossSection}
          clipPlane={clipPlane}
          brainState={brainState}
          onPickVertex={pickCortex}
        />
        <Brainstem opacity={shellOpacity} crossSection={crossSection} clipPlane={clipPlane} />
        {DEEP_IDS.map((id) => {
          const active = id === deepTarget || (isSynapse && pathSources.has(id));
          const relevant =
            active || pathSources.has(id) || cell.organelles.some((o) => o.target === id);
          return (
            <DeepStructure
              key={id}
              id={id}
              active={active}
              dim={viewMode === "focus" || deepTarget ? !active : !relevant}
              visible={showDeep && relevant}
              onPick={pickDeep}
            />
          );
        })}
        {showDeep &&
          pathways.map((p) => (
            <Pathway key={p} id={p} active={p === pathTarget || isSynapse} brainState={brainState} />
          ))}
        {showLabel && override && anchor && (
          <Html position={anchor} center zIndexRange={[20, 0]}>
            <div className="brain-label is-active" style={{ ["--dot" as string]: organelle.color }}>
              <i />
              {organelle.name}
            </div>
          </Html>
        )}
        {showLabel &&
          !override &&
          cell.organelles
            .filter((o) => ANCHORS[o.target])
            .map((o) => {
              const isActive = o.id === selected.id;
              return (
                <Html key={o.id} position={ANCHORS[o.target]} center zIndexRange={isActive ? [30, 21] : [20, 0]}>
                  <button
                    type="button"
                    className={`brain-label ${isActive ? "is-active" : ""}`}
                    style={{ ["--dot" as string]: o.color }}
                    onClick={() => onPick?.(o.id)}
                  >
                    <i />
                    {o.name}
                  </button>
                </Html>
              );
            })}
      </group>
      </group>
    </group>
  );
}

// Zoom out on tall, narrow canvases so the whole brain always fits the width.
function CameraFit() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    camera.zoom = Math.min(1.15, aspect * 1.25);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function ClippingEnabler() {
  const { gl } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  return null;
}

export function BrainScene({
  cell,
  activeOrganelle,
  viewMode,
  crossSection,
  autoRotate,
  resetKey,
  brainState = "adhd",
  showLabel = true,
  registerExport = true,
  onPick,
  override = null,
}: BrainSceneProps) {
  return (
    <Canvas
      key={resetKey}
      className="cell-canvas"
      dpr={[1, 2]}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{ position: [3.5, 1.15, 3.7], fov: 42 }}
    >
      <color attach="background" args={["#fbf9f3"]} />
      <ClippingEnabler />
      <CameraFit />
      <Suspense fallback={null}>
        <Environment preset="studio" background={false} environmentIntensity={0.55} />
      </Suspense>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#fff8ea", "#e9dccf", 0.6]} />
      <directionalLight position={[4.2, 5.2, 5.8]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0001} />
      <spotLight position={[-3.6, 3.2, 4.6]} angle={0.42} penumbra={0.74} intensity={0.8} color={cell.accentSoft} />
      <pointLight position={[2.8, -1.2, 3.2]} intensity={0.35} color={cell.accent} />
      <Float speed={1.25} rotationIntensity={0.06} floatIntensity={0.16}>
        <BrainModel
          cell={cell}
          activeOrganelle={activeOrganelle}
          viewMode={viewMode}
          crossSection={crossSection}
          autoRotate={autoRotate}
          brainState={brainState}
          showLabel={showLabel}
          registerExport={registerExport}
          onPick={onPick}
          override={override}
        />
      </Float>
      <ContactShadows position={[0, -1.2, 0]} opacity={0.2} scale={3.6} blur={2.8} far={2.6} resolution={512} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} enablePan={false} minDistance={3} maxDistance={8} />
    </Canvas>
  );
}

