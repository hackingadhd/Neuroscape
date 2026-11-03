import { Brain, ChevronRight } from "lucide-react";
import { cells, type CellItem } from "../data/cells";
import { MiniCell } from "./MiniCell";

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
              onClick={() => {
                if (!selected) onSelectCell(cell.id);
              }}
            >
              <MiniCell cell={cell} />
              <span className="cell-row-copy">
                <strong>{cell.name}</strong>
                <span>{cell.type}</span>
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
