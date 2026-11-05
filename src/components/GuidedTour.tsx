import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { openDropPanel } from "../hooks/useDropPanels";

type TourStep = {
  /** CSS selector of the thing being shown. Steps whose target isn't on screen are skipped. */
  target: string;
  title: string;
  text: string;
  /** Dropdown panel to open before this step, so the user sees what's inside. */
  open?: string;
};

const STEPS: TourStep[] = [
  {
    target: ".cell-panel",
    title: "Brain Map",
    text: "Start here. Pick a topic and the 3D brain changes to show it. Try clicking Dopamine.",
    open: ".cell-panel",
  },
  {
    target: ".signs-panel",
    title: "Main Signs of ADHD",
    text: "The main signs of ADHD and the chemicals behind each one. The coloured dots match the chemicals across the whole app.",
    open: ".signs-panel",
  },
  {
    target: ".journey-panel",
    title: "How the chemical travels",
    text: "Press Start, then use the arrows or the dots to follow the chemical step by step. Each step lights up on the brain.",
    open: ".journey-panel",
  },
  {
    target: ".organelle-panel",
    title: "Open and close sections",
    text: "Tap any section title to fold it open or shut. Open Parts Explained, then tap a part's name to highlight it on the brain.",
  },
  {
    target: ".stage-title",
    title: "Live notes",
    text: "What you're looking at, and what to watch for. These notes update as you change things.",
  },
  {
    target: ".canvas-wrap",
    title: "The 3D brain",
    text: "Drag to turn it, scroll or pinch to zoom, and click a part to learn about it.",
  },
  {
    target: ".view-card",
    title: "View Mode",
    text: "Switch between the 3D brain, the see-through brain, and a close-up of where two nerve cells meet. Cut Open slices the brain; Show Names labels the parts.",
  },
  {
    target: ".view-card .state-switch",
    title: "Typical vs ADHD",
    text: "Flip this to compare a typical brain with an ADHD brain. Or press Watch side by side to see both at once, step by step.",
  },
  {
    target: ".stage-toolbar",
    title: "Tools",
    text: "Turn rotation on or off, isolate a part, hide the others, reset the view, or go full screen.",
  },
  {
    target: ".resize-handle",
    title: "Make room",
    text: "Drag this handle to give the text or the brain more space. Double-click it to reset.",
  },
  {
    target: ".scape-nav",
    title: "You're all set",
    text: "View all topics opens the gallery, and About me tells you who made this. Take the tour brings this guide back any time.",
  },
];

const PAD = 8; // space around the highlighted element
const CARD_W = 320;
const GAP = 16;

type Rect = { top: number; left: number; width: number; height: number };

function visibleRect(selector: string): Rect | null {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  // Clip to the viewport so a tall panel doesn't push the highlight off screen
  const top = Math.max(r.top, 4);
  const bottom = Math.min(r.bottom, window.innerHeight - 4);
  const left = Math.max(r.left, 4);
  const right = Math.min(r.right, window.innerWidth - 4);
  if (bottom - top < 2 || right - left < 2) return null;
  return { top, left, width: right - left, height: bottom - top };
}

type GuidedTourProps = {
  open: boolean;
  onClose: () => void;
};

export function GuidedTour({ open, onClose }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(180);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Only the steps whose target exists right now (e.g. the resize handle is hidden on small screens)
  const steps = useMemo(
    () => (open ? STEPS.filter((s) => document.querySelector(s.target)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );
  const step = steps[index];
  const last = steps.length - 1;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Open the step's panel and bring it into view
  useEffect(() => {
    if (!open || !step) return;
    if (step.open) openDropPanel(document.querySelector(".info-rail"), step.open);
    document.querySelector(step.target)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    nextRef.current?.focus({ preventScroll: true });
  }, [open, step]);

  // Follow the target as the page moves, resizes or animates
  useEffect(() => {
    if (!open || !step) return;
    let frame = 0;
    const tick = () => {
      const r = visibleRect(step.target);
      setRect((prev) =>
        prev && r && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev
          : r,
      );
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [open, step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  });

  const finish = useCallback(() => {
    onClose();
  }, [onClose]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const n = i + delta;
        if (n > last) {
          finish();
          return i;
        }
        return Math.max(0, n);
      });
    },
    [last, finish],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, go, finish]);

  if (!open || !step) return null;

  // Place the card beside the highlight: right, then left, then below, then above
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(CARD_W, vw - 32);
  let cardStyle: CSSProperties;
  if (rect) {
    const h = { top: rect.top - PAD, left: rect.left - PAD, right: rect.left + rect.width + PAD, bottom: rect.top + rect.height + PAD };
    const clampTop = (t: number) => Math.min(Math.max(16, t), vh - cardH - 16);
    const clampLeft = (l: number) => Math.min(Math.max(16, l), vw - w - 16);
    if (h.right + GAP + w <= vw - 16) cardStyle = { top: clampTop(h.top), left: h.right + GAP };
    else if (h.left - GAP - w >= 16) cardStyle = { top: clampTop(h.top), left: h.left - GAP - w };
    else if (h.bottom + GAP + cardH <= vh - 16) cardStyle = { top: h.bottom + GAP, left: clampLeft(h.left) };
    else if (h.top - GAP - cardH >= 16) cardStyle = { top: h.top - GAP - cardH, left: clampLeft(h.left) };
    else cardStyle = { top: vh - cardH - 16, left: clampLeft(h.left) };
  } else {
    cardStyle = { top: (vh - cardH) / 2, left: (vw - w) / 2 };
  }
  cardStyle.width = w;

  return (
    <div className="tour-layer" aria-live="polite">
      {rect ? (
        <div
          className="tour-spotlight"
          style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
        />
      ) : (
        <div className="tour-dim" />
      )}

      <div
        ref={cardRef}
        className="tour-card"
        style={cardStyle}
        role="dialog"
        aria-label={`Guided tour, step ${index + 1} of ${steps.length}: ${step.title}`}
        key={index}
      >
        <div className="tour-card-top">
          <span className="tour-count">
            {index + 1} / {steps.length}
          </span>
          <button type="button" className="tour-close" onClick={finish} aria-label="Close the tour">
            <X size={16} />
          </button>
        </div>
        <h4>{step.title}</h4>
        <p>{step.text}</p>
        <div className="tour-progress" aria-hidden="true">
          {steps.map((s, i) => (
            <i key={s.target} className={i === index ? "is-on" : i < index ? "is-done" : ""} />
          ))}
        </div>
        <div className="tour-actions">
          {index !== last ? (
            <button type="button" className="tour-skip" onClick={finish}>
              Skip tour
            </button>
          ) : (
            <span />
          )}
          <div className="tour-nav">
            <button type="button" className="tour-back" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous tip">
              <ChevronLeft size={18} />
            </button>
            <button ref={nextRef} type="button" className="tour-next" onClick={() => go(1)}>
              {index === last ? "Done" : "Next"}
              {index !== last && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
