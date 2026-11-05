import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { CellItem } from "../data/cells";

type HeaderProps = {
  cell: CellItem;
  onAbout: () => void;
  onGallery: () => void;
  onTour: () => void;
  accentId: string;
  onAccentChange: (id: string) => void;
};

export function Header({ onAbout, onGallery, onTour }: HeaderProps) {
  return (
    <header className="topbar scape-topbar">
      <div className="brand-block">
        <a className="scape-back" href="../index.html#dashboard" title="Back to your Mindscape dashboard">
          <ArrowLeft size={18} />
          Mindscape
        </a>
        <p>Explore what happens in the ADHD brain</p>
      </div>

      <nav className="scape-nav" aria-label="Primary">
        <button type="button" className="scape-link" onClick={onTour}>
          Take the tour
        </button>
        <button type="button" className="scape-link" onClick={onGallery}>
          View all topics
        </button>
        <button type="button" className="scape-pill" onClick={onAbout}>
          About Neuroscape
          <ArrowUpRight size={15} />
        </button>
      </nav>
    </header>
  );
}
