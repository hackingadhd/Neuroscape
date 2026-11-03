import { ArrowRight, Info } from "lucide-react";
import { type CellItem } from "../data/cells";

type BottomPanelsProps = {
  cell: CellItem;
  onCompare: () => void;
};

export function BottomPanels({ cell, onCompare }: BottomPanelsProps) {
  return (
    <section className="bottom-grid is-single">
      <div className="panel compare-panel">
        <div className="panel-heading">
          <span>
            Key Differences
            <Info size={16} />
          </span>
        </div>
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
        <button type="button" className="comparison-button" onClick={onCompare}>
          Watch them side by side
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}
