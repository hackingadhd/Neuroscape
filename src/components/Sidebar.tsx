import { MapPin, Sparkles, Target } from "lucide-react";
import { NEURO_INFO, SIGNS, type CellItem, type NeuroKey } from "../data/cells";

function ChemChips({ chemicals }: { chemicals: NeuroKey[] }) {
  return (
    <span className="part-chems">
      {chemicals.map((c) => (
        <span key={c} style={{ ["--chem" as string]: NEURO_INFO[c].color }}>
          <i />
          {NEURO_INFO[c].name}
        </span>
      ))}
    </span>
  );
}

/** The main signs of ADHD: one compact line each, with a dot per chemical behind it. */
export function SignsPanel() {
  const chems = Object.keys(NEURO_INFO) as NeuroKey[];
  return (
    <section className="panel signs-panel">
      <div className="panel-heading">
        <span>
          <Target size={16} />
          Main Signs of ADHD
        </span>
      </div>
      <div className="sign-legend" aria-label="Dot colours">
        {chems.map((c) => (
          <span key={c} style={{ ["--chem" as string]: NEURO_INFO[c].color }}>
            <i />
            {NEURO_INFO[c].name}
          </span>
        ))}
      </div>
      <ul className="sign-grid">
        {SIGNS.map((s) => (
          <li
            key={s.id}
            className="sign-chip"
            title={`Linked to ${s.chemicals.map((c) => NEURO_INFO[c].name).join(", ")}`}
          >
            <strong>{s.name}</strong>
            <span className="sign-dots" aria-label={s.chemicals.map((c) => NEURO_INFO[c].name).join(", ")}>
              {s.chemicals.map((c) => (
                <i key={c} style={{ ["--chem" as string]: NEURO_INFO[c].color }} />
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type PartsPanelProps = {
  selectedCell: CellItem;
  activeOrganelle: string;
  onSelectOrganelle: (id: string) => void;
};

export function PartsPanel({ selectedCell, activeOrganelle, onSelectOrganelle }: PartsPanelProps) {
  return (
    <section className="panel organelle-panel">
      <div className="panel-heading">
        <span>
          <Sparkles size={16} />
          Parts Explained
        </span>
      </div>
      <p className="parts-hint">Tap a part's name to see where it is on the brain.</p>

      <div className="part-list">
        {selectedCell.organelles.map((o) => {
          const selected = activeOrganelle === o.id;
          return (
            <article
              key={o.id}
              className={`part-card is-open ${selected ? "is-selected" : ""}`}
              style={{ ["--dot" as string]: o.color }}
            >
              <button
                type="button"
                className="part-card-head"
                aria-pressed={selected}
                title="Show this part on the brain"
                onClick={() => {
                  if (!selected) onSelectOrganelle(o.id);
                }}
              >
                <i />
                <span>
                  <strong>{o.name}</strong>
                  <em>{o.subtitle}</em>
                </span>
                <MapPin size={16} />
              </button>
              {(
                <div className="part-card-body">
                  <div className="part-adhd">
                    <h5>{selectedCell.adhdHeading ?? "How ADHD affects it"}</h5>
                    <p>{o.adhd}</p>
                  </div>
                  <h5>What it does</h5>
                  <p>{o.note}</p>
                  <h5>Where it is</h5>
                  <p>{o.whatIs}</p>
                </div>
              )}
              <div className="part-tags">
                <ChemChips chemicals={o.chemicals} />
                <div className="part-signs">
                  {o.signs.map((id) => {
                    const s = SIGNS.find((x) => x.id === id)!;
                    return (
                      <span key={id} style={{ ["--sign" as string]: s.color }}>
                        {s.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
