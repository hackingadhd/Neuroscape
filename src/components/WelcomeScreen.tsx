import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { scapeGradient } from "../lib/scapeGradient";

type WelcomeScreenProps = {
  open: boolean;
  onEnter: () => void;
};

// One sentence per step, shown in the middle of the screen.
const STEPS = [
  { big: true, text: "How the ADHD brain is different" },
  { text: "Brain cells talk to each other using chemical messengers like dopamine and norepinephrine." },
  { text: "In an ADHD brain, these messages come through weaker and patchier." },
  { text: "This happens most in the areas that handle focus, motivation and self-control." },
  { text: "Neuroscape shows you where that happens, and what it changes." },
];

/** Full-screen welcome shown before the brain explorer opens. */
export function WelcomeScreen({ open, onEnter }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const last = STEPS.length - 1;

  function enter() {
    setLeaving(true);
    window.setTimeout(onEnter, 450);
  }

  function next() {
    if (step >= last) enter();
    else setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setLeaving(false);
  }, [open]);

  useEffect(() => {
    if (open) nextButton.current?.focus();
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Escape") {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;
  const current = STEPS[step];

  return (
    <div
      className={`welcome-screen ${leaving ? "is-leaving" : ""}`}
      style={{ background: scapeGradient("neuro", 0.3), backgroundSize: "220px 220px, 100% 100%, 100% 100%, 100% 100%, 100% 100%" }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Neuroscape"
    >
      <header className="welcome-top">
        <span className="scape-wordmark">Neuroscape</span>
        <button type="button" className="scape-link welcome-skip" onClick={enter}>
          Skip
        </button>
      </header>

      <div className="welcome-center">
        <p key={step} className={`welcome-sentence ${current.big ? "is-title" : ""}`} aria-live="polite">
          {current.text}
        </p>

        <div className="welcome-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? "is-on" : i < step ? "is-done" : ""} />
          ))}
        </div>

        <div className="welcome-controls">
          <button
            type="button"
            className="welcome-back"
            onClick={back}
            disabled={step === 0}
            aria-label="Previous sentence"
          >
            <ArrowLeft size={18} />
          </button>
          <button ref={nextButton} type="button" className="scape-pill welcome-enter" onClick={next}>
            {step === last ? "Explore the brain" : "Next"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
