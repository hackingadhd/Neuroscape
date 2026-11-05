import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cells, getCellById, NEURO_INFO, type BrainState, type ViewMode } from "./data/cells";
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
import { WelcomeScreen } from "./components/WelcomeScreen";
import { GuidedTour } from "./components/GuidedTour";
import { ResizeHandle } from "./components/ResizeHandle";
import { useOverlays } from "./hooks/useOverlays";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { openDropPanel, useDropPanels } from "./hooks/useDropPanels";
import { ACCENTS, loadAccent, saveAccent } from "./lib/theme";
import { scapeGradient } from "./lib/scapeGradient";

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
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const TOUR_KEY = "neuroscape-tour-seen";
  function startTour() {
    overlays.close();
    setShowTour(true);
  }
  function endTour() {
    setShowTour(false);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* ignore */
    }
  }
  function leaveWelcome() {
    setShowWelcome(false);
    let seen = false;
    try {
      seen = localStorage.getItem(TOUR_KEY) === "1";
    } catch {
      /* ignore */
    }
    // First visit: walk through the page once the welcome screen has gone
    if (!seen) window.setTimeout(() => setShowTour(true), 500);
  }
  // Width of the text area (left); the brain takes the rest. Remembered in this browser.
  const DEFAULT_TEXT_W = 590;
  const [textWidth, setTextWidth] = useState(() => {
    try {
      const v = Number(localStorage.getItem("neuroscape-text-width"));
      return v >= 300 ? v : DEFAULT_TEXT_W;
    } catch {
      return DEFAULT_TEXT_W;
    }
  });
  const [viewportW, setViewportW] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const textMax = Math.max(360, viewportW - 520);
  const textW = Math.min(textMax, Math.max(320, textWidth));
  useEffect(() => {
    try {
      localStorage.setItem("neuroscape-text-width", String(Math.round(textWidth)));
    } catch {
      /* ignore */
    }
  }, [textWidth]);
  const infoRail = useRef<HTMLElement>(null);
  useDropPanels(infoRail);
  // These dropdowns start open; the rest start closed
  useEffect(() => {
    for (const sel of [".signs-panel", ".cell-panel", ".journey-panel"]) openDropPanel(infoRail.current, sel);
  }, []);

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

  useKeyboardShortcuts(overlays.active === null && !showWelcome && !showTour, {
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
    "--scape": scapeGradient(selectedCell.id),
    "--scape-light": scapeGradient(selectedCell.id, 0.3),
    "--text-w": `${textW}px`,
  } as CSSProperties;

  return (
    <div className="app-shell" style={shellStyle}>
      <Header
        cell={selectedCell}
        onGallery={() => overlays.open("gallery")}
        onTour={startTour}
        accentId={accent.id}
        onAccentChange={(id) => {
          const next = ACCENTS.find((a) => a.id === id) ?? accent;
          setAccent(next);
          saveAccent(next.id);
        }}
      />

      <div className="app-grid">
        <aside className={`left-rail info-rail drop-rail ${textW < 520 ? "is-narrow" : ""} ${textW < 400 ? "is-tight" : ""}`} ref={infoRail}>
          <div className="info-wide">
            <BrainMapPanel
              selectedCell={selectedCell}
              onSelectCell={(id) => {
                setSelectedCellId(id);
                showToast(`Loaded ${getCellById(id).name}.`);
              }}
            />
            <SignsPanel />
            <JourneyPanel
              name={journey.name}
              color={NEURO_INFO[selectedCell.neuro].color}
              steps={journey.steps}
              index={journeyIndex}
              active={journeyActive}
              onStep={goToStep}
            />
          </div>
          <div className="info-col">
            <PartsPanel selectedCell={selectedCell} activeOrganelle={activeOrganelle} onSelectOrganelle={selectPart} />
            <BottomPanels cell={selectedCell} onCompare={() => overlays.open("comparison")} />
          </div>
          <div className="info-col">
            <InsightPanels cell={selectedCell} activeOrganelle={activeOrganelle} brainState={brainState} />
          </div>
        </aside>

        <ResizeHandle
          width={textW}
          min={320}
          max={textMax}
          onChange={setTextWidth}
          onReset={() => setTextWidth(DEFAULT_TEXT_W)}
        />

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
            onCompare={() => overlays.open("comparison")}
          />
        </div>

      </div>

      <ComparisonModal
        cell={selectedCell}
        journey={journey}
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
      <WelcomeScreen open={showWelcome} onEnter={leaveWelcome} />
      <GuidedTour open={showTour} onClose={endTour} />
    </div>
  );
}
