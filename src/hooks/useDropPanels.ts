import { useEffect, type RefObject } from "react";

/**
 * Turns every `.panel` inside the container into a dropdown: the panel's
 * `.panel-heading` becomes a toggle and the rest of the panel is hidden until
 * opened. State lives in a `data-open` attribute so React re-renders keep it.
 */
export function useDropPanels(ref: RefObject<HTMLElement | null>) {
  // Make headings keyboard-accessible toggles (runs after every render so new panels are covered).
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>(".panel").forEach((panel) => {
      const heading = panel.querySelector<HTMLElement>(":scope > .panel-heading");
      if (!heading) return;
      heading.setAttribute("role", "button");
      heading.setAttribute("tabindex", "0");
      heading.setAttribute("aria-expanded", panel.hasAttribute("data-open") ? "true" : "false");
    });
  });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const toggle = (heading: HTMLElement) => {
      const panel = heading.closest<HTMLElement>(".panel");
      if (!panel) return;
      const open = !panel.hasAttribute("data-open");
      if (open) panel.setAttribute("data-open", "");
      else panel.removeAttribute("data-open");
      heading.setAttribute("aria-expanded", String(open));
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const heading = target.closest<HTMLElement>(".panel-heading");
      if (!heading || !root.contains(heading)) return;
      // Buttons inside the heading (like "Show all") keep their own behaviour
      if (target.closest("button")) return;
      toggle(heading);
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList?.contains("panel-heading") || !root.contains(target)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(target);
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    };
  }, [ref]);
}

/** Open a dropdown panel inside the container by CSS selector. */
export function openDropPanel(root: HTMLElement | null, selector: string) {
  const panel = root?.querySelector<HTMLElement>(selector);
  if (!panel || panel.hasAttribute("data-open")) return;
  panel.setAttribute("data-open", "");
  panel.querySelector(":scope > .panel-heading")?.setAttribute("aria-expanded", "true");
}
