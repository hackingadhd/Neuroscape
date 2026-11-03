import { useEffect, useMemo } from "react";
import { ChevronDown, Sparkles, Target } from "lucide-react";
import { cells, NEURO_INFO, SIGNS, type CellItem, type NeuroKey, type Sign } from "../data/cells";

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

type SignsPanelProps = {
  sign: Sign | null;
  onSignChange: (sign: Sign | null) => void;
};

export function SignsPanel({ sign, onSignChange }: SignsPanelProps) {
  return (
    <section className="panel signs-panel">
      <div className="panel-heading">
        <span>
          <Target size={16} />
          Main Signs of ADHD
        </span>
      </div>
      <p className="parts-hint">Tap a sign to see which brain parts and chemicals are behind it.</p>
      <div className="sign-list">
        {SIGNS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`sign-row ${sign === s.id ? "is-on" : ""}`}
            style={{ ["--sign" as string]: s.color }}
            aria-pressed={sign === s.id}
            onClick={() => onSignChange(sign === s.id ? null : s.id)}
          >
            <i />
            <span>
              <strong>{s.name}</strong>
              <em>{s.text}</em>
              <ChemChips chemicals={s.chemicals} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

type PartsPanelProps = {
  selectedCell: CellItem;
  activeOrganelle: string;
  sign: Sign | null;
  onSignChange: (sign: Sign | null) => void;
  onSelectOrganelle: (id: string) => void;
  onOpenPart: (cellId: string, partId: string) => void;
};

export function PartsPanel({
  selectedCell,
  activeOrganelle,
  sign,
  onSignChange,
  onSelectOrganelle,
  onOpenPart,
}: PartsPanelProps) {
  const signInfo = SIGNS.find((s) => s.id === sign);

  const parts = useMemo(
    () => (sign ? selectedCell.organelles.filter((o) => o.signs.includes(sign)) : selectedCell.organelles),
    [selectedCell, sign],
  );

  // Other topics that also explain the chosen sign
  const elsewhere = useMemo(
    () =>
      sign
        ? cells
            .filter((c) => c.id !== selectedCell.id)
            .map((c) => ({ cell: c, part: c.organelles.find((o) => o.signs.includes(sign)) }))
            .filter((x): x is { cell: CellItem; part: CellItem["organelles"][number] } => Boolean(x.part))
        : [],
    [sign, selectedCell.id],
  );

  // When filtering, jump to the first matching part so the brain shows it
  useEffect(() => {
    if (sign && parts.length && !parts.some((p) => p.id === activeOrganelle)) onSelectOrganelle(parts[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, selectedCell.id]);

  return (
    <section className="panel organelle-panel">
      <div className="panel-heading">
        <span>
          <Sparkles size={16} />
          Parts Explained
        </span>
        {sign && (
          <button type="button" className="sign-clear" onClick={() => onSignChange(null)}>
            Show all
          </button>
        )}
      </div>
      <p className="parts-hint">
        {signInfo
          ? `Parts of ${selectedCell.name} linked to ${signInfo.name.toLowerCase()}:`
          : "Tap a part to read about it and see where it is on the brain."}
      </p>

      {parts.length === 0 && signInfo && (
        <p className="parts-empty">Nothing in {selectedCell.name} is a main cause of this sign. Try one below.</p>
      )}

      <div className="part-list">
        {parts.map((o) => {
          const open = activeOrganelle === o.id;
          return (
            <article key={o.id} className={`part-card ${open ? "is-open" : ""}`} style={{ ["--dot" as string]: o.color }}>
              <button
                type="button"
                className="part-card-head"
                aria-expanded={open}
                onClick={() => {
                  if (!open) onSelectOrganelle(o.id);
                }}
              >
                <i />
                <span>
                  <strong>{o.name}</strong>
                  <em>{o.subtitle}</em>
                </span>
                <ChevronDown size={16} />
              </button>
              {open && (
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

      {signInfo && elsewhere.length > 0 && (
        <div className="sign-elsewhere">
          <h5>Also linked to {signInfo.name.toLowerCase()}</h5>
          {elsewhere.map(({ cell, part }) => (
            <button key={cell.id} type="button" onClick={() => onOpenPart(cell.id, part.id)}>
              <i style={{ background: part.color }} />
              <span>
                <strong>{part.name}</strong>
                <em>in {cell.name}</em>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
