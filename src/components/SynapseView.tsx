import { useEffect, useRef } from "react";
import { NEURO_INFO, type BrainState, type NeuroKey } from "../data/cells";

export type SynapseStats = { signal: number; cleft: number; reuptake: number; released: number };

type Props = {
  neuro: NeuroKey;
  state: BrainState;
  highlight?: string | null; // "vesicles" | "cleft" | "receptors" | "transporters"
  compact?: boolean;
  onStats?: (stats: SynapseStats) => void;
};

type Molecule = { x: number; y: number; vx: number; vy: number; life: number; capturedBy: number; boundTo: number; used: boolean };
type Vesicle = { x: number; y: number; hx: number; hy: number; phase: "rest" | "dock" | "fuse"; t: number; tx: number };
type Receptor = { x: number; bound: number; glow: number };
type Transporter = { x: number; blocked: boolean; flash: number };

// Illustrative parameters — tuned to show the direction of ADHD differences,
// not to reproduce measured quantities.
function params(neuro: NeuroKey, state: BrainState) {
  // Typical: plenty of chemical, few recyclers, receivers catch it easily.
  const typical = { releaseEvery: 0.7, perVesicle: 16, receptors: 7, transporters: 4, blockFrac: 0, bindP: 0.65, captureP: 0.04 };
  if (state === "typical") return typical;
  // ADHD: less chemical per message, extra-busy recyclers, fewer receivers.
  if (neuro === "serotonin") {
    // serotonin's role in ADHD is smaller, so the difference is milder
    return { ...typical, releaseEvery: 0.9, perVesicle: 12, receptors: 6, transporters: 6, captureP: 0.07, bindP: 0.55 };
  }
  return { ...typical, releaseEvery: 1.3, perVesicle: 8, receptors: 5, transporters: 8, captureP: 0.14, bindP: 0.45 };
}

export function SynapseView({ neuro, state, highlight = null, compact = false, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ neuro, state, highlight, onStats });
  propsRef.current = { neuro, state, highlight, onStats };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0, dpr = 1;
    let raf = 0;
    let last = performance.now();
    let releaseClock = 0;
    let statClock = 0;
    let molecules: Molecule[] = [];
    let vesicles: Vesicle[] = [];
    let receptors: Receptor[] = [];
    let transporters: Transporter[] = [];
    let configKey = "";
    let boundEma = 0, cleftEma = 0, reuptakeEma = 0, reuptakeCount = 0, releasedCount = 0;

    const geom = () => ({
      preY: H * 0.42,
      postY: H * 0.6,
      left: W * 0.14,
      right: W * 0.86,
    });

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(200, rect.width);
      H = Math.max(160, rect.height);
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      configKey = "";
    }

    function configure() {
      const { neuro: n, state: s } = propsRef.current;
      const key = `${n}:${s}:${W}:${H}`;
      if (key === configKey) return;
      configKey = key;
      const p = params(n, s);
      const g = geom();
      const span = g.right - g.left;
      receptors = Array.from({ length: p.receptors }, (_, i) => ({
        x: g.left + span * (0.18 + (0.64 * (i + 0.5)) / p.receptors),
        bound: 0,
        glow: 0,
      }));
      const tCount = p.transporters;
      transporters = Array.from({ length: tCount }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const k = Math.floor(i / 2);
        return {
          x: W / 2 + side * span * (0.36 - k * 0.07) + (side > 0 ? 0 : 0),
          blocked: (i + 0.5) / tCount < p.blockFrac,
          flash: 0,
        };
      });
      if (vesicles.length === 0) {
        vesicles = Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const hx = W / 2 + Math.cos(a) * W * 0.17;
          const hy = H * 0.24 + Math.sin(a) * H * 0.08;
          return { x: hx, y: hy, hx, hy, phase: "rest" as const, t: Math.random(), tx: hx };
        });
      } else {
        for (const v of vesicles) {
          v.hx = Math.min(Math.max(v.hx, W * 0.3), W * 0.7);
        }
      }
      molecules = molecules.filter((m) => m.boundTo < 0);
    }

    function release() {
      const p = params(propsRef.current.neuro, propsRef.current.state);
      const free = vesicles.filter((v) => v.phase === "rest");
      if (!free.length) return;
      const v = free[Math.floor(Math.random() * free.length)];
      v.phase = "dock";
      v.t = 0;
      v.tx = W / 2 + (Math.random() - 0.5) * W * 0.32;
      void p;
    }

    function burst(v: Vesicle) {
      const p = params(propsRef.current.neuro, propsRef.current.state);
      const g = geom();
      for (let i = 0; i < p.perVesicle; i += 1) {
        molecules.push({
          x: v.tx + (Math.random() - 0.5) * 10,
          y: g.preY + 4,
          vx: (Math.random() - 0.5) * 60,
          vy: 30 + Math.random() * 60,
          life: 1,
          capturedBy: -1,
          boundTo: -1,
          used: false,
        });
      }
      releasedCount += p.perVesicle;
    }

    function step(dt: number) {
      configure();
      const { neuro: n, state: s } = propsRef.current;
      const p = params(n, s);
      const g = geom();
      releaseClock += dt;
      if (releaseClock > p.releaseEvery * (0.7 + Math.random() * 0.6)) {
        releaseClock = 0;
        release();
      }
      for (const v of vesicles) {
        v.t += dt;
        if (v.phase === "rest") {
          v.x += (v.hx + Math.sin(v.t * 1.3 + v.hy) * 4 - v.x) * Math.min(1, dt * 3);
          v.y += (v.hy + Math.cos(v.t * 1.1 + v.hx) * 3 - v.y) * Math.min(1, dt * 3);
        } else if (v.phase === "dock") {
          v.x += (v.tx - v.x) * Math.min(1, dt * 6);
          v.y += (g.preY - 10 - v.y) * Math.min(1, dt * 6);
          if (v.t > 0.35) {
            v.phase = "fuse";
            v.t = 0;
            burst(v);
          }
        } else if (v.t > 0.9) {
          v.phase = "rest";
          v.x = v.hx;
          v.y = v.hy - 20;
        }
      }
      for (const r of receptors) {
        r.glow = Math.max(0, r.glow - dt * 1.6);
        if (r.bound > 0) {
          r.bound -= dt;
          r.glow = Math.min(1, r.glow + dt * 5);
        }
      }
      for (const t of transporters) t.flash = Math.max(0, t.flash - dt * 3);

      const survivors: Molecule[] = [];
      for (const m of molecules) {
        if (m.boundTo >= 0) {
          const r = receptors[m.boundTo];
          if (!r || r.bound <= 0) {
            m.boundTo = -1;
            m.used = true;
            m.vy = -40;
            m.vx = (Math.random() - 0.5) * 60;
            if (Math.random() < 0.35) continue; // broken down by enzymes
          } else {
            m.x += (r.x - m.x) * Math.min(1, dt * 12);
            m.y += (g.postY - 8 - m.y) * Math.min(1, dt * 12);
            survivors.push(m);
            continue;
          }
        }
        if (m.capturedBy >= 0) {
          const t = transporters[m.capturedBy];
          if (!t) continue;
          m.x += (t.x - m.x) * Math.min(1, dt * 10);
          m.y += (g.preY - 18 - m.y) * Math.min(1, dt * 8);
          m.life -= dt * 3;
          if (m.life <= 0) continue;
          survivors.push(m);
          continue;
        }
        m.vx += (Math.random() - 0.5) * 420 * dt;
        m.vy += (Math.random() - 0.5) * 420 * dt;
        // the chemical spreads out across the gap toward the receiving cell
        if (m.used && transporters.length) {
          let near = transporters[0].x;
          for (const t of transporters) if (Math.abs(t.x - m.x) < Math.abs(near - m.x)) near = t.x;
          m.vx += (near - m.x) * 1.2 * dt;
        }
        // after delivering its message it drifts back toward the recyclers
        m.vy += (g.postY - g.preY) * (m.used ? -1.1 : 0.7) * dt;
        m.vx *= 1 - dt * 1.4;
        m.vy *= 1 - dt * 1.4;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < g.preY + 3) { m.y = g.preY + 3; m.vy = Math.abs(m.vy); }
        if (m.y > g.postY - 3) { m.y = g.postY - 3; m.vy = -Math.abs(m.vy); }
        // diffuse away out of the synapse
        if (m.x < g.left || m.x > g.right) m.life -= dt * 2;
        if (m.life <= 0) continue;

        let done = false;
        for (let i = 0; i < receptors.length && !done; i += 1) {
          const r = receptors[i];
          if (r.bound <= 0 && Math.abs(m.x - r.x) < 13 && m.y > g.postY - 16 && Math.random() < p.bindP) {
            r.bound = 0.55 + Math.random() * 0.45;
            m.boundTo = i;
            done = true;
          }
        }
        for (let i = 0; i < transporters.length && !done; i += 1) {
          const t = transporters[i];
          if (!t.blocked && Math.abs(m.x - t.x) < 16 && m.y < g.preY + 22 && Math.random() < p.captureP * 4) {
            m.capturedBy = i;
            t.flash = 1;
            reuptakeCount += 1;
            done = true;
          }
        }
        survivors.push(m);
      }
      molecules = survivors;

      const bound = receptors.filter((r) => r.bound > 0).length;
      // signal is relative to the typical receptor count so fewer receptors read as weaker
      boundEma += ((bound / 7) * 100 - boundEma) * Math.min(1, dt * 1.5);
      const free = molecules.filter((m) => m.boundTo < 0 && m.capturedBy < 0).length;
      cleftEma += (free - cleftEma) * Math.min(1, dt * 1.5);
      statClock += dt;
      if (statClock > 0.5) {
        reuptakeEma += (reuptakeCount / statClock - reuptakeEma) * 0.35;
        reuptakeCount = 0;
        statClock = 0;
        propsRef.current.onStats?.({
          signal: Math.round(Math.min(100, boundEma * 1.6)),
          cleft: Math.round(cleftEma),
          reuptake: Math.round(reuptakeEma * 10) / 10,
          released: releasedCount,
        });
      }
    }

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.arcTo(x + w, y, x + w, y + h, r);
      ctx!.arcTo(x + w, y + h, x, y + h, r);
      ctx!.arcTo(x, y + h, x, y, r);
      ctx!.arcTo(x, y, x + w, y, r);
      ctx!.closePath();
    }

    function draw() {
      const c = ctx!;
      const { neuro: n, highlight: hl } = propsRef.current;
      const info = NEURO_INFO[n];
      const g = geom();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const font = compact ? 10 : 12;

      // presynaptic terminal
      const preGrad = c.createLinearGradient(0, 0, 0, g.preY);
      preGrad.addColorStop(0, "#f6e4e8");
      preGrad.addColorStop(1, "#ecc9d2");
      c.beginPath();
      c.moveTo(W * 0.4, -2);
      c.bezierCurveTo(W * 0.38, H * 0.12, W * 0.12, H * 0.12, g.left, g.preY - 18);
      c.quadraticCurveTo(g.left + 4, g.preY, g.left + 24, g.preY);
      c.lineTo(g.right - 24, g.preY);
      c.quadraticCurveTo(g.right - 4, g.preY, g.right, g.preY - 18);
      c.bezierCurveTo(W * 0.88, H * 0.12, W * 0.62, H * 0.12, W * 0.6, -2);
      c.closePath();
      c.fillStyle = preGrad;
      c.fill();
      c.strokeStyle = "#c697a6";
      c.lineWidth = 2;
      c.stroke();

      // postsynaptic spine
      const bound = receptors.reduce((a, r) => a + r.glow, 0) / 7;
      const postGrad = c.createLinearGradient(0, g.postY, 0, H);
      postGrad.addColorStop(0, "#e9e4f6");
      postGrad.addColorStop(1, "#d8d0ee");
      c.beginPath();
      c.moveTo(W * 0.43, H + 2);
      c.bezierCurveTo(W * 0.44, H * 0.85, W * 0.16, H * 0.82, g.left + 6, g.postY + 18);
      c.quadraticCurveTo(g.left + 8, g.postY, g.left + 28, g.postY);
      c.lineTo(g.right - 28, g.postY);
      c.quadraticCurveTo(g.right - 8, g.postY, g.right - 6, g.postY + 18);
      c.bezierCurveTo(W * 0.84, H * 0.82, W * 0.56, H * 0.85, W * 0.57, H + 2);
      c.closePath();
      c.fillStyle = postGrad;
      c.fill();
      c.strokeStyle = "#a99ccf";
      c.stroke();
      // postsynaptic response glow
      if (bound > 0.01) {
        const rg = c.createRadialGradient(W / 2, g.postY + 30, 4, W / 2, g.postY + 30, W * 0.32);
        rg.addColorStop(0, `rgba(255, 200, 90, ${Math.min(0.9, bound * 1.6)})`);
        rg.addColorStop(1, "rgba(255, 214, 120, 0)");
        c.fillStyle = rg;
        c.fillRect(g.left, g.postY, g.right - g.left, H - g.postY);
      }

      // highlight outline for the selected part
      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = info.color;
      c.lineWidth = 2;
      if (hl === "cleft") {
        roundRect(g.left - 4, g.preY + 2, g.right - g.left + 8, g.postY - g.preY - 4, 8);
        c.stroke();
      } else if (hl === "vesicles") {
        c.beginPath();
        c.ellipse(W / 2, H * 0.24, W * 0.23, H * 0.13, 0, 0, Math.PI * 2);
        c.stroke();
      } else if (hl === "receptors") {
        roundRect(receptors[0].x - 16, g.postY - 6, receptors[receptors.length - 1].x - receptors[0].x + 32, 22, 8);
        c.stroke();
      } else if (hl === "transporters") {
        for (const t of transporters) {
          roundRect(t.x - 13, g.preY - 18, 26, 26, 6);
          c.stroke();
        }
      }
      c.restore();

      // vesicles
      for (const v of vesicles) {
        let r = Math.min(W, H) * (compact ? 0.05 : 0.045);
        let a = 1;
        if (v.phase === "fuse") {
          r *= 1 - Math.min(1, v.t / 0.5) * 0.6;
          a = 1 - Math.min(1, v.t / 0.6);
        }
        c.globalAlpha = a;
        c.beginPath();
        c.arc(v.x, v.y, r, 0, Math.PI * 2);
        c.fillStyle = "rgba(255,255,255,0.75)";
        c.fill();
        c.strokeStyle = "#b8a4c8";
        c.lineWidth = 1.4;
        c.stroke();
        c.fillStyle = info.color;
        for (let k = 0; k < 5; k += 1) {
          const ang = k * 1.256 + v.hx;
          c.beginPath();
          c.arc(v.x + Math.cos(ang) * r * 0.45, v.y + Math.sin(ang) * r * 0.45, Math.max(1.5, r * 0.17), 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
      }

      // transporters (on presynaptic membrane)
      for (const t of transporters) {
        c.fillStyle = t.flash > 0 ? info.color : "#8e6aa8";
        roundRect(t.x - 7, g.preY - 12, 14, 16, 4);
        c.fill();
        c.fillStyle = "#f6e4e8";
        c.fillRect(t.x - 2, g.preY - 12, 4, 16);
        if (t.blocked) {
          c.fillStyle = "#4f7bd8";
          c.beginPath();
          c.ellipse(t.x, g.preY + 6, 7, 4, 0, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(t.x, g.preY + 2);
          c.lineTo(t.x, g.preY + 10);
          c.stroke();
        }
      }

      // receptors (on postsynaptic membrane)
      for (const r of receptors) {
        c.strokeStyle = r.glow > 0.05 ? info.color : "#7b6db8";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(r.x, g.postY + 8);
        c.lineTo(r.x, g.postY - 2);
        c.moveTo(r.x - 6, g.postY - 9);
        c.lineTo(r.x, g.postY - 2);
        c.lineTo(r.x + 6, g.postY - 9);
        c.stroke();
        if (r.glow > 0.05) {
          c.fillStyle = `rgba(255, 210, 110, ${r.glow * 0.6})`;
          c.beginPath();
          c.arc(r.x, g.postY + 2, 10 * r.glow + 4, 0, Math.PI * 2);
          c.fill();
        }
      }

      // molecules
      for (const m of molecules) {
        c.globalAlpha = Math.max(0, Math.min(1, m.life));
        c.fillStyle = info.color;
        c.beginPath();
        c.arc(m.x, m.y, compact ? 2.6 : 3.2, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "rgba(255,255,255,0.85)";
        c.lineWidth = 1;
        c.stroke();
      }
      c.globalAlpha = 1;

      // headline: how well the message is getting through
      {
        const { state: st } = propsRef.current;
        const strongMsg = st === "typical";
        const text = strongMsg ? "Strong message getting through" : "Weak message: less gets through";
        c.font = `700 ${compact ? 11 : 13}px Inter, system-ui, sans-serif`;
        const tw = c.measureText(text).width;
        const bx = W - tw - (compact ? 30 : 40);
        const by = compact ? 8 : 12;
        roundRect(bx, by, tw + (compact ? 22 : 28), compact ? 22 : 28, 14);
        c.fillStyle = strongMsg ? "rgba(63, 174, 106, 0.16)" : "rgba(224, 138, 46, 0.18)";
        c.fill();
        c.fillStyle = strongMsg ? "#2f7d4d" : "#a85a14";
        c.textAlign = "left";
        c.fillText(text, bx + (compact ? 11 : 14), by + (compact ? 15 : 19));
      }

      // labels
      c.font = `600 ${font}px Inter, system-ui, sans-serif`;
      c.fillStyle = "#6b5a66";
      c.textAlign = "left";
      c.fillText("Sending nerve cell", 10, font + 6);
      c.fillText("Receiving nerve cell", 10, H - 10);
      c.fillStyle = "#8a7f92";
      c.textAlign = "right";
      c.fillText("The gap", W - 10, (g.preY + g.postY) / 2 + 4);
      if (!compact) {
        c.textAlign = "left";
        c.fillStyle = hl === "transporters" ? info.color : "#8e6aa8";
        c.fillText(`Recyclers (${info.transporter})`, g.left - 2, g.preY - 24);
        c.fillStyle = hl === "receptors" ? info.color : "#7b6db8";
        c.textAlign = "right";
        c.fillText(`${info.receptor} receivers`, g.right + 2, g.postY + 28);
        c.textAlign = "left";
        c.fillStyle = info.color;
        c.fillText(`● ${info.name}`, 10, font * 2 + 12);
      }
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    layout();
    const ro = new ResizeObserver(() => layout());
    ro.observe(canvas);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [compact]);

  return <canvas ref={canvasRef} className={`synapse-canvas${compact ? " is-compact" : ""}`} />;
}
