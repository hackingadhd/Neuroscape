import { useState } from "react";
import { getCellById, NEURO_INFO, type BrainState, type CellItem } from "../data/cells";
import { MiniCell } from "./MiniCell";
import { Modal } from "./Modal";
import { SynapseView, type SynapseStats } from "./SynapseView";

type ComparisonModalProps = {
  cell: CellItem;
  open: boolean;
  onClose: () => void;
  onOpenTopic: (id: string) => void;
};

function LiveColumn({ cell, state, title }: { cell: CellItem; state: BrainState; title: string }) {
  const [stats, setStats] = useState<SynapseStats | null>(null);
  const color = NEURO_INFO[cell.neuro].color;
  return (
    <section className={`compare-live state-${state}`}>
      <header>
        <h4>{title}</h4>
        <span>{NEURO_INFO[cell.neuro].name} · live close-up</span>
      </header>
      <div className="compare-canvas">
        <SynapseView neuro={cell.neuro} state={state} compact onStats={setStats} />
      </div>
      <div className="compare-stat">
        <span>Message received</span>
        <i><b style={{ width: `${stats?.signal ?? 0}%`, background: color }} /></i>
        <em>{stats?.signal ?? 0}%</em>
      </div>
      <div className="compare-stat">
        <span>Recycled per sec</span>
        <i><b style={{ width: `${Math.min(100, (stats?.reuptake ?? 0) * 6)}%`, background: "#8e6aa8" }} /></i>
        <em>{stats?.reuptake ?? 0}</em>
      </div>
    </section>
  );
}

export function ComparisonModal({ cell, open, onClose, onOpenTopic }: ComparisonModalProps) {
  const related = getCellById(cell.comparison);

  return (
    <Modal open={open} onClose={onClose} label="Typical vs ADHD comparison" panelClassName="comparison-modal brain-compare">
      <div className="comparison-modal-head">
        <h3>Comparison View</h3>
        <p>{cell.name}: a typical brain next to an ADHD brain, both live.</p>
      </div>

      {open && (
        <div className="compare-live-grid">
          <LiveColumn cell={cell} state="typical" title="Typical" />
          <LiveColumn cell={cell} state="adhd" title="ADHD" />
        </div>
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
