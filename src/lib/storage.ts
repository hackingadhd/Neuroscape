import { cells } from "../data/cells";
import { STORAGE_KEYS } from "./storageKeys";

const cellExists = (id: string) => cells.some((c) => c.id === id);

export function loadLastCellId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.lastCell);
    if (id && cellExists(id)) return id;
  } catch {
    /* ignore */
  }
  return "neuro";
}

export function saveLastCellId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.lastCell, id);
  } catch {
    /* ignore */
  }
}
