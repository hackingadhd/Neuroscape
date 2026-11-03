import { useEffect } from "react";

export type ShortcutHandlers = {
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onToggleRotate: () => void;
  onGallery: () => void;
  onHelp: () => void;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

// Global shortcuts. Disabled while an overlay is open and while typing.
export function useKeyboardShortcuts(enabled: boolean, handlers: ShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, () => void> = {
        ArrowLeft: handlers.onPrev,
        ArrowRight: handlers.onNext,
        r: handlers.onReset,
        " ": handlers.onToggleRotate,
        g: handlers.onGallery,
        "?": handlers.onHelp,
      };
      const action = map[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, handlers]);
}
