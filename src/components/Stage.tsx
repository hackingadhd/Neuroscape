import { useState } from "react";
import { Activity, Box, Camera, CircleDot, Columns2, EyeOff, Layers, Maximize, RotateCcw, type LucideIcon } from "lucide-react";
import { BRAIN_STATES, NEURO_INFO, type BrainState, type CellItem, type ViewMode } from "../data/cells";
import { captureScreenshot, exportGlb, toggleFullscreen } from "../lib/download";
import { BrainScene } from "./BrainScene";
import { SynapseView, type SynapseStats } from "./SynapseView";

type ModeOption = { id: ViewMode; label: string; Icon: LucideIcon };

const modeOptions: ModeOption[] = [
  { id: "mesh", label: "3D brain", Icon: Box },
  { id: "focus", label: "See-through brain", Icon: Layers },
  { id: "synapse", label: "Close-up: where two nerve cells meet", Icon: Activity },
];

type StageProps = {
  cell: CellItem;
  activeOrganelle: string;
  viewMode: ViewMode;
  crossSection: boolean;
  autoRotate: boolean;
  resetKey: number;
  brainState: BrainState;
  showLabel: boolean;
  override: { target: string; name: string; color: string } | null;
  onShowLabelChange: (value: boolean) => void;
  onBrainStateChange: (state: BrainState) => void;
  onSelectOrganelle: (id: string) => void;
  onModeChange: (mode: ViewMode) => void;
  onCrossSectionChange: (value: boolean) => void;
  onAutoRotateChange: (value: boolean) => void;
  onReset: () => void;
  onToast: (message: string) => void;
  onCompare: () => void;
};

export function Stage({
  cell,
  activeOrganelle,
  viewMode,
  crossSection,
  autoRotate,
  resetKey,
  brainState,
  showLabel,
  override,
  onShowLabelChange,
  onBrainStateChange,
  onSelectOrganelle,
  onModeChange,
  onCrossSectionChange,
  onAutoRotateChange,
  onReset,
  onToast,
  onCompare,
}: StageProps) {
  const [stats, setStats] = useState<SynapseStats | null>(null);
  const organelle = cell.organelles.find((o) => o.id === activeOrganelle) ?? cell.organelles[0];
  const focusTarget: string = override?.target ?? organelle.target;
  const synapsePart = focusTarget.startsWith("synapse:") ? focusTarget.slice(8) : null;
  // A part that uses only one chemical shows that chemical's gap; otherwise the topic's
  const neuroKey = override || organelle.chemicals.length !== 1 ? cell.neuro : organelle.chemicals[0];
  const neuro = NEURO_INFO[neuroKey];

  return (
    <main className="stage-column">
      <section className="stage-panel">
        <div className="stage-title">
          <div key={cell.id} className="stage-title-copy">
            <h2>{cell.name}</h2>
            <p>{cell.type}</p>
            <div className={`state-badge state-${brainState}`}>
              <span className="live-dot" />
              Live · {BRAIN_STATES.find((s) => s.id === brainState)?.blurb}
            </div>
            <p className={`state-hint state-${brainState}`}>
              <strong>What to look for: </strong>
              {viewMode === "synapse"
                ? brainState === "adhd"
                  ? "less chemical is released, and extra recyclers (the purple pumps on the top cell that pull the chemical back in) grab it back fast, so far fewer receivers light up."
                  : "plenty of chemical is released and there are only a few recyclers (the purple pumps on the top cell that pull the chemical back in), so the receivers light up often."
                : brainState === "adhd"
                  ? "fewer signal dots travel, many turn grey and fade out before arriving, and the end points barely glow."
                  : "lots of bright signal dots travel the routes and make the end points glow when they arrive."}
              <em> Switch to {brainState === "adhd" ? "Typical" : "ADHD"} to compare.</em>
            </p>
          </div>

        </div>

        <div className="view-card is-side">
          <span>View Mode</span>
          <div className="mode-switcher">
            {modeOptions.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={viewMode === id ? "is-active" : ""}
                onClick={() => {
                  if (viewMode === id) {
                    onToast(`${label} view already active.`);
                  } else {
                    onModeChange(id);
                    onToast(`${label} view enabled.`);
                  }
                }}
                title={label}
              >
                <Icon size={22} />
              </button>
            ))}
          </div>
          <label className="toggle-line">
            <span>Cut Open</span>
            <input
              type="checkbox"
              checked={crossSection}
              disabled={viewMode === "synapse"}
              onChange={(event) => {
                onCrossSectionChange(event.target.checked);
                onToast(event.target.checked ? "Front of the brain cut away so you can see inside." : "Brain closed again.");
              }}
            />
            <i />
          </label>
          <label className="toggle-line">
            <span>Show Names</span>
            <input
              type="checkbox"
              checked={showLabel}
              onChange={(event) => onShowLabelChange(event.target.checked)}
            />
            <i />
          </label>
          <div className="state-switch" role="radiogroup" aria-label="Brain state">
            <span>Show me a brain that is</span>
            <div>
              {BRAIN_STATES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={brainState === s.id}
                  className={`${brainState === s.id ? "is-active" : ""} state-${s.id}`}
                  onClick={() => {
                    onBrainStateChange(s.id);
                    onToast(`${s.label}: ${s.blurb}.`);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="view-compare" onClick={onCompare}>
            <Columns2 size={16} />
            Side by side
          </button>
        </div>

        <div className={`canvas-wrap ${viewMode === "synapse" ? "is-synapse" : ""}`}>
          {viewMode === "synapse" ? (
            <>
              <SynapseView neuro={neuroKey} state={brainState} highlight={synapsePart} onStats={setStats} />
              <div className="synapse-hud">
                <strong>Where two nerve cells meet ({neuro.name.toLowerCase()})</strong>
                <div>
                  <span>Message received</span>
                  <i><b style={{ width: `${stats?.signal ?? 0}%`, background: neuro.color }} /></i>
                  <em>{stats?.signal ?? 0}%</em>
                </div>
                <div>
                  <span>Chemical in the gap</span>
                  <i><b style={{ width: `${Math.min(100, (stats?.cleft ?? 0) * 3)}%`, background: neuro.color }} /></i>
                  <em>{stats?.cleft ?? 0}</em>
                </div>
                <div>
                  <span>Recycled per second</span>
                  <i><b style={{ width: `${Math.min(100, (stats?.reuptake ?? 0) * 6)}%`, background: "#8e6aa8" }} /></i>
                  <em>{stats?.reuptake ?? 0}</em>
                </div>
              </div>
            </>
          ) : (
            <BrainScene
              cell={cell}
              activeOrganelle={activeOrganelle}
              viewMode={viewMode}
              crossSection={crossSection}
              autoRotate={autoRotate}
              resetKey={resetKey}
              brainState={brainState}
              showLabel={showLabel}
              override={override}
              onPick={(id) => {
                if (id !== activeOrganelle) {
                  onSelectOrganelle(id);
                  const picked = cell.organelles.find((o) => o.id === id);
                  if (picked) onToast(`Focused on ${picked.name}.`);
                }
              }}
            />
          )}
        </div>

        <div className="stage-toolbar">
          <button
            type="button"
            className={autoRotate ? "is-active" : ""}
            onClick={() => {
              const next = !autoRotate;
              onAutoRotateChange(next);
              onToast(next ? "Auto-rotate on." : "Auto-rotate off.");
            }}
          >
            <RotateCcw size={20} />
            <span className="tb-label">Rotate</span>
          </button>
          <button
            type="button"
            className={viewMode === "focus" ? "is-active" : ""}
            onClick={() => {
              onModeChange("focus");
              onToast(`Showing ${override?.name ?? organelle.name} on its own.`);
            }}
          >
            <CircleDot size={20} />
            <span className="tb-label">Isolate</span>
          </button>
          <button
            type="button"
            className={viewMode === "focus" ? "is-active" : ""}
            onClick={() => {
              onModeChange(viewMode === "focus" ? "mesh" : "focus");
              onToast(viewMode === "focus" ? "Showing the whole brain." : "Everything else faded out.");
            }}
          >
            <EyeOff size={20} />
            <span className="tb-label">Hide Others</span>
          </button>
          <button type="button" onClick={onReset}>
            <RotateCcw size={20} />
            <span className="tb-label">Reset View</span>
          </button>
          <button type="button" onClick={() => toggleFullscreen(onToast)}>
            <Maximize size={20} />
            <span className="tb-label">Fullscreen</span>
          </button>
        </div>

        <div className="export-toolbar">
          <button type="button" onClick={() => captureScreenshot(cell, onToast)}>
            <Camera size={20} />
            <span className="tb-label">Screenshot</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (viewMode === "synapse") {
                onToast("Switch back to the 3D brain to export it.");
                return;
              }
              void exportGlb(cell, onToast);
            }}
          >
            <Box size={20} />
            <span className="tb-label">GLB Export</span>
          </button>
        </div>
      </section>
    </main>
  );
}
