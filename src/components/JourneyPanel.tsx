import { ChevronLeft, ChevronRight, Route } from "lucide-react";
import type { JourneyStep } from "../data/journeys";

type JourneyPanelProps = {
  name: string;
  color: string;
  steps: JourneyStep[];
  index: number;
  active: boolean;
  onStep: (index: number) => void;
};

export function JourneyPanel({ name, color, steps, index, active, onStep }: JourneyPanelProps) {
  const step = steps[index];
  const last = steps.length - 1;

  return (
    <section className={`panel journey-panel ${active ? "is-active" : ""}`} style={{ ["--chem" as string]: color }}>
      <div className="panel-heading">
        <span>
          <Route size={17} />
          How {name} Travels
        </span>
        <span className="journey-count">
          Step {index + 1} of {steps.length}
        </span>
      </div>

      {!active && (
        <p className="journey-intro">
          Follow {name.toLowerCase()} step by step, from where it's made to how it delivers its message. Use the arrows and
          watch the brain.
        </p>
      )}

      <div className="journey-card" key={`${name}-${index}`}>
        <span className="journey-num">{index + 1}</span>
        <div>
          <h4>{step.title}</h4>
          <p>{step.text}</p>
          <small>{step.view === "brain" ? "Shown on the 3D brain" : "Shown in the close-up of two nerve cells"}</small>
        </div>
      </div>

      <div className="journey-controls">
        <button
          type="button"
          className="journey-arrow"
          onClick={() => onStep(Math.max(0, index - 1))}
          disabled={active && index === 0}
          aria-label="Previous step"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="journey-dots" role="tablist" aria-label="Journey steps">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Step ${i + 1}: ${s.title}`}
              className={`${i === index ? "is-on" : ""} ${i < index ? "is-done" : ""}`}
              onClick={() => onStep(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="journey-arrow is-next"
          onClick={() => onStep(active ? Math.min(last, index + 1) : index)}
          disabled={active && index === last}
          aria-label={active ? "Next step" : "Start the journey"}
        >
          {!active && <span>Start</span>}
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}
