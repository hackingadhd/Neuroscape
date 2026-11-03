import { useState } from "react";
import { Brain, ChevronDown, Grid3X3, Info, type LucideIcon } from "lucide-react";
import type { CellItem } from "../data/cells";
import { UserMenu } from "./UserMenu";

type HeaderProps = {
  cell: CellItem;
  onAbout: () => void;
  onGallery: () => void;
  accentId: string;
  onAccentChange: (id: string) => void;
};

export function Header({ cell, onAbout, onGallery, accentId, onAccentChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: { id: string; label: string; Icon: LucideIcon; onClick: () => void }[] = [
    { id: "gallery", label: "Gallery", Icon: Grid3X3, onClick: onGallery },
    { id: "about", label: "About", Icon: Info, onClick: onAbout },
  ];

  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-orb" aria-hidden="true">
          <Brain size={26} />
        </div>
        <div>
          <h1>Neuroscape</h1>
          <p>Explore what happens in the ADHD brain</p>
        </div>
      </div>

      <nav className="top-nav" aria-label="Primary">
        {navItems.map(({ id, label, Icon, onClick }) => (
          <button key={id} type="button" onClick={onClick}>
            <Icon size={24} />
            <span>{label}</span>
          </button>
        ))}
        <div className="avatar-wrap">
          <button
            className="avatar-button"
            type="button"
            aria-label="Theme menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="avatar-core" style={{ background: cell.accentSoft }}>
              <span style={{ background: cell.accent }} />
            </span>
            <ChevronDown size={20} />
          </button>
          <UserMenu
            open={menuOpen}
            accentId={accentId}
            onAccentChange={onAccentChange}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      </nav>
    </header>
  );
}
