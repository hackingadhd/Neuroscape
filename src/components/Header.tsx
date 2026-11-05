import { ArrowUpRight } from "lucide-react";
import type { CellItem } from "../data/cells";

type HeaderProps = {
  cell: CellItem;
  onGallery: () => void;
  onTour: () => void;
  accentId: string;
  onAccentChange: (id: string) => void;
};

export function Header({ onGallery, onTour }: HeaderProps) {
  return (
    <header className="topbar scape-topbar">
      <div className="brand-block">
        <p>Explore what happens in the ADHD brain</p>
      </div>

      <nav className="scape-nav" aria-label="Primary">
        <button type="button" className="scape-link" onClick={onTour}>
          Take the tour
        </button>
        <button type="button" className="scape-link" onClick={onGallery}>
          View all topics
        </button>
        <a className="scape-pill" href="https://substack.com/@hackingadhd" target="_blank" rel="noopener noreferrer">
          About me
          <ArrowUpRight size={15} />
        </a>
      </nav>
    </header>
  );
}
