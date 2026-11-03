import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cells, getCellById, NEURO_INFO, type BrainState, type Sign, type ViewMode } from "./data/cells";
import { journeyFor } from "./data/journeys";
import { loadLastCellId, saveLastCellId } from "./lib/storage";
import { Header } from "./components/Header";
import { PartsPanel, SignsPanel } from "./components/Sidebar";
import { Stage } from "./components/Stage";
import { InsightPanels } from "./components/RightPanel";
import { BrainMapPanel } from "./components/BrainMapPanel";
import { JourneyPanel } from "./components/JourneyPanel";
import { BottomPanels } from "./components/BottomPanels";
import { ComparisonModal } from "./components/ComparisonModal";
import { AboutModal } from "./components/AboutModal";
import { SpecimenGridModal } from "./components/SpecimenGridModal";
import { Toast } from "./components/Toast";
import { ShortcutsHelp } from "./components/ShortcutsHelp";
import { useOverlays } from "./hooks/useOverlays";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ACCENTS, loadAccent, saveAccent } from "./lib/theme";

export default function App() {
  const [selectedCellId, setSelectedCellId] = useState(loadLastCellId);
  const selectedCell = useMemo(() => getCellById(selectedCellId), [selectedCellId]);
  const [activeOrganelle, setActiveOrganelle] = useState(selectedCell.defaultOrganelle);
  const [viewMode, setViewMode] = useState<ViewMode>("mesh");
  const [crossSection, setCrossSection] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [brainState, setBrainState] = useState<BrainState>("adhd");
  const [showLabel, setShowLabel] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const overlays = useOverlays();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [accent, setAccent] = useState(loadAccent);
  const [sign, setSign] = useState<Sign | null>(null);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [journeyActive, setJourneyActive] = useState(false);
  const journey = useMemo(() => journeyFor(selectedCell.neuro), [selectedCell.neuro]);
  const journeyStep = journey.steps[journeyIndex];
  const override = journeyActive
    ? { target: journeyStep.target as string, name: journeyStep.label, color: NEURO_INFO[selectedCell.neuro].color }
    : null;

  function goToStep(index: number) {
    const step = journey.steps[index];
    setJourneyIndex(index);
    setJourneyActive(true);
    if (step.view === "synapse") setViewMode("synapse");
    else setViewMode((mode) => (mode === "synapse" ? "mesh" : mode));
    if (step.state) setBrainState(step.state);
  }

  function selectPart(id: string) {
    setActiveOrganelle(id);
    setJourneyActive(false);
  }

  const prevCellId = useRef(selectedCellId);
  const pendingPart = useRef<string | null>(null);
  useEffect(() => {
    if (prevCellId.current !== selectedCell.id) {
      setActiveOrganelle(pendingPart.current ?? selectedCell.defaultOrganelle);
      pendingPart.current = null;
      setJourneyIndex(0);
      setJourneyActive(false);
      setViewMode((mode) => (mode === "synapse" ? "mesh" : mode));
      overlays.close();
      prevCellId.current = selectedCell.id;
    }
    saveLastCellId(selectedCell.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  function stepTopic(delta: number) {
    const index = cells.findIndex((c) => c.id === selectedCellId);
    const next = cells[(index + delta + cells.length) % cells.length];
    setSelectedCellId(next.id);
    showToast(next.name);
  }

  useKeyboardShortcuts(overlays.active === null, {
    onPrev: () => stepTopic(-1),
    onNext: () => stepTopic(1),
    onReset: () => {
      setResetKey((key) => key + 1);
      showToast("View reset.");
    },
    onToggleRotate: () => {
      setAutoRotate((v) => {
        showToast(v ? "Auto-rotate off." : "Auto-rotate on.");
        return !v;
      });
    },
    onGallery: () => overlays.open("gallery"),
    onHelp: () => overlays.open("shortcuts"),
  });

  // The UI tint follows the open topic unless a fixed accent was picked.
  const theme = accent.id === "auto" ? selectedCell : accent;
  const shellStyle = {
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--brand": theme.accent,
    "--cell-color": selectedCell.color,
  } as CSSProperties;

  return (
    <div className="app-shell" style={shellStyle}>
      <Header
        cell={selectedCell}
        onAbout={() => overlays.open("about")}
        onGallery={() => overlays.open("gallery")}
        accentId={accent.id}
        onAccentChange={(id) => {
          const next = ACCENTS.find((a) => a.id === id) ?? accent;
          setAccent(next);
          saveAccent(next.id);
        }}
      />

      <div className="app-grid">
        <aside className="left-rail info-rail">
          <div className="info-col">
            <SignsPanel sign={sign} onSignChange={setSign} />
            <JourneyPanel
              name={journey.name}
              color={NEURO_INFO[selectedCell.neuro].color}
              steps={journey.steps}
              index={journeyIndex}
              active={journeyActive}
              onStep={goToStep}
            />
            <BottomPanels cell={selectedCell} onCompare={() => overlays.open("comparison")} />
          </div>
          <div className="info-col">
            <BrainMapPanel
              selectedCell={selectedCell}
              onSelectCell={(id) => {
                setSelectedCellId(id);
                showToast(`Loaded ${getCellById(id).name}.`);
              }}
            />
            <PartsPanel
              selectedCell={selectedCell}
              activeOrganelle={activeOrganelle}
              sign={sign}
              onSignChange={setSign}
              onSelectOrganelle={selectPart}
              onOpenPart={(cellId, partId) => {
                pendingPart.current = partId;
                setSelectedCellId(cellId);
              }}
            />
            <InsightPanels cell={selectedCell} activeOrganelle={activeOrganelle} brainState={brainState} />
          </div>
        </aside>

        <div className="center-stack">
          <Stage
            cell={selectedCell}
            activeOrganelle={activeOrganelle}
            viewMode={viewMode}
            crossSection={crossSection}
            autoRotate={autoRotate}
            resetKey={resetKey}
            brainState={brainState}
            showLabel={showLabel}
            override={override}
            onShowLabelChange={setShowLabel}
            onBrainStateChange={setBrainState}
            onSelectOrganelle={selectPart}
            onModeChange={setViewMode}
            onCrossSectionChange={setCrossSection}
            onAutoRotateChange={setAutoRotate}
            onReset={() => {
              setResetKey((key) => key + 1);
              showToast("View reset.");
            }}
            onToast={showToast}
          />
        </div>

      </div>

      <ComparisonModal
        cell={selectedCell}
        open={overlays.isOpen("comparison")}
        onOpenTopic={(id) => {
          setSelectedCellId(id);
          showToast(`Loaded ${getCellById(id).name}.`);
        }}
        onClose={() => overlays.close()}
      />

      <AboutModal open={overlays.isOpen("about")} onClose={overlays.close} />

      <SpecimenGridModal
        title="Gallery"
        subtitle={`All ${cells.length} brain topics`}
        open={overlays.isOpen("gallery")}
        searchable
        selectedId={selectedCellId}
        sections={[{ label: "All topics", items: cells }]}
        onSelect={(id) => {
          setSelectedCellId(id);
          overlays.close();
        }}
        onClose={() => overlays.close()}
      />

      <ShortcutsHelp open={overlays.isOpen("shortcuts")} onClose={() => overlays.close()} />
      <Toast message={toast} />
    </div>
  );
}
