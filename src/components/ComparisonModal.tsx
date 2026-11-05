import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCellById, NEURO_INFO, type BrainState, type CellItem } from "../data/cells";
import type { JourneyStep } from "../data/journeys";
import { BrainScene } from "./BrainScene";
import { MiniCell } from "./MiniCell";
import { Modal } from "./Modal";
import { SynapseView, type SynapseStats } from "./SynapseView";

type ComparisonModalProps = {
  cell: CellItem;
  journey: { name: string; steps: JourneyStep[] };
  open: boolean;
  onClose: () => void;
  onOpenTopic: (id: string) => void;
};

/** What to look for on the 3D brain, per state. */
const BRAIN_NOTE: Record<BrainState, string> = {
  typical: "Lots of bright signal dots travel the routes and make the end points glow.",
  adhd: "Fewer signal dots travel, many turn grey and fade out, and the end points barely glow.",
};

type LiveColumnProps = {
  cell: CellItem;
  step: JourneyStep;
  state: BrainState;
  title: string;
};

function LiveColumn({ cell, step, state, title }: LiveColumnProps) {
  const [stats, setStats] = useState<SynapseStats | null>(null);
  const neuro = NEURO_INFO[cell.neuro];
  const onBrain = step.view === "brain";
  const synapsePart = step.target.startsWith("synapse:") ? step.target.slice(8) : null;

  return (
    <section className={`compare-live state-${state}`}>
      <header>
        <h4>{title}</h4>
        <span>{onBrain ? "3D brain" : "Close-up of two nerve cells"}</span>
      </header>
      <div className={`compare-canvas ${onBrain ? "is-brain" : "is-synapse"}`}>
        {onBrain ? (
          <BrainScene
            cell={cell}
            activeOrganelle={cell.defaultOrganelle}
            viewMode="mesh"
            crossSection={false}
            autoRotate
            resetKey={0}
            brainState={state}
            showLabel
            registerExport={false}
            override={{ target: step.target, name: step.label, color: neuro.color }}
          />
        ) : (
          <SynapseView neuro={cell.neuro} state={state} compact highlight={synapsePart} onStats={setStats} />
        )}
      </div>
      {onBrain ? (
        <p className="compare-note">{BRAIN_NOTE[state]}</p>
      ) : (
        <>
          <div className="compare-stat">
            <span>Message received</span>
            <i><b style={{ width: `${stats?.signal ?? 0}%`, background: neuro.color }} /></i>
            <em>{stats?.signal ?? 0}%</em>
          </div>
          <div className="compare-stat">
            <span>Recycled per sec</span>
            <i><b style={{ width: `${Math.min(100, (stats?.reuptake ?? 0) * 6)}%`, background: "#8e6aa8" }} /></i>
            <em>{stats?.reuptake ?? 0}</em>
          </div>
        </>
      )}
    </section>
  );
}

export function ComparisonModal({ cell, journey, open, onClose, onOpenTopic }: ComparisonModalProps) {
  const related = getCellById(cell.comparison);
  const [index, setIndex] = useState(0);
  const steps = journey.steps;
  const step = steps[index] ?? steps[0];
  const last = steps.length - 1;
  const color = NEURO_INFO[cell.neuro].color;

  // Start from the first step each time it opens or the topic changes
  useEffect(() => {
    if (open) setIndex(0);
  }, [open, cell.id]);

  // Left/right arrows flip through the steps while the comparison is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, last]);

  return (
    <Modal open={open} onClose={onClose} label="Typical vs ADHD comparison" panelClassName="comparison-modal brain-compare">
      <div className="comparison-modal-head">
        <h3>Side by Side</h3>
        <p>How {journey.name.toLowerCase()} travels in a typical brain and an ADHD brain, step by step, both live.</p>
      </div>

      {open && (
        <>
          <div className="compare-steps" style={{ ["--chem" as string]: color }}>
            <button
              type="button"
              className="journey-arrow"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Previous step"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="compare-step-copy step-stack">
              {steps.map((s, i) => (
                <div key={i} className={i === index ? "is-current" : ""} aria-hidden={i !== index}>
                  <span className="compare-step-num">
                    Step {i + 1} of {steps.length}
                  </span>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="journey-arrow"
              onClick={() => setIndex((i) => Math.min(last, i + 1))}
              disabled={index === last}
              aria-label="Next step"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="compare-dots" role="tablist" aria-label="Steps" style={{ ["--chem" as string]: color }}>
            {steps.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Step ${i + 1}: ${s.title}`}
                title={s.title}
                className={`${i === index ? "is-on" : ""} ${i < index ? "is-done" : ""}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>

          <div className="compare-live-grid">
            <LiveColumn cell={cell} step={step} state="typical" title="Typical" />
            <LiveColumn cell={cell} step={step} state="adhd" title="ADHD" />
          </div>
        </>
      )}

      <table className="contrast-table">
        <thead>
          <tr>
            <th />
            <th>Typical</th>
            <th>ADHD</th>
          </tr>
        </thead>
        <tbody>
          {cell.contrast.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              <td>{row.typical}</td>
              <td>{row.adhd}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="compare-foot">{cell.clinicalContext}</p>

      <button
        type="button"
        className="compare-related"
        onClick={() => {
          onOpenTopic(related.id);
          onClose();
        }}
      >
        <MiniCell cell={related} />
        <span>
          <strong>Next: {related.name}</strong>
          <em>{related.type}</em>
        </span>
      </button>
    </Modal>
  );
}
