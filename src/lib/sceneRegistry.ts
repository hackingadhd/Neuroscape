import type { Object3D } from "three";

// The stage's live 3D model, so the toolbar can export it as a GLB.
export const sceneRegistry: { model: Object3D | null } = { model: null };
