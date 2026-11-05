import { Brain, ChevronRight } from "lucide-react";
import { cells, type CellItem } from "../data/cells";
import { MiniCell } from "./MiniCell";

/** Short one-line labels for the map tiles (the full description shows on hover and on the right). */
const SHORT_TYPE: Record<string, string> = {
  neuro: "How cells talk",
  dopamine: "Motivation",
  norepinephrine: "Alertness",
  serotonin: "Calm & mood",
  areas: "Key brain areas",
};

/** Soft hyphens (\u00AD) let long names break neatly with a hyphen, only when a tile is too narrow. */
const BREAKABLE_NAME: Record<string, string> = {
  neuro: "Neuro\u00ADtrans\u00ADmitters",
  dopamine: "Dopa\u00ADmine",
  norepinephrine: "Nor\u00ADepi\u00ADnephrine",
  serotonin: "Sero\u00ADtonin",
};

type BrainMapPanelProps = {
  selectedCell: CellItem;
  onSelectCell: (id: string) => void;
};

export function BrainMapPanel({ selectedCell, onSelectCell }: BrainMapPanelProps) {
  return (
    <section className="panel cell-panel">
      <div className="panel-heading">
        <span>
          <Brain size={16} />
          Brain Map
        </span>
      </div>
      <div className="cell-list">
        {cells.map((cell) => {
          const selected = cell.id === selectedCell.id;
          return (
            <button
              type="button"
              key={cell.id}
              className={`cell-row ${selected ? "is-active" : ""}`}
              style={{ ["--accent" as string]: cell.accent, ["--accent-soft" as string]: cell.accentSoft }}
              aria-current={selected}
              title={`${cell.name}: ${cell.type}`}
              onClick={() => {
                if (!selected) onSelectCell(cell.id);
              }}
            >
              <MiniCell cell={cell} />
              <span className="cell-row-copy">
                <strong>{BREAKABLE_NAME[cell.id] ?? cell.name}</strong>
                <span>{SHORT_TYPE[cell.id] ?? cell.type}</span>
              </span>
              <span className="favorite-dot" aria-hidden="true">
                <ChevronRight size={16} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
