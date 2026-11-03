import { useCallback, useState } from "react";

// Every modal in the app. Only one is open at a time.
export type OverlayId = "about" | "gallery" | "comparison" | "shortcuts";

export function useOverlays() {
  const [active, setActive] = useState<OverlayId | null>(null);
  const open = useCallback((id: OverlayId) => setActive(id), []);
  const close = useCallback(() => setActive(null), []);
  const isOpen = useCallback((id: OverlayId) => active === id, [active]);
  return { active, open, close, isOpen };
}
