import { Activity, Info } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BRAIN_STATES, NEURO_INFO, type BrainState, type CellItem } from "../data/cells";
import type { JourneyStep } from "../data/journeys";
import { BrainMapPanel } from "./BrainMapPanel";
import { JourneyPanel } from "./JourneyPanel";

type RightPanelProps = {
  cell: CellItem;
  activeOrganelle: string;
  brainState: BrainState;
  journey: { name: string; steps: JourneyStep[] };
  journeyIndex: number;
  journeyActive: boolean;
  onJourneyStep: (index: number) => void;
  onSelectCell: (id: string) => void;
  /** Rendered between the Brain Map and the journey (Parts Explained). */
  children?: ReactNode;
  /** Rendered under the journey, in the Brain Map column. */
  after?: ReactNode;
  /** Rendered under Parts Explained, in the second column. */
  side?: ReactNode;
};

const JITTER: Record<BrainState, number> = { typical: 3, adhd: 11 };

function useLiveValue(base: number, state: BrainState) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    setValue(base);
    const id = window.setInterval(() => {
      // ADHD shows a lot of moment-to-moment ups and downs, not just a lower average
      const dip = state === "adhd" && Math.random() < 0.18 ? -14 : 0;
      setValue(Math.max(4, Math.min(100, Math.round(base + (Math.random() - 0.5) * 2 * JITTER[state] + dip))));
    }, 750);
    return () => window.clearInterval(id);
  }, [base, state]);
  return value;
}

export function RightPanel({
  cell,
  journey,
  journeyIndex,
  journeyActive,
  onJourneyStep,
  onSelectCell,
  children,
  after,
  side,
}: Omit<RightPanelProps, "activeOrganelle" | "brainState">) {
  return (
    <aside className="right-rail is-split">
      <div className="right-col">
        <BrainMapPanel selectedCell={cell} onSelectCell={onSelectCell} />
        <JourneyPanel
          name={journey.name}
          color={NEURO_INFO[cell.neuro].color}
          steps={journey.steps}
          index={journeyIndex}
          active={journeyActive}
          onStep={onJourneyStep}
        />
        {after}
      </div>
      <div className="right-col">
        {children}
        {side}
      </div>
    </aside>
  );
}

/** Live typical-vs-ADHD meter and the topic's big picture (left column). */
export function InsightPanels({
  cell,
  activeOrganelle,
  brainState,
}: Pick<RightPanelProps, "cell" | "activeOrganelle" | "brainState">) {
  const organelle = cell.organelles.find((item) => item.id === activeOrganelle) ?? cell.organelles[0];
  const live = useLiveValue(organelle.meter[brainState], brainState);
  const stateLabel = BRAIN_STATES.find((s) => s.id === brainState)?.label ?? "";

  return (
    <>
      <section className="panel adhd-panel">
        <div className="panel-heading">
          <span>
            <Activity size={17} />
            Typical vs ADHD
          </span>
          <span className={`live-pill state-${brainState}`}>
            <span className="live-dot" /> Live
          </span>
        </div>
        <div className="adhd-meter" style={{ ["--dot" as string]: organelle.color }}>
          <div className="adhd-meter-head">
            <span>
              <b>{organelle.name}:</b> {organelle.meter.label.toLowerCase()}
            </span>
            <strong>{live}%</strong>
          </div>
          {organelle.meter.explain && <p className="meter-explain">{organelle.meter.explain}</p>}
          <div className="adhd-bar is-typical">
            <span>Typical</span>
            <i><b style={{ width: `${organelle.meter.typical}%` }} /></i>
          </div>
          <div className={`adhd-bar is-live state-${brainState}`}>
            <span>{stateLabel} · now</span>
            <i><b style={{ width: `${live}%`, background: organelle.color }} /></i>
          </div>
          <small>
            A simplified picture, not a real measurement. Switch between Typical and ADHD next to the brain to
            compare.
          </small>
        </div>
      </section>

      <section className="panel notes-panel">
        <div className="panel-heading">
          <span>The Big Picture</span>
        </div>
        <p>{cell.adhdSummary}</p>
        <dl className="key-words">
          <div>
            <dt>The gap</dt>
            <dd>The tiny space between two nerve cells that chemical messengers have to cross.</dd>
          </div>
          <div>
            <dt>Receivers</dt>
            <dd>Docking spots on the receiving nerve cell. When a chemical lands on one, the message is passed on.</dd>
          </div>
          <div>
            <dt>Recyclers</dt>
            <dd>
              Tiny pumps on the sending nerve cell. They pull the chemical back inside after it has been used, which
              switches the message off. In ADHD they may work too fast, so the message is weaker.
            </dd>
          </div>
        </dl>
        <div className="good-to-know">
          <Info size={16} />
          <p>{cell.clinicalContext}</p>
        </div>
      </section>
    </>
  );
}
