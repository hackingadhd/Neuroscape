import type { Object3D, Points } from "three";
import type { CellItem } from "../data/cells";
import { sceneRegistry } from "./sceneRegistry";

type Notify = (message: string) => void;

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function captureScreenshot(cell: CellItem, onToast: Notify): void {
  const canvas = document.querySelector<HTMLCanvasElement>(".canvas-wrap canvas");
  if (!canvas) {
    onToast("Stage not ready — try again.");
    return;
  }
  try {
    const url = canvas.toDataURL("image/png");
    triggerDownload(url, `${slugify(cell.name)}.png`);
    onToast(`Saved ${cell.name}.png`);
  } catch {
    onToast("Screenshot failed — canvas blocked.");
  }
}

export function toggleFullscreen(onToast: Notify): void {
  const el = document.querySelector<HTMLElement>(".canvas-wrap");
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen()
      .then(() => onToast("Fullscreen — press Esc to exit."))
      .catch(() => onToast("Fullscreen blocked by browser."));
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

export async function exportGlb(cell: CellItem, onToast: Notify): Promise<void> {
  const model = sceneRegistry.model;
  if (!model) {
    onToast("3D brain not ready — try again.");
    return;
  }
  onToast(`Preparing ${cell.name} model…`);
  try {
    const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    // Export solid meshes only (signal particles and labels are live-only).
    const clone = model.clone(true);
    const strip: Object3D[] = [];
    clone.traverse((node) => {
      if ((node as Points).isPoints) strip.push(node);
    });
    strip.forEach((node) => node.removeFromParent());
    const result = await new GLTFExporter().parseAsync(clone, { binary: true });
    const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, `${slugify(cell.name)}-brain.glb`);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    onToast(`Downloaded ${cell.name}-brain.glb`);
  } catch {
    onToast("Model export failed.");
  }
}
